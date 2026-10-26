import React, { useState } from 'react';
import { setNote } from '../state/actions';

interface NoteEditorProps {
  questionId: string;
  note?: string;
}

export const NoteEditor: React.FC<NoteEditorProps> = ({ questionId, note }) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(note ?? '');

  const startEditing = (): void => {
    setDraft(note ?? '');
    setEditing(true);
  };
  const save = (): void => {
    setNote(questionId, draft);
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="note-editor">
        <textarea
          className="note-input"
          value={draft}
          rows={3}
          autoFocus
          placeholder="记一下易混点，例如：注意是「三分之二」不是「二分之一」"
          onChange={(event) => setDraft(event.target.value)}
        />
        <div className="note-buttons">
          <button type="button" className="button button-ghost button-small" onClick={() => setEditing(false)}>
            取消
          </button>
          <button type="button" className="button button-primary button-small" onClick={save}>
            保存笔记
          </button>
        </div>
      </div>
    );
  }

  return note ? (
    <button type="button" className="note-view" onClick={startEditing}>
      <span className="note-label">笔记</span>
      <span className="rich-text">{note}</span>
    </button>
  ) : (
    <button type="button" className="button button-ghost button-small" onClick={startEditing}>
      写笔记
    </button>
  );
};
