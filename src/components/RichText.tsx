import React, { lazy, Suspense } from 'react';
import type { ContentFormat } from '../domain/types';

const MarkdownView = lazy(() => import('./MarkdownView'));

interface RichTextProps {
  content: string;
  format: ContentFormat;
  className?: string;
}

/** Plain text keeps line breaks; markdown (images, tables, ...) is loaded on demand. */
export const RichText: React.FC<RichTextProps> = ({ content, format, className }) => {
  const classes = ['rich-text', className].filter(Boolean).join(' ');
  if (format === 'text') return <span className={classes}>{content}</span>;
  return (
    <Suspense fallback={<span className={classes}>{content}</span>}>
      <MarkdownView content={content} className={classes} />
    </Suspense>
  );
};
