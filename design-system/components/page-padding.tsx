import type { CSSProperties, ReactNode } from 'react';

/**
 * PagePadding — port of design_system/lib/core/components/page_padding.dart
 *
 * The 16px horizontal gutter every screen uses. Vertical defaults to 0 in the
 * source, and most screens let their first child's own margin supply the top
 * gap — so passing `padding` wholesale is usually better than adding vertical
 * here.
 */
export type PagePaddingProps = {
  children: ReactNode;
  /** Any CSS padding shorthand. Defaults to `0 16px`. */
  padding?: string;
  className?: string;
  style?: CSSProperties;
};

export function PagePadding({ children, padding, className, style }: PagePaddingProps) {
  return (
    <div className={className} style={{ padding: padding ?? '0 16px', ...style }}>
      {children}
    </div>
  );
}
