'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppIcon, AppTopBar } from '@/design-system';
import { copy } from '@/lib/copy';

/**
 * HelpCenterPage — port of `ui/account/pages/help_center_page.dart`.
 *
 * ── The FAQ copy is NOT in the l10n table, and that is the source's choice ──
 *
 * Only the bar title (`helpCenter`) and the FAB label (`contactUs`) go through
 * `context.l10n`. All seven question/answer pairs are hardcoded English string
 * literals in the Dart — so a Hindi user gets a translated "Help Center" bar
 * over an English FAQ. The prototype reproduces that split rather than
 * "fixing" it, which is why these strings live in this file and not in
 * `lib/copy.ts` with everything else.
 *
 * ── This is the only page with a FAB, and it changes the page's shape ──────
 *
 * Every other page here is a bare scroll container. This one cannot be: a
 * `floatingActionButton` does not scroll with the body, and the prototype's
 * scroller is owned by `PhoneFrame`, so a `position: absolute` FAB placed
 * inside a scrolling page root would slide up and off as you read. The page
 * therefore takes the same shape the chat page does — a fixed-height flex
 * column whose ROOT does not scroll, with an inner div doing the scrolling and
 * the FAB absolutely positioned against the root. That also keeps the FAB
 * underneath the overlay layer, so a modal opened from here covers it, which
 * is the Flutter stacking order.
 *
 * ── The FAB is `bottom: 16`, `right: 16` ───────────────────────────────────
 *
 * Flutter's default `floatingActionButtonLocation` is `endFloat`, which insets
 * by `kFloatingActionButtonMargin` (16) on both edges, and `Scaffold` reserves
 * 80px of bottom padding in the list so the last FAQ tile can clear it. Both
 * numbers are reproduced — the 80 is in the source, the 16 is Flutter's.
 */

const PAGE_PADDING_HORIZONTAL = 'var(--spacing-md)'; // LayoutTokens.pagePaddingHorizontal

/**
 * Three groups, seven tiles. Verbatim from the Dart, including the curly
 * apostrophes question ("YouTube can't answer…") which is a straight quote in
 * the source and stays one here.
 */
const FAQ_GROUPS: { label: string; items: { q: string; a: string }[] }[] = [
  {
    label: 'GETTING STARTED',
    items: [
      {
        q: 'Why choose MentorTalk over coaching classes or YouTube?',
        a: "Coaching classes are expensive and one-size-fits-all. YouTube can't answer your specific doubts. MentorTalk gives you 1-on-1 access to real mentors who've cleared exams like JEE, NEET, and CUET — available instantly, in your language, at a fraction of the cost. You get personalized help exactly when you need it.",
      },
      {
        q: 'Can I try MentorTalk for free before subscribing?',
        a: "Yes! New users get free introductory chat minutes to experience the platform and connect with a mentor before spending anything. It's our way of letting you see the value firsthand — no credit card or commitment required to get started.",
      },
      {
        q: 'Which exams and subjects are covered?',
        a: "MentorTalk covers all major competitive exams including JEE (Main & Advanced), NEET, CUET, and board exams. You'll find mentors for Physics, Chemistry, Mathematics, Biology, and more — all organized by exam and subject so you can find exactly the help you need in seconds.",
      },
    ],
  },
  {
    label: 'PRICING & SESSIONS',
    items: [
      {
        q: 'What is the cost of a session?',
        a: "Session costs vary by mentor and are charged per minute, so you only pay for the time you actually use. Most sessions are very affordable — think of it as paying less than a cup of chai per minute for expert guidance. Each mentor's per-minute rate is clearly shown on their profile before you connect.",
      },
      {
        q: 'How does the pay-per-minute model work?',
        a: "You only pay for the minutes you spend in a session with your mentor. Add balance to your wallet, connect with a mentor, and billing runs automatically. End the session anytime — no packages, no commitments, no wastage. You're always in full control of your spending.",
      },
    ],
  },
  {
    label: 'TRUST & SAFETY',
    items: [
      {
        q: 'How are mentors verified on MentorTalk?',
        a: "Every mentor goes through a thorough verification process before they can teach on MentorTalk. We review their academic credentials, exam scores, and teaching ability. Only qualified mentors who meet our standards get approved — so you always learn from someone who's actually cracked the exam you're preparing for.",
      },
      {
        q: 'How does MentorTalk ensure student safety?',
        a: 'Absolutely. MentorTalk is designed to be safe for students aged 8 and above. All mentors are verified, sessions are monitored for quality, and we have strict content policies in place. Parents can feel confident that their child is getting genuine academic help in a secure environment.',
      },
    ],
  },
];

export function HelpCenterPage() {
  const router = useRouter();

  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--surface-page)',
        // The FAB is positioned against this box, so it has to be the
        // containing block. `PhoneFrame`'s screen already is `relative`, but
        // the page root is a flex child of the scroller, not the screen.
        position: 'relative',
      }}
    >
      <AppTopBar title={copy.helpCenter} onBack={() => router.back()} />

      <div
        className="no-scrollbar"
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          // `EdgeInsets.symmetric(horizontal: pagePaddingHorizontal, vertical: spacingSm)`
          padding: `var(--spacing-sm) ${PAGE_PADDING_HORIZONTAL}`,
        }}
      >
        {FAQ_GROUPS.map((group, gi) => (
          <div key={group.label}>
            {gi > 0 && <div style={{ height: 'var(--spacing-lg)' }} />}
            <SectionLabel label={group.label} />
            <div style={{ height: 'var(--spacing-xs)' }} />
            {group.items.map((item) => (
              <FaqTile key={item.q} question={item.q} answer={item.a} />
            ))}
          </div>
        ))}

        {/* `SizedBox(height: 80)` — room for the FAB so the last tile can be
            scrolled clear of it. A literal in the source, not a token. */}
        <div style={{ height: 80 }} />
      </div>

      <ContactUsFab onPress={() => router.push('/support')} />
    </div>
  );
}

/**
 * `_SectionLabel` — 11px, w600, letterSpacing 0.8, `text.bodyLight`, inset 4
 * from the left and `spacingSm` from the top.
 *
 * The 11px is below the DS type scale's smallest step and the letter-spacing is
 * set by hand, so this is inline styles rather than a type class — the same
 * treatment the page gives it. `paddingTop: spacingSm` on the first group
 * stacks with the list's own `spacingSm` vertical padding, which is the
 * source's (a `Padding` inside a `ListView` with `padding`), not a mistake.
 */
function SectionLabel({ label }: { label: string }) {
  return (
    <div
      style={{
        paddingLeft: 4,
        paddingTop: 'var(--spacing-sm)',
        color: 'var(--text-body-light)',
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: 0.8,
      }}
    >
      {label}
    </div>
  );
}

/**
 * `_FaqTile` — a full-width card that expands IN PLACE.
 *
 * `horizontal: 16, vertical: 14` and `borderRadiusMd`, with 8px below each tile
 * (a hardcoded `SizedBox`, not `spacingXs`, even though they are the same
 * number today — the source writes the literal, so this does too).
 *
 * The answer is `13px / height 1.5` in `text.bodyLight`, and the 10px gap
 * above it is a literal. The chevron is `AppIcon.sm` (20) in `icon.primary` and
 * flips between `chevronDown` and `chevronUp` — the two distinct glyphs, not
 * one rotated glyph.
 */
function FaqTile({ question, answer }: { question: string; answer: string }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div style={{ paddingBottom: 8 }}>
      <div
        role="button"
        tabIndex={0}
        aria-expanded={expanded}
        onClick={() => setExpanded((v) => !v)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setExpanded((v) => !v);
          }
        }}
        style={{
          width: '100%',
          boxSizing: 'border-box',
          padding: '14px 16px',
          background: 'var(--surface-primary)',
          borderRadius: 'var(--ds-radius-md)',
          cursor: 'pointer',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div
            style={{
              flex: 1,
              minWidth: 0,
              color: 'var(--text-heading)',
              fontSize: 14,
              fontWeight: 500,
            }}
          >
            {question}
          </div>
          <div style={{ width: 12 }} />
          <AppIcon
            name={expanded ? 'chevronUp' : 'chevronDown'}
            size="sm"
            color="var(--icon-primary)"
          />
        </div>

        {expanded && (
          <>
            <div style={{ height: 10 }} />
            <div
              style={{
                color: 'var(--text-body-light)',
                fontSize: 13,
                lineHeight: 1.5,
              }}
            >
              {answer}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/**
 * `_ContactUsFab` — a pill, not a circle: `20px 14px` padding, radius 28,
 * `surface.action`, with the label then an 8px gap then a 20px chat glyph.
 *
 * `MainAxisSize.min` is what makes it hug its content; in CSS that is
 * `width: fit-content` on the flex row. Radius 28 is a literal in the source
 * (a pill is `height / 2` and the height here is 48), not `borderRadiusLg`.
 */
function ContactUsFab({ onPress }: { onPress: () => void }) {
  return (
    <button
      type="button"
      onClick={onPress}
      style={{
        position: 'absolute',
        // Flutter's `endFloat` margin.
        right: 16,
        bottom: 16,
        display: 'flex',
        alignItems: 'center',
        width: 'fit-content',
        padding: '14px 20px',
        border: 'none',
        borderRadius: 28,
        background: 'var(--surface-action)',
        cursor: 'pointer',
      }}
    >
      <span
        style={{
          color: 'var(--text-on-action)',
          fontSize: 14,
          fontWeight: 600,
        }}
      >
        {copy.contactUs}
      </span>
      <div style={{ width: 8 }} />
      <AppIcon name="chat" px={20} color="var(--icon-on-action)" />
    </button>
  );
}
