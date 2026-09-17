'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  AppBottomSheet,
  AppIcon,
  AppListTile,
  AppLoadingSpinner,
  AppModal,
  AppTextField,
  AppTopBar,
} from '@/design-system';
import { AppErrorView } from '@/components/app-error-view';
import { copy, fill } from '@/lib/copy';
import {
  useEditProfile,
  useEditProfileEmptyFlag,
  type EditEducationEntry,
  type EditProfileFault,
} from '@/lib/state/edit-profile-provider';
import { useProfile } from '@/lib/state/profile-provider';
import { useSnackbar } from '@/lib/state/snackbar-provider';
import { generateUsername, validateUsername } from '@/lib/username';

/**
 * EditProfilePage — port of `ui/edit_profile/pages/edit_profile_page.dart`.
 *
 * Three states over one `BlocConsumer`: a centred spinner, `AppErrorView` with
 * a retry, or the form. Note which state is NOT here — `saved()` renders
 * `SizedBox.shrink()`, an empty frame, because the listener pops the route in
 * the same tick. The prototype has no such frame to render; the save resolves
 * and the page navigates.
 *
 * ── Back ARROW and system back are one code path, deliberately ─────────────
 *
 * The source wraps the whole page in `PopScope(canPop: false)` and routes both
 * the app-bar arrow and Android's back gesture through `_handleBackRequested`
 * — whose comment records the bug that arrangement fixes: "Previously the system
 * back popped the route without saving — app-bar back saved, phone back
 * silently dropped." So back is not "leave": it is **save if there is anything
 * to save**, and only pop otherwise.
 *
 * A browser has one back path (history) and it cannot be intercepted without
 * hijacking the session, so the arrow carries the whole behaviour here and
 * browser-back is left alone. That is a real gap and it is the reason the arrow
 * is the only exit the screen is designed around.
 *
 * ── The username field has TWO error sources and one slot ──────────────────
 *
 * `_usernameError` is local and set by `UsernameValidator` before any request
 * leaves the device; `serverUsernameError` comes back on a 409 and lives in the
 * bloc. The field shows `_usernameError ?? serverUsernameError`, local first —
 * and typing clears only the local one, so a 409's message survives until the
 * next save attempt. Reproduced exactly; a "clear both on edit" port would be
 * friendlier and wrong.
 *
 * ── Query switches, all prototype-only ─────────────────────────────────────
 *
 * `?sim=error`      the profile fetch failed → `AppErrorView` + retry
 * `?sim=catalogue`  the profile loaded but the category fetch threw — the
 *                   bloc's other load failure, with its own message
 * `?empty=1`        both lists start empty → the "Tap to select exams" block
 *                   and the Add-education card
 * `?fail=...`       which write the simulated server rejects — see
 *                   `EditProfileFault`. Without it, four error paths in the bloc
 *                   ("Failed to add education" and friends) have no way to run.
 */

export function EditProfilePage() {
  const router = useRouter();
  const params = useSearchParams();
  const snackbar = useSnackbar();
  const home = useProfile();
  const edit = useEditProfile();
  const setEmptyFlag = useEditProfileEmptyFlag();

  const { failLoad, failCatalogue, setFault, reload, clearUsernameError } = edit;

  // Read as strings, not as the `params` object: `useSearchParams()` hands back a
  // fresh object often enough that depending on it re-runs the boot effect, and
  // that effect calls `reload()` — which sets state — so the pair would loop.
  const sim = params.get('sim');
  const fail = params.get('fail');
  const empty = params.get('empty');

  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [localUsernameError, setLocalUsernameError] = useState<string | null>(null);
  const [photoSheetOpen, setPhotoSheetOpen] = useState(false);
  const [confirmRemoveOpen, setConfirmRemoveOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<EditEducationEntry | null>(null);

  /**
   * `_initializeForm` runs ONCE, guarded by `_isInitialized`, and it writes the
   * loaded values into the controllers from a POST-FRAME callback.
   *
   * The one-shot guard is load-bearing and it is why this is a ref rather than a
   * plain effect: the fields are uncontrolled-ish in the source and the bloc
   * emits new `loaded` states on every write (a category save, an education
   * add), so an unguarded effect would stamp the server's values back over
   * whatever you were typing at that moment.
   */
  const initialized = useRef(false);

  const loaded = edit.profile;

  useEffect(() => {
    if (loaded === null || initialized.current) return;
    initialized.current = true;
    setName(loaded.displayName);
    setUsername(loaded.username);
  }, [loaded]);

  // The URL drives the simulation, so reloading the same URL reproduces the
  // same state — the contract `/home?sim=` and `/settings/privacy?sim=` follow.
  useEffect(() => {
    setEmptyFlag(empty === '1');
    setFault(isFault(fail) ? fail : 'none');
    if (sim === 'error') failLoad();
    else if (sim === 'catalogue') failCatalogue();
    else reload();
  }, [sim, fail, empty, failLoad, failCatalogue, reload, setFault, setEmptyFlag]);

  const hasChanges =
    name.trim() !== (loaded?.displayName ?? '') ||
    username.trim() !== (loaded?.username ?? '');

  const isFormValid = name.trim().length > 0 && username.trim().length > 0;

  /**
   * `_onSave`. The format check runs first and never reaches the server — so an
   * invalid username costs no round-trip and shows under the field immediately.
   */
  const save = async () => {
    const trimmed = username.trim();
    const formatError = validateUsername(trimmed);
    if (formatError !== null) {
      setLocalUsernameError(formatError);
      return;
    }
    setLocalUsernameError(null);

    const outcome = await edit.saveNameAndUsername(name.trim(), trimmed);

    if (outcome.kind === 'conflict') {
      // The 409 lands under the field, not in a snackbar — and the screen stays.
      return;
    }
    if (outcome.kind === 'error') {
      snackbar.show(outcome.message);
      return;
    }

    // `HomeBloc.refreshRequested()` — the account tab's name and username must
    // change with them, and `ProfileProvider` is where the app reads them.
    home.update({ displayName: name.trim(), username: trimmed });
    snackbar.show(copy.profileUpdated);
    router.back();
  };

  /** `_handleBackRequested` — see the header. */
  const handleBack = () => {
    if (loaded !== null && hasChanges && isFormValid && !loaded.isSaving) {
      void save();
      return;
    }
    router.back();
  };

  const onPickPhoto = async () => {
    setPhotoSheetOpen(false);
    const ok = await edit.uploadPhoto();
    if (!ok) snackbar.show(copy.somethingWentWrongFull);
  };

  const onRemovePhoto = async () => {
    setConfirmRemoveOpen(false);
    const ok = await edit.removePhoto();
    if (!ok) snackbar.show(copy.somethingWentWrongFull);
  };

  const onDeleteEducation = async (entry: EditEducationEntry) => {
    const ok = await edit.deleteEducation(entry.id);
    if (!ok) snackbar.show(copy.failedToDeleteEducation);
  };

  const chips = useMemo(
    () =>
      loaded === null
        ? []
        : edit.availableCategories.filter((c) =>
            loaded.selectedCategoryIds.includes(c.id),
          ),
    [edit.availableCategories, loaded],
  );

  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--surface-page)',
      }}
    >
      <AppTopBar title={copy.editProfile} onBack={handleBack} />

      {edit.status === 'loading' || edit.status === 'idle' ? (
        <div
          style={{
            flex: 1,
            minHeight: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <AppLoadingSpinner size="md" />
        </div>
      ) : edit.status === 'error' ? (
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
          <AppErrorView message={edit.errorMessage} onRetry={edit.reload} />
        </div>
      ) : loaded === null ? null : (
        <div
          className="no-scrollbar"
          style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '16px 24px' }}
        >
          {/* ── Photo ─────────────────────────────────────────────────── */}
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <EditProfilePhoto
              photoUrl={loaded.profilePhotoUrl}
              isUploading={loaded.isUploadingPhoto}
              onTap={() => {
                if (!loaded.isUploadingPhoto) setPhotoSheetOpen(true);
              }}
            />
          </div>

          <div style={{ height: 'var(--spacing-md)' }} />

          <div style={{ textAlign: 'center' }}>
            <span className="type-body-lg" style={{ color: 'var(--text-body-light)' }}>
              {loaded.phoneNumber}
            </span>
          </div>

          <div style={{ height: 'var(--spacing-xl)' }} />

          {/* ── Personal info ─────────────────────────────────────────── */}
          <SectionHeader title={copy.personalInfo} />
          <div style={{ height: 'var(--spacing-sm)' }} />

          <AppTextField label={copy.fullName} value={name} onChange={setName} />

          <div style={{ height: 'var(--spacing-md)' }} />

          <AppTextField
            label={copy.username}
            value={username}
            onChange={(next) => {
              setUsername(next);
              // `_clearUsernameErrorOnEdit` + `_onFieldChanged`: typing clears
              // the LOCAL error only. The server's 409 stays until the next save.
              if (localUsernameError !== null) setLocalUsernameError(null);
              clearUsernameError();
            }}
            errorText={localUsernameError ?? loaded.usernameError}
            maxLength={30}
            suffixIcon={
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  setUsername(generateUsername());
                }}
                style={{ cursor: 'pointer', display: 'flex' }}
                title="Generate a username"
              >
                <AppIcon name="refresh" size="sm" color="var(--text-body-light)" />
              </div>
            }
          />

          <div style={{ height: 'var(--spacing-lg)' }} />

          {/* ── Categories ────────────────────────────────────────────── */}
          <SectionHeader title={copy.categories} />
          <div style={{ height: 12 }} />
          <ReadOnlyChips
            categories={chips}
            selectedOptionIds={loaded.selectedOptionIds}
            onTap={() => router.push('/edit-profile/categories')}
          />

          <div style={{ height: 24 }} />

          {/* ── Education ─────────────────────────────────────────────── */}
          <SectionHeader title={copy.education} />
          <div style={{ height: 12 }} />

          {loaded.isSavingEducation ? (
            <div style={{ paddingBottom: 12 }}>
              <AppListTile
                leading={<AppLoadingSpinner size="md" />}
                title={
                  loaded.isUpdatingEducation
                    ? copy.updatingEducation
                    : copy.addingEducation
                }
              />
            </div>
          ) : null}

          {loaded.education.map((entry) => (
            <div key={entry.id} style={{ paddingBottom: 8 }}>
              <EducationCard
                entry={entry}
                onEdit={() => router.push(`/edit-profile/add-education?id=${entry.id}`)}
                onDelete={() => setPendingDelete(entry)}
              />
            </div>
          ))}

          {loaded.education.length === 0 && !loaded.isSavingEducation ? (
            <AddCard
              label={copy.addEducation}
              onTap={() => router.push('/edit-profile/add-education')}
            />
          ) : null}

          <div style={{ height: 32 }} />
        </div>
      )}

      {/* ── The photo action sheet ──────────────────────────────────────
          `showModalBottomSheet` with SafeArea + `mainAxisSize.min`: three rows,
          the last of which exists only when there is a photo to delete. The
          Delete row is the only destructive one — glyph AND label in
          `text.error`, where the other two use `icon.primary`. */}
      <AppBottomSheet open={photoSheetOpen} onClose={() => setPhotoSheetOpen(false)}>
        <div style={{ paddingTop: 8, paddingBottom: 8 }}>
          <AppListTile
            title={copy.camera}
            leading={<AppIcon name="camera" size="md" color="var(--icon-primary)" />}
            onClick={() => void onPickPhoto()}
          />
          <AppListTile
            title={copy.gallery}
            // Raw `Icons.photo_library` — solid, not the `AppIcons.photoLibrary`
            // outline the rest of the app uses. See icons.ts.
            leading={<AppIcon name="galleryFilled" size="md" color="var(--icon-primary)" />}
            onClick={() => void onPickPhoto()}
          />
          {loaded?.profilePhotoUrl ? (
            <AppListTile
              title={copy.deletePhoto}
              leading={<AppIcon name="delete" size="md" color="var(--text-error)" />}
              // The source colours the LABEL too, which `AppListTile` does not
              // expose — so the row's destructive treatment is carried by the
              // glyph alone here. Noted rather than worked around; see the
              // completion note.
              onClick={() => {
                setPhotoSheetOpen(false);
                setConfirmRemoveOpen(true);
              }}
            />
          ) : null}
        </div>
      </AppBottomSheet>

      <AppModal
        open={confirmRemoveOpen}
        title={copy.removePhotoTitle}
        message={copy.removePhotoMessage}
        actions={[
          { label: copy.cancel, onPress: () => setConfirmRemoveOpen(false) },
          { label: copy.remove, onPress: () => void onRemovePhoto(), destructive: true },
        ]}
        onClose={() => setConfirmRemoveOpen(false)}
      />

      <AppModal
        open={pendingDelete !== null}
        title={copy.deleteEducationTitle}
        message={fill(copy.deleteEducationMessage, {
          name: pendingDelete?.institution ?? '',
        })}
        actions={[
          { label: copy.cancel, onPress: () => setPendingDelete(null) },
          {
            label: copy.delete,
            destructive: true,
            onPress: () => {
              const entry = pendingDelete;
              setPendingDelete(null);
              if (entry !== null) void onDeleteEducation(entry);
            },
          },
        ]}
        onClose={() => setPendingDelete(null)}
      />
    </div>
  );
}

/** `_SectionHeader` — `titleMedium` at `w600` in `text.heading`. */
function SectionHeader({ title }: { title: string }) {
  return (
    <div
      className="type-title-md type-emphasis-semibold"
      style={{ color: 'var(--text-heading)' }}
    >
      {title}
    </div>
  );
}

/**
 * `EditProfilePhoto` — port of `ui/edit_profile/widgets/edit_profile_photo.dart`.
 *
 * 100 × 100, a 50-radius `CircleAvatar` whose background is `surface.PAGE` —
 * not `surface.primary`. Against a page that is also `surface.page` the circle
 * is therefore invisible until an image loads into it, and the only visible
 * chrome is the camera badge. That is the source's choice, and it is why a
 * no-photo profile reads as a floating camera button rather than as an empty
 * avatar.
 *
 * The placeholder image is `packages/design_system/assets/images/placeholder_profile.png`,
 * which the prototype does not ship — so the no-photo state here is the bare
 * circle, which is what that asset renders as anyway (a grey silhouette on a
 * page-coloured ground).
 */
function EditProfilePhoto({
  photoUrl,
  isUploading,
  onTap,
}: {
  photoUrl: string | null;
  isUploading: boolean;
  onTap: () => void;
}) {
  return (
    <div
      onClick={onTap}
      style={{
        position: 'relative',
        width: 100,
        height: 100,
        cursor: isUploading ? 'default' : 'pointer',
      }}
    >
      <div
        style={{
          width: 100,
          height: 100,
          borderRadius: '50%',
          background: 'var(--surface-page)',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {photoUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={photoUrl}
            alt=""
            style={{ width: 100, height: 100, objectFit: 'cover' }}
          />
        ) : null}
      </div>

      {/* `Colors.black.withValues(alpha: 0.4)` + a 28px white spinner. */}
      {isUploading ? (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            background: 'rgba(0,0,0,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <AppLoadingSpinner size="sm" color="#ffffff" />
        </div>
      ) : null}

      {!isUploading ? (
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            right: 0,
            padding: 4,
            borderRadius: '50%',
            background: 'var(--surface-action)',
            display: 'flex',
          }}
        >
          <AppIcon name="camera" size="sm" color="var(--icon-on-action)" />
        </div>
      ) : null}
    </div>
  );
}

/**
 * `_ReadOnlyChips` — the exam block, which is a BUTTON, not a display.
 *
 * Both branches are a full-width `surface.primary` card at radius 16 with the
 * same tap handler; only the contents differ. The empty branch is 16px of
 * vertical padding around one centred line; the filled branch is 16px all round
 * around a stack of category names, each followed by its chosen areas as pills
 * in `surface.shadow`.
 *
 * The `GestureDetector` is `HitTestBehavior.opaque`, which is what makes the
 * EMPTY branch's whitespace tappable rather than just its text — the whole card
 * is the target, and that is the difference between "tap to select exams" being
 * a label and being a button.
 */
function ReadOnlyChips({
  categories,
  selectedOptionIds,
  onTap,
}: {
  categories: { id: string; name: string; options: { id: string; name: string }[] }[];
  selectedOptionIds: string[];
  onTap: () => void;
}) {
  if (categories.length === 0) {
    return (
      <div
        onClick={onTap}
        style={{
          width: '100%',
          padding: '16px 0',
          background: 'var(--surface-primary)',
          borderRadius: 16,
          textAlign: 'center',
          cursor: 'pointer',
        }}
      >
        <span className="type-body-md" style={{ color: 'var(--text-body-light)' }}>
          {copy.tapToSelectExams}
        </span>
      </div>
    );
  }

  return (
    <div
      onClick={onTap}
      style={{
        width: '100%',
        padding: 'var(--spacing-md)',
        background: 'var(--surface-primary)',
        borderRadius: 16,
        cursor: 'pointer',
      }}
    >
      {categories.map((category, i) => {
        const chosen = category.options.filter((o) => selectedOptionIds.includes(o.id));
        return (
          <div key={category.id}>
            <div
              className="type-title-sm type-emphasis-semibold"
              style={{ color: 'var(--text-heading)' }}
            >
              {category.name}
            </div>

            {chosen.length > 0 ? (
              <>
                <div style={{ height: 'var(--spacing-xs)' }} />
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 'var(--spacing-xs)',
                  }}
                >
                  {chosen.map((option) => (
                    <div
                      key={option.id}
                      style={{
                        padding: '6px 12px',
                        background: 'var(--surface-shadow)',
                        borderRadius: 24,
                      }}
                    >
                      <span
                        className="type-label-md"
                        style={{ color: 'var(--text-body)' }}
                      >
                        {option.name}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : null}

            {i < categories.length - 1 ? (
              <div style={{ height: 'var(--spacing-md)' }} />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

/**
 * `_EducationCard` — tap anywhere to edit, tap the bin to delete.
 *
 * The bin is a nested `GestureDetector` inside the card's own, so in Flutter it
 * wins the gesture arena and the card's `onEdit` does not also fire. A DOM
 * `onClick` on a child does NOT stop propagation by itself, so the delete
 * handler has to call `stopPropagation` explicitly — otherwise the same tap
 * would open the edit page behind the delete dialog.
 */
function EducationCard({
  entry,
  onEdit,
  onDelete,
}: {
  entry: EditEducationEntry;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const yearRange = [
    entry.startYear !== null ? String(entry.startYear) : null,
    entry.endYear !== null ? String(entry.endYear) : null,
  ]
    .filter((y): y is string => y !== null)
    .join(' - ');

  return (
    <div
      onClick={onEdit}
      style={{
        padding: 16,
        background: 'var(--surface-primary)',
        borderRadius: 16,
        display: 'flex',
        alignItems: 'flex-start',
        gap: 8,
        cursor: 'pointer',
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          className="type-title-md type-emphasis-semibold"
          style={{ color: 'var(--text-heading)' }}
        >
          {entry.institution}
        </div>
        <div style={{ height: 2 }} />
        <div className="type-body-md" style={{ color: 'var(--text-body)' }}>
          {entry.degree}
          {entry.fieldOfStudy !== null ? `, ${entry.fieldOfStudy}` : ''}
        </div>
        {yearRange.length > 0 ? (
          <>
            <div style={{ height: 2 }} />
            <div className="type-body-sm" style={{ color: 'var(--text-body-light)' }}>
              {yearRange}
            </div>
          </>
        ) : null}
      </div>

      <div
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        style={{ display: 'flex', cursor: 'pointer' }}
      >
        <AppIcon name="delete" size="md" color="var(--icon-primary)" />
      </div>
    </div>
  );
}

/**
 * `_AddCard` — the empty-state card. Glyph over label, both centred, the label
 * in `text.bodyLight` rather than `text.heading`: it is a prompt, not content.
 */
function AddCard({ label, onTap }: { label: string; onTap: () => void }) {
  return (
    <div
      onClick={onTap}
      style={{
        width: '100%',
        padding: 'var(--spacing-md) 0',
        background: 'var(--surface-primary)',
        borderRadius: 16,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        cursor: 'pointer',
      }}
    >
      <AppIcon name="plus" size="md" color="var(--icon-primary)" />
      <div style={{ height: 'var(--spacing-2xs)' }} />
      <span className="type-title-md" style={{ color: 'var(--text-body-light)' }}>
        {label}
      </span>
    </div>
  );
}

const FAULTS: EditProfileFault[] = ['categories', 'add', 'update', 'delete', 'photo'];

function isFault(value: string | null): value is EditProfileFault {
  return value !== null && (FAULTS as string[]).includes(value);
}
