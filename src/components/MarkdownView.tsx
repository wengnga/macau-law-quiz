import React from 'react';
import ReactMarkdown, { defaultUrlTransform } from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownViewProps {
  content: string;
  className?: string;
}

const INLINE_SVG = 'data:image/svg+xml;base64,';

/** Charts are inlined as base64 SVG so banks work offline; any other data: URL is still stripped. */
const urlTransform = (url: string, key: string): string => (key === 'src' && url.startsWith(INLINE_SVG) ? url : defaultUrlTransform(url));

const MarkdownView: React.FC<MarkdownViewProps> = ({ content, className }) => (
  <div className={`markdown ${className ?? ''}`}>
    <ReactMarkdown remarkPlugins={[remarkGfm]} urlTransform={urlTransform}>
      {content}
    </ReactMarkdown>
  </div>
);

export default MarkdownView;
