import React, { useMemo } from 'react';
import { Page } from '../components/Page';
import { QuestionListItem } from '../components/QuestionListItem';
import { shuffle } from '../domain/shuffle';
import { useStartSession } from '../hooks/useStartSession';
import { useBank } from '../state/bank';
import { useAppData } from '../state/store';

export const StarredPage: React.FC = () => {
  const { stats } = useAppData();
  const { bank } = useBank();
  const startSession = useStartSession();
  const items = useMemo(() => bank.questions.filter((question) => stats[question.id]?.starred), [bank, stats]);

  return (
    <Page
      title="收藏"
      back
      footer={
        items.length > 0 ? (
          <button
            type="button"
            className="button button-primary button-block button-large"
            onClick={() =>
              startSession({
                bankId: bank.id,
                mode: 'practice',
                title: '收藏练习',
                questionIds: shuffle(items.map((question) => question.id)),
              })
            }
          >
            练习收藏的题（{items.length}）
          </button>
        ) : undefined
      }
    >
      {items.length === 0 ? (
        <div className="empty">
          <p>还没有收藏。做题时点右上角的星标，把易混的题收藏起来。</p>
        </div>
      ) : (
        <div className="list">
          {items.map((question) => (
            <QuestionListItem
              key={question.id}
              question={question}
              meta={
                stats[question.id]?.note ? <span className="tag">有笔记</span> : null
              }
            />
          ))}
        </div>
      )}
    </Page>
  );
};
