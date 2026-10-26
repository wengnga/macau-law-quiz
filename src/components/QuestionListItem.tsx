import React, { useState } from 'react';
import type { Question } from '../domain/types';
import { useBank } from '../state/bank';
import { AnswerReveal } from './AnswerReveal';
import { QuestionView } from './question/QuestionView';

interface QuestionListItemProps {
  question: Question;
  userAnswer?: readonly string[];
  /** Badges shown next to the section label, e.g. wrong count. */
  meta?: React.ReactNode;
  /** Extra buttons shown when expanded. */
  actions?: React.ReactNode;
}

export const QuestionListItem: React.FC<QuestionListItemProps> = ({ question, userAnswer, meta, actions }) => {
  const { bank, sectionsById, materialsById } = useBank();
  const [open, setOpen] = useState(false);
  const section = sectionsById.get(question.sectionId);
  const material = question.materialId ? materialsById.get(question.materialId) : undefined;

  return (
    <div className={`card qitem ${open ? 'is-open' : ''}`}>
      <button type="button" className="qitem-head" onClick={() => setOpen((value) => !value)} aria-expanded={open}>
        <div className="qitem-tags">
          <span className="tag">
            {section?.shortTitle ?? question.sectionId} · 第 {question.no} 题
          </span>
          {meta}
        </div>
        <div className={`qitem-stem rich-text ${open ? '' : 'clamp-2'}`}>{question.stem}</div>
      </button>
      {open ? (
        <div className="qitem-body">
          <QuestionView
            question={question}
            material={material}
            format={bank.contentFormat}
            selected={userAnswer}
            reveal
            disabled
            hideStem
          />
          <AnswerReveal question={question} userAnswer={userAnswer} showResult={userAnswer !== undefined} />
          {actions ? <div className="qitem-actions">{actions}</div> : null}
        </div>
      ) : null}
    </div>
  );
};
