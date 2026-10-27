import React from 'react';
import { isCorrect } from '../domain/grading';
import { WRONG_BOOK_EXIT_STREAK } from '../domain/stats';
import type { Question } from '../domain/types';
import { useBank } from '../state/bank';
import { useAppData } from '../state/store';
import { NoteEditor } from './NoteEditor';
import { RichText } from './RichText';
import { StarButton } from './StarButton';

interface AnswerRevealProps {
  question: Question;
  userAnswer?: readonly string[];
  /** Show a right/wrong banner for the user's answer. */
  showResult?: boolean;
}

export const AnswerReveal: React.FC<AnswerRevealProps> = ({ question, userAnswer, showResult = false }) => {
  const { bank } = useBank();
  const stat = useAppData().stats[question.id];
  const correct = isCorrect(question, userAnswer);
  const answerText = question.answer.join('、');

  return (
    <div className="reveal">
      {showResult ? (
        <div className={`reveal-status ${correct ? 'is-correct' : 'is-wrong'}`}>
          {correct ? '回答正确' : `回答错误，正确答案是 ${answerText}`}
        </div>
      ) : (
        <div className="reveal-answer">正确答案：{answerText}</div>
      )}
      {question.explanation ? (
        <div className="reveal-basis">
          <div className="reveal-label">{bank.explanationLabel ?? '解析'}</div>
          <RichText content={question.explanation} format={bank.contentFormat} />
        </div>
      ) : null}
      {stat && stat.attempts > 0 ? (
        <div className="reveal-meta">
          累计做 {stat.attempts} 次，错 <strong className={stat.wrongCount > 0 ? 'text-danger' : ''}>{stat.wrongCount}</strong> 次
          {stat.inWrongBook ? ` · 在错题本中（连对 ${stat.correctStreak}/${WRONG_BOOK_EXIT_STREAK} 次后移出）` : ''}
        </div>
      ) : null}
      <div className="reveal-actions">
        <StarButton questionId={question.id} starred={stat?.starred ?? false} withLabel />
        <NoteEditor key={stat?.note ?? ''} questionId={question.id} note={stat?.note} />
      </div>
    </div>
  );
};
