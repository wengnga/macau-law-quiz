import React, { useMemo, useState } from 'react';
import { Page } from '../components/Page';
import { parseArticleTag } from '../domain/articles';
import { shuffle } from '../domain/shuffle';
import { accuracy, summarize } from '../domain/stats';
import type { Question } from '../domain/types';
import { formatPercent } from '../helpers/format';
import { useStartSession } from '../hooks/useStartSession';
import { useBank } from '../state/bank';
import { useAppData } from '../state/store';

interface ArticleEntry {
  key: string;
  law: string;
  article: string;
  order: number;
  questionIds: string[];
}

interface LawGroup {
  law: string;
  entries: ArticleEntry[];
}

const OTHER_LAW = '其他（无具体条号）';

function groupByArticle(questions: readonly Question[]): LawGroup[] {
  const groups = new Map<string, Map<string, ArticleEntry>>();
  const ensure = (law: string, key: string, article: string, order: number): ArticleEntry => {
    const entries = groups.get(law) ?? new Map<string, ArticleEntry>();
    groups.set(law, entries);
    const entry = entries.get(key) ?? { key, law, article, order, questionIds: [] };
    entries.set(key, entry);
    return entry;
  };
  for (const question of questions) {
    const parsed = (question.tags ?? []).map(parseArticleTag).filter((tag) => tag !== null);
    if (parsed.length === 0) ensure(OTHER_LAW, 'other', '其他', 0).questionIds.push(question.id);
    for (const tag of parsed) ensure(tag.law, tag.tag, tag.article, tag.order).questionIds.push(question.id);
  }
  const result = [...groups.entries()].map(([law, entries]) => ({
    law,
    entries: [...entries.values()].sort((a, b) => a.order - b.order),
  }));
  return [...result.filter((group) => group.law !== OTHER_LAW), ...result.filter((group) => group.law === OTHER_LAW)];
}

/** Accepts 「17」, 「第十七」, simplified 「条」, etc. */
function matchesQuery(entry: ArticleEntry, query: string): boolean {
  const normalized = query.trim().replace(/条/g, '條');
  if (!normalized) return true;
  if (/^\d+$/.test(normalized)) return Math.floor(entry.order) === Number(normalized);
  return entry.article.includes(normalized) || entry.law.includes(normalized);
}

export const ArticlesPage: React.FC = () => {
  const { stats } = useAppData();
  const { bank } = useBank();
  const startSession = useStartSession();
  const [query, setQuery] = useState('');

  const groups = useMemo(() => groupByArticle(bank.questions), [bank]);
  const visible = useMemo(
    () =>
      groups
        .map((group) => ({ ...group, entries: group.entries.filter((entry) => matchesQuery(entry, query)) }))
        .filter((group) => group.entries.length > 0),
    [groups, query],
  );

  const practice = (entry: ArticleEntry): void =>
    startSession({
      bankId: bank.id,
      mode: 'practice',
      title: `条文 · ${entry.law} ${entry.article}`,
      questionIds: shuffle(entry.questionIds),
    });

  return (
    <Page title="按条文练" back>
      <p className="hint">同一条文的题集中练，能把条文吃透；一道题可能关联多个条文。点击条文直接开始练习。</p>
      <input
        className="input"
        type="search"
        placeholder="找条文：输入 17、第十七條 或法律名"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
      {visible.length === 0 ? <div className="empty">没有匹配的条文</div> : null}
      {visible.map((group) => {
        const groupIds = [...new Set(group.entries.flatMap((entry) => entry.questionIds))];
        const summary = summarize(groupIds, stats, Date.now());
        return (
          <details key={`${group.law}-${query ? 'q' : ''}`} className="card law-group" open={query ? true : undefined}>
            <summary className="law-summary">
              <span className="law-name">{group.law}</span>
              <span className="text-secondary">
                {group.entries.length} 条 · {groupIds.length} 题
                {summary.inWrongBook > 0 ? <span className="text-danger"> · 错题 {summary.inWrongBook}</span> : null}
              </span>
            </summary>
            <div className="article-list">
              {group.entries.map((entry) => {
                const entrySummary = summarize(entry.questionIds, stats, Date.now());
                return (
                  <button key={entry.key} type="button" className="article-row" onClick={() => practice(entry)}>
                    <span className="article-name">{entry.article}</span>
                    <span className="article-meta">
                      {entry.questionIds.length} 题
                      {entrySummary.attempts > 0 ? ` · 正确率 ${formatPercent(accuracy(entrySummary))}` : ''}
                      {entrySummary.inWrongBook > 0 ? <span className="text-danger"> · 错 {entrySummary.inWrongBook}</span> : null}
                    </span>
                  </button>
                );
              })}
            </div>
          </details>
        );
      })}
    </Page>
  );
};
