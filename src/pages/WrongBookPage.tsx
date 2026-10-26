import React, { useMemo, useState } from 'react';
import { Page } from '../components/Page';
import { QuestionListItem } from '../components/QuestionListItem';
import { Segmented, type SegmentedOption } from '../components/Segmented';
import { shuffle } from '../domain/shuffle';
import { WRONG_BOOK_EXIT_STREAK } from '../domain/stats';
import type { Question, QuestionStat } from '../domain/types';
import { useStartSession } from '../hooks/useStartSession';
import { setInWrongBook } from '../state/actions';
import { useBank } from '../state/bank';
import { useAppData } from '../state/store';

type SortKey = 'wrongCount' | 'recent' | 'order';

const SORT_OPTIONS: SegmentedOption<SortKey>[] = [
  { value: 'wrongCount', label: '错误次数' },
  { value: 'recent', label: '最近答错' },
  { value: 'order', label: '题号' },
];

const ALL = 'all';

const inBook = (stat: QuestionStat | undefined, includeRemoved: boolean): boolean =>
  includeRemoved ? (stat?.wrongCount ?? 0) > 0 : stat?.inWrongBook === true;

export const WrongBookPage: React.FC = () => {
  const { stats } = useAppData();
  const { bank } = useBank();
  const startSession = useStartSession();
  const [sectionId, setSectionId] = useState<string>(ALL);
  const [sort, setSort] = useState<SortKey>('wrongCount');
  const [includeRemoved, setIncludeRemoved] = useState(false);

  const items = useMemo(() => {
    const list = bank.questions.filter(
      (question) =>
        inBook(stats[question.id], includeRemoved) && (sectionId === ALL || question.sectionId === sectionId),
    );
    const stat = (question: Question) => stats[question.id];
    if (sort === 'wrongCount') list.sort((a, b) => (stat(b)?.wrongCount ?? 0) - (stat(a)?.wrongCount ?? 0));
    if (sort === 'recent') list.sort((a, b) => (stat(b)?.lastWrongAt ?? 0) - (stat(a)?.lastWrongAt ?? 0));
    return list;
  }, [bank, stats, sectionId, sort, includeRemoved]);

  const sectionCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const question of bank.questions) {
      if (inBook(stats[question.id], includeRemoved)) {
        counts.set(question.sectionId, (counts.get(question.sectionId) ?? 0) + 1);
      }
    }
    return counts;
  }, [bank, stats, includeRemoved]);
  const totalCount = [...sectionCounts.values()].reduce((sum, value) => sum + value, 0);

  const practice = (): void =>
    startSession({
      bankId: bank.id,
      mode: 'practice',
      title: '错题本练习',
      questionIds: shuffle(items.map((question) => question.id)),
    });

  return (
    <Page
      title="错题本"
      back
      footer={
        items.length > 0 ? (
          <button type="button" className="button button-primary button-block button-large" onClick={practice}>
            练习这些错题（{items.length}）
          </button>
        ) : undefined
      }
    >
      <p className="hint">
        答错自动加入；之后连续答对 {WRONG_BOOK_EXIT_STREAK} 次自动移出，也可以手动移出。错误次数会一直保留。
      </p>
      <div className="chip-list chip-list-scroll">
        <button type="button" className={`chip ${sectionId === ALL ? 'is-active' : ''}`} onClick={() => setSectionId(ALL)}>
          全部<span className="chip-count">{totalCount}</span>
        </button>
        {bank.sections
          .filter((section) => (sectionCounts.get(section.id) ?? 0) > 0)
          .map((section) => (
            <button
              key={section.id}
              type="button"
              className={`chip ${sectionId === section.id ? 'is-active' : ''}`}
              onClick={() => setSectionId(section.id)}
            >
              {section.shortTitle}
              <span className="chip-count">{sectionCounts.get(section.id)}</span>
            </button>
          ))}
      </div>
      <div className="toolbar">
        <Segmented ariaLabel="排序" options={SORT_OPTIONS} value={sort} onChange={setSort} />
        <label className="checkbox">
          <input type="checkbox" checked={includeRemoved} onChange={(event) => setIncludeRemoved(event.target.checked)} />
          含已移出
        </label>
      </div>

      {items.length === 0 ? (
        <div className="empty">
          <p>{totalCount === 0 ? '错题本是空的，继续保持！' : '这个专题没有错题'}</p>
        </div>
      ) : (
        <div className="list">
          {items.map((question) => {
            const stat = stats[question.id];
            return (
              <QuestionListItem
                key={question.id}
                question={question}
                meta={
                  <>
                    <span className="tag tag-danger">错 {stat?.wrongCount ?? 0} 次</span>
                    {stat?.inWrongBook ? (
                      <span className="tag">
                        连对 {stat.correctStreak}/{WRONG_BOOK_EXIT_STREAK}
                      </span>
                    ) : (
                      <span className="tag tag-success">已移出</span>
                    )}
                  </>
                }
                actions={
                  <button
                    type="button"
                    className="button button-ghost button-small"
                    onClick={() => setInWrongBook(question.id, !stat?.inWrongBook)}
                  >
                    {stat?.inWrongBook ? '移出错题本' : '加回错题本'}
                  </button>
                }
              />
            );
          })}
        </div>
      )}
    </Page>
  );
};
