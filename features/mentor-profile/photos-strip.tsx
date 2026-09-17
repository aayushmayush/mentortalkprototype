'use client';

import { useState } from 'react';
import { AppIcon, AppLoadingSpinner } from '@/design-system';
import { PhotoViewer } from './photo-viewer';
import type { MentorPhoto } from '@/lib/fake/mentors';

/**
 * MentorPhotosStrip — port of
 * `ui/mentor_profile/widgets/mentor_photos_strip.dart`.
 *
 * A horizontal row of 220×220 thumbs with 16px page padding and 12px between
 * them. The last thumb is deliberately left half off the right edge — that peek
 * is what tells you the row scrolls, and it falls out of the fixed 220 size
 * rather than any special-casing.
 *
 * The viewer is opened from here rather than living alongside the strip,
 * because the strip is what knows which index was tapped.
 */

/** `_thumbSize`. */
const THUMB = 220;

export function PhotosStrip({ photos }: { photos: MentorPhoto[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  if (photos.length === 0) return null;

  return (
    <>
      <div
        className="no-scrollbar"
        style={{
          height: THUMB,
          display: 'flex',
          gap: 'var(--spacing-sm)',
          padding: '0 var(--page-padding-horizontal)',
          overflowX: 'auto',
          overflowY: 'hidden',
        }}
      >
        {photos.map((photo, index) => (
          <PhotoThumb
            key={photo.id}
            photo={photo}
            onTap={() => setOpenIndex(index)}
          />
        ))}
      </div>

      {openIndex !== null ? (
        <PhotoViewer
          photos={photos}
          initialIndex={openIndex}
          onClose={() => setOpenIndex(null)}
        />
      ) : null}
    </>
  );
}

/**
 * `_PhotoThumb` — the image, a grey loading panel while it decodes, and a grey
 * panel with a photo-library glyph if it fails.
 *
 * Both fallbacks are the same box with `surface.disabled` behind it, so a photo
 * that is loading and one that is broken are the same shape and only differ by
 * what sits in the middle.
 */
function PhotoThumb({ photo, onTap }: { photo: MentorPhoto; onTap: () => void }) {
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>('loading');

  return (
    <div
      onClick={onTap}
      style={{
        width: THUMB,
        height: THUMB,
        flex: '0 0 auto',
        borderRadius: 'var(--ds-radius-md)',
        overflow: 'hidden',
        background: 'var(--surface-disabled)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        position: 'relative',
      }}
    >
      {status === 'loading' ? <AppLoadingSpinner size="sm" /> : null}
      {status === 'error' ? (
        <AppIcon name="photoLibrary" color="var(--icon-secondary)" />
      ) : null}

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={photo.url}
        alt=""
        onLoad={() => setStatus('loaded')}
        onError={() => setStatus('error')}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          // Kept in the tree while loading so the load event still fires; the
          // grey panel above shows through until it does.
          opacity: status === 'loaded' ? 1 : 0,
          position: status === 'loaded' ? 'relative' : 'absolute',
        }}
      />
    </div>
  );
}
