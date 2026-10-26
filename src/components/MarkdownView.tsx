import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownViewProps {
  content: string;
  className?: string;
}

const MarkdownView: React.FC<MarkdownViewProps> = ({ content, className }) => (
  <div className={`markdown ${className ?? ''}`}>
    <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
  </div>
);

export default MarkdownView;
