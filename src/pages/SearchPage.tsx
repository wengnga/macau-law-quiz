import React, { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { Page } from '../components/Page';
import { QuestionListItem } from '../components/QuestionListItem';
import { questionHaystack, searchQuestions, type TextNormalizer } from '../domain/search';
import { shuffle } from '../domain/shuffle';
import type { Question } from '../domain/types';
import { useStartSession } from '../hooks/useStartSession';
import { useBank } from '../state/bank';

const PAGE_SIZE = 50;

interface SearchIndex {
  normalize: TextNormalizer;
  haystacks: ReadonlyMap<string, string>;
}

/** Normalizes everything to simplified Chinese so simplified queries match the traditional bank text. */
async function buildIndex(questions: readonly Question[]): Promise<SearchIndex> {
  const { Converter } = await import('opencc-js/t2cn');
  const toSimplified = Converter({ from: 'hk', to: 'cn' });
  const normalize: TextNormalizer = (text) => toSimplified(text.toLowerCase());
  const haystacks = new Map(questions.map((question) => [question.id, normalize(questionHaystack(question))]));
  return { normalize, haystacks };
}

export const SearchPage: React.FC = () => {
  const { bank } = useBank();
  const startSession = useStartSession();
  const [query, setQuery] = useState('');
  const [limit, setLimit] = useState(PAGE_SIZE);
  const [index, setIndex] = useState<SearchIndex | null>(null);
  const [indexError, setIndexError] = useState<string | null>(null);
  const deferredQuery = useDeferredValue(query);

  useEffect(() => {
    let cancelled = false;
    buildIndex(bank.questions)
      .then((built) => {
        if (!cancelled) setIndex(built);
      })
      .catch((error: unknown) => {
        console.error('[search] 构建索引失败', error);
        if (!cancelled) setIndexError('简繁转换加载失败，只能按原文（繁体）搜索');
      });
    return () => {
      cancelled = true;
    };
  }, [bank]);

  const results = useMemo(
    () => searchQuestions(bank.questions, deferredQuery, index?.normalize, index?.haystacks),
    [bank, deferredQuery, index],
  );

  useEffect(() => setLimit(PAGE_SIZE), [deferredQuery]);

  return (
    <Page
      title="搜索"
      back
      footer={
        results.length > 0 ? (
          <button
            type="button"
            className="button button-primary button-block button-large"
            onClick={() =>
              startSession({
                bankId: bank.id,
                mode: 'practice',
                title: `搜索 · ${deferredQuery.trim()}`,
                questionIds: shuffle(results.map((question) => question.id)),
              })
            }
          >
            练习这些题（{results.length}）
          </button>
        ) : undefined
      }
    >
      <input
        className="input"
        type="search"
        autoFocus
        placeholder="搜题干、选项、条文，如：立法会 三分之二"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
      <p className="hint">
        {indexError ?? (index ? '支持简体输入；多个关键词用空格分开，需同时出现。' : '正在准备简繁体搜索…')}
      </p>
      {deferredQuery.trim() ? <p className="list-title">找到 {results.length} 题</p> : null}
      <div className="list">
        {results.slice(0, limit).map((question) => (
          <QuestionListItem key={question.id} question={question} />
        ))}
      </div>
      {results.length > limit ? (
        <button type="button" className="button button-ghost button-block" onClick={() => setLimit((value) => value + PAGE_SIZE)}>
          显示更多（还有 {results.length - limit} 题）
        </button>
      ) : null}
    </Page>
  );
};
