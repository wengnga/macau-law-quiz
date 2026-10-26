import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AnswerReveal } from '../components/AnswerReveal';
import { GridIcon } from '../components/Icons';
import { Page } from '../components/Page';
import { QuestionView } from '../components/question/QuestionView';
import { StarButton } from '../components/StarButton';
import { isAnswered, isCorrect } from '../domain/grading';
import type { ActiveSession, Question } from '../domain/types';
import { formatClock, MODE_LABELS } from '../helpers/format';
import { useNow } from '../hooks/useNow';
import { answerQuestion, finishSession, goToIndex } from '../state/actions';
import { useBank } from '../state/bank';
import { useAppData } from '../state/store';

const SWIPE_MIN_PX = 60;

interface AnswerSheetProps {
  session: ActiveSession;
  questionsById: ReadonlyMap<string, Question>;
  onPick: (index: number) => void;
  onClose: () => void;
}

const AnswerSheet: React.FC<AnswerSheetProps> = ({ session, questionsById, onPick, onClose }) => (
  <div className="sheet-backdrop" onClick={onClose} role="presentation">
    <div className="sheet" role="dialog" aria-label="答题卡" onClick={(event) => event.stopPropagation()}>
      <div className="sheet-header">
        <span className="card-title">答题卡</span>
        <button type="button" className="link" onClick={onClose}>
          关闭
        </button>
      </div>
      <div className="sheet-grid">
        {session.questionIds.map((id, index) => {
          const answer = session.answers[id];
          const question = questionsById.get(id);
          const state = !isAnswered(answer)
            ? 'empty'
            : session.mode === 'exam' || !question
              ? 'answered'
              : isCorrect(question, answer)
                ? 'correct'
                : 'wrong';
          return (
            <button
              key={id}
              type="button"
              className={`sheet-cell sheet-${state} ${index === session.index ? 'is-current' : ''}`}
              onClick={() => onPick(index)}
            >
              {index + 1}
            </button>
          );
        })}
      </div>
    </div>
  </div>
);

export const QuizPage: React.FC = () => {
  const data = useAppData();
  const { bank, questionsById, sectionsById, materialsById } = useBank();
  const navigate = useNavigate();
  const [sheetOpen, setSheetOpen] = useState(false);
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  const session = data.activeSession?.bankId === bank.id ? data.activeSession : null;
  const questionId = session?.questionIds[session.index];
  const question = questionId ? questionsById.get(questionId) : undefined;
  const answer = questionId ? session?.answers[questionId] : undefined;
  const isLast = session ? session.index === session.questionIds.length - 1 : false;
  const reveal = session?.mode === 'memorize' || (session?.mode === 'practice' && isAnswered(answer));

  const deadline = session?.timeLimitSec ? session.startedAt + session.timeLimitSec * 1000 : null;
  const now = useNow(1000, deadline !== null);
  const remainingMs = deadline !== null ? deadline - now : null;

  const finish = useCallback(
    (force = false) => {
      if (!session) return;
      const unanswered = session.questionIds.filter((id) => !isAnswered(session.answers[id])).length;
      if (!force && session.mode === 'exam' && !window.confirm(unanswered > 0 ? `还有 ${unanswered} 题未作答，确定交卷吗？` : '确定交卷吗？')) {
        return;
      }
      const record = finishSession(questionsById);
      navigate(record ? `/result/${record.id}` : '/', { replace: true });
    },
    [session, questionsById, navigate],
  );

  const goNext = useCallback(() => {
    if (!session) return;
    if (isLast) finish();
    else goToIndex(session.index + 1);
  }, [session, isLast, finish]);

  const goPrev = useCallback(() => {
    if (session) goToIndex(session.index - 1);
  }, [session]);

  const select = useCallback(
    (key: string) => {
      if (!question || !session || session.mode === 'memorize') return;
      answerQuestion(question, [key]);
    },
    [question, session],
  );

  useEffect(() => {
    if (remainingMs !== null && remainingMs <= 0) {
      window.alert('时间到，已自动交卷');
      finish(true);
    }
  }, [remainingMs, finish]);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [session?.index]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      const target = event.target as HTMLElement | null;
      if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;
      if (event.metaKey || event.ctrlKey || event.altKey || !question) return;
      const optionIndex = /^[1-9]$/.test(event.key)
        ? Number(event.key) - 1
        : /^[a-z]$/i.test(event.key)
          ? event.key.toUpperCase().charCodeAt(0) - 65
          : -1;
      const option = question.options[optionIndex];
      if (option) {
        event.preventDefault();
        select(option.key);
      } else if (event.key === 'Enter' || event.key === 'ArrowRight') {
        event.preventDefault();
        goNext();
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        goPrev();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [question, select, goNext, goPrev]);

  if (!session || !question) {
    return (
      <Page title="练习" back="/">
        <div className="empty">
          <p>当前没有进行中的练习。</p>
          <Link className="button button-primary" to="/setup">
            去选题
          </Link>
        </div>
      </Page>
    );
  }

  const onTouchStart = (event: React.TouchEvent): void => {
    const touch = event.touches[0];
    touchStart.current = touch ? { x: touch.clientX, y: touch.clientY } : null;
  };
  const onTouchEnd = (event: React.TouchEvent): void => {
    const start = touchStart.current;
    const touch = event.changedTouches[0];
    touchStart.current = null;
    if (!start || !touch) return;
    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    if (Math.abs(dx) < SWIPE_MIN_PX || Math.abs(dx) < Math.abs(dy) * 1.5) return;
    if (dx < 0 && !isLast) goToIndex(session.index + 1);
    else if (dx > 0) goPrev();
  };

  const total = session.questionIds.length;
  const stat = data.stats[question.id];
  const section = sectionsById.get(question.sectionId);
  const nextLabel = isLast ? (session.mode === 'exam' ? '交卷' : '完成') : '下一题';

  return (
    <Page
      title={
        <span className="quiz-title">
          {MODE_LABELS[session.mode]} {session.index + 1}/{total}
          {remainingMs !== null ? (
            <span className={`timer ${remainingMs < 5 * 60 * 1000 ? 'is-urgent' : ''}`}>{formatClock(remainingMs)}</span>
          ) : null}
        </span>
      }
      back="/"
      actions={
        <>
          <StarButton questionId={question.id} starred={stat?.starred ?? false} />
          <button type="button" className="icon-button" aria-label="答题卡" onClick={() => setSheetOpen(true)}>
            <GridIcon size={22} />
          </button>
        </>
      }
      footer={
        <div className="quiz-footer">
          <button type="button" className="button button-ghost" disabled={session.index === 0} onClick={goPrev}>
            上一题
          </button>
          {session.mode === 'exam' && !isLast ? (
            <button type="button" className="button button-ghost" onClick={() => finish()}>
              交卷
            </button>
          ) : null}
          <button type="button" className="button button-primary button-grow" onClick={goNext}>
            {nextLabel}
          </button>
        </div>
      }
    >
      <div className="quiz-progress">
        <div className="quiz-progress-value" style={{ width: `${((session.index + 1) / total) * 100}%` }} />
      </div>
      <div className="quiz-body" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        <div className="qitem-tags">
          <span className="tag">
            {section?.shortTitle ?? question.sectionId} · 第 {question.no} 题
          </span>
          {stat && stat.wrongCount > 0 ? <span className="tag tag-danger">曾错 {stat.wrongCount} 次</span> : null}
        </div>
        <QuestionView
          question={question}
          material={question.materialId ? materialsById.get(question.materialId) : undefined}
          format={bank.contentFormat}
          selected={answer}
          reveal={reveal}
          disabled={reveal}
          onSelect={select}
        />
        {reveal ? <AnswerReveal question={question} userAnswer={answer} showResult={session.mode === 'practice'} /> : null}
      </div>
      {sheetOpen ? (
        <AnswerSheet
          session={session}
          questionsById={questionsById}
          onClose={() => setSheetOpen(false)}
          onPick={(index) => {
            goToIndex(index);
            setSheetOpen(false);
          }}
        />
      ) : null}
    </Page>
  );
};
