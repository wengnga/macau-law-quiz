import React, { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Page } from '../components/Page';
import { QuestionListItem } from '../components/QuestionListItem';
import { isAnswered } from '../domain/grading';
import { shuffle } from '../domain/shuffle';
import type { Question } from '../domain/types';
import { formatDuration, formatPercent } from '../helpers/format';
import { useStartSession } from '../hooks/useStartSession';
import { useBank } from '../state/bank';
import { useAppData } from '../state/store';

export const ResultPage: React.FC = () => {
  const { id } = useParams();
  const { sessions, stats } = useAppData();
  const { bank, questionsById } = useBank();
  const startSession = useStartSession();
  const record = sessions.find((item) => item.id === id);

  const { wrong, unanswered } = useMemo(() => {
    const pick = (ids: readonly string[]): Question[] =>
      ids.map((questionId) => questionsById.get(questionId)).filter((q): q is Question => q !== undefined);
    if (!record) return { wrong: [], unanswered: [] };
    return {
      wrong: pick(record.wrongIds),
      unanswered: pick(record.questionIds.filter((questionId) => !isAnswered(record.answers[questionId]))),
    };
  }, [record, questionsById]);

  if (!record) {
    return (
      <Page title="练习结果" back="/">
        <div className="empty">
          <p>找不到这次练习的记录。</p>
          <Link className="button button-primary" to="/">
            返回首页
          </Link>
        </div>
      </Page>
    );
  }

  const retryIds = [...wrong, ...unanswered].map((question) => question.id);
  const retry = (): void =>
    startSession({ bankId: bank.id, mode: 'practice', title: `重练 · ${record.title}`, questionIds: shuffle(retryIds) });

  return (
    <Page
      title="练习结果"
      back="/"
      footer={
        <div className="quiz-footer">
          <Link className="button button-ghost" to="/" replace>
            返回首页
          </Link>
          <button type="button" className="button button-primary button-grow" disabled={retryIds.length === 0} onClick={retry}>
            {retryIds.length > 0 ? `重练错题（${retryIds.length}）` : '全部答对'}
          </button>
        </div>
      }
    >
      <section className="card result-card">
        <div className="text-secondary">{record.title}</div>
        <div className="result-score">
          <span className="result-score-main">{record.correct}</span>
          <span className="result-score-total">/ {record.total}</span>
        </div>
        <div className="stat-line stat-line-center">
          <span>正确率 {formatPercent(record.total > 0 ? record.correct / record.total : null)}</span>
          <span>答错 {wrong.length}</span>
          {unanswered.length > 0 ? <span>未答 {unanswered.length}</span> : null}
          <span>用时 {formatDuration(record.finishedAt - record.startedAt)}</span>
        </div>
      </section>

      {wrong.length > 0 ? (
        <section className="list">
          <h2 className="list-title">答错的题（点开看解析）</h2>
          {wrong.map((question) => (
            <QuestionListItem
              key={question.id}
              question={question}
              userAnswer={record.answers[question.id]}
              meta={<span className="tag tag-danger">累计错 {stats[question.id]?.wrongCount ?? 0} 次</span>}
            />
          ))}
        </section>
      ) : null}

      {unanswered.length > 0 ? (
        <section className="list">
          <h2 className="list-title">未作答</h2>
          {unanswered.map((question) => (
            <QuestionListItem key={question.id} question={question} />
          ))}
        </section>
      ) : null}
    </Page>
  );
};
