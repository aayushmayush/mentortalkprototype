import { AppAvatar, AppListTile, AppOnlineBadge } from '@/design-system';
import { buildActivityPreview, formatTimestamp, type MentorInboxItem } from '@/lib/fake/chats';
import { copy } from '@/lib/copy';

/**
 * MentorInboxCard — port of `ui/core/widgets/mentor_inbox_card.dart`.
 *
 * Shared by Recent Sessions on the home feed and the Order History list, which
 * is why it sits in `components/` rather than under either feature.
 *
 * The leading avatar carries an `AppOnlineBadge` driven by the mentor's
 * presence — and note that `inSession` is *not* the same as offline: the badge
 * renders busy, which is a distinct treatment from merely greyed out.
 *
 * The subtitle prefixes an emoji for calls (`📞` / `🎥`) and nothing for text,
 * so the activity type is legible without a separate icon column.
 */
export function MentorInboxCard({
  mentor,
  onTap,
}: {
  mentor: MentorInboxItem;
  onTap: () => void;
}) {
  return (
    <AppListTile
      onClick={onTap}
      title={mentor.name}
      subtitle={buildActivityPreview(mentor.lastActivity)}
      leading={
        <AppAvatar
          size="sm"
          imageUrl={mentor.avatar}
          name={mentor.name}
          badge={
            <AppOnlineBadge
              isOnline={mentor.presence === 'online'}
              isBusy={mentor.presence === 'inSession'}
            />
          }
        />
      }
      trailing={
        <span className="type-label-sm" style={{ color: 'var(--text-body-light)', whiteSpace: 'nowrap' }}>
          {formatTimestamp(mentor.lastSessionAt, copy.yesterday)}
        </span>
      }
    />
  );
}
