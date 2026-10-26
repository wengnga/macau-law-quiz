import React, { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Page } from '../components/Page';
import { Segmented, type SegmentedOption } from '../components/Segmented';
import { pickQuestions, selectPool, type PickStrategy, type QuestionSource } from '../domain/session';
import type { SessionMode } from '../domain/types';
import { useStartSession } from '../hooks/useStartSession';
import { useBank } from '../state/bank';
import { useAppData } from '../state/store';

type Count = number | 'all';

const MODE_OPTIONS: SegmentedOption<SessionMode>[] = [
  { value: 'practice', label: '练习' },
  { value: 'memorize', label: '背题' },
  { value: 'exam', label: '模拟考试' },
];
const MODE_HINTS: Record<SessionMode, string> = {
  practice: '每答一题立即显示对错和条文依据，答错自动进错题本。',
  memorize: '直接显示答案和依据，适合考前快速过一遍，不计入统计。',
  exam: '限时作答，可以改答案，交卷后才显示成绩，结果计入统计。',
};
const SOURCE_OPTIONS: SegmentedOption<QuestionSource>[] = [
  { value: 'all', label: '全部题目' },
  { value: 'wrong', label: '只练错题' },
  { value: 'starred', label: '只练收藏' },
];
const STRATEGY_OPTIONS: SegmentedOption<PickStrategy>[] = [
  { value: 'unseen-first', label: '优先没做过' },
  { value: 'weak-first', label: '优先薄弱' },
  { value: 'random', label: '完全随机' },
];
const COUNT_OPTIONS: Count[] = [10, 20, 50, 100, 'all'];
const TIME_OPTIONS = [0, 30, 60, 90] as const;

const parseMode = (value: string | null): SessionMode =>
  value === 'exam' || value === 'memorize' ? value : 'practice';

export const SetupPage: React.FC = () => {
  const [params] = useSearchParams();
  const { bank } = useBank();
  const { stats } = useAppData();
  const startSession = useStartSession();

  const initialSections = params.get('sections')?.split(',').filter(Boolean);
  const initialMode = parseMode(params.get('mode'));
  const [mode, setMode] = useState<SessionMode>(initialMode);
  const [sectionIds, setSectionIds] = useState<string[]>(
    initialSections?.length ? initialSections : bank.sections.map((section) => section.id),
  );
  const [source, setSource] = useState<QuestionSource>('all');
  const [strategy, setStrategy] = useState<PickStrategy>('unseen-first');
  const [count, setCount] = useState<Count>(initialMode === 'exam' ? 50 : 20);
  const [timeLimitMin, setTimeLimitMin] = useState<number>(60);

  const pool = useMemo(
    () => selectPool(bank.questions, stats, { source, sectionIds }, Date.now()),
    [bank, stats, source, sectionIds],
  );
  const actualCount = count === 'all' ? pool.length : Math.min(count, pool.length);

  const toggleSection = (id: string): void => {
    setSectionIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  };
  const allSelected = sectionIds.length === bank.sections.length;

  const start = (): void => {
    const picked = pickQuestions(pool, stats, mode === 'memorize' ? 'random' : strategy, count);
    const names = bank.sections.filter((section) => sectionIds.includes(section.id)).map((section) => section.shortTitle);
    const scope = allSelected ? '全部专题' : names.length > 2 ? `${names.slice(0, 2).join('、')} 等 ${names.length} 个专题` : names.join('、');
    const prefix = mode === 'exam' ? '模拟考试' : mode === 'memorize' ? '背题' : source === 'wrong' ? '错题练习' : source === 'starred' ? '收藏练习' : '专题练习';
    startSession({
      bankId: bank.id,
      mode,
      title: `${prefix} · ${scope}`,
      questionIds: picked.map((question) => question.id),
      timeLimitSec: mode === 'exam' && timeLimitMin > 0 ? timeLimitMin * 60 : undefined,
    });
  };

  return (
    <Page
      title="开始练习"
      back
      footer={
        <button type="button" className="button button-primary button-block button-large" disabled={actualCount === 0} onClick={start}>
          {actualCount === 0 ? '没有符合条件的题目' : `开始（共 ${actualCount} 题）`}
        </button>
      }
    >
      <section className="form-section">
        <h2 className="form-label">模式</h2>
        <Segmented ariaLabel="模式" options={MODE_OPTIONS} value={mode} onChange={setMode} />
        <p className="hint">{MODE_HINTS[mode]}</p>
      </section>

      <section className="form-section">
        <div className="form-label-row">
          <h2 className="form-label">专题（可多选）</h2>
          <button
            type="button"
            className="link"
            onClick={() => setSectionIds(allSelected ? [] : bank.sections.map((section) => section.id))}
          >
            {allSelected ? '清空' : '全选'}
          </button>
        </div>
        <div className="chip-list">
          {bank.sections.map((section) => (
            <button
              key={section.id}
              type="button"
              className={`chip ${sectionIds.includes(section.id) ? 'is-active' : ''}`}
              aria-pressed={sectionIds.includes(section.id)}
              onClick={() => toggleSection(section.id)}
            >
              {section.shortTitle}
              <span className="chip-count">{section.questionCount}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="form-section">
        <h2 className="form-label">题目范围</h2>
        <Segmented ariaLabel="题目范围" options={SOURCE_OPTIONS} value={source} onChange={setSource} />
      </section>

      {mode !== 'memorize' ? (
        <section className="form-section">
          <h2 className="form-label">出题顺序</h2>
          <Segmented ariaLabel="出题顺序" options={STRATEGY_OPTIONS} value={strategy} onChange={setStrategy} />
          <p className="hint">题目顺序都会打乱；「优先没做过」保证覆盖全部题，「优先薄弱」先出错题和错误率高的题。</p>
        </section>
      ) : null}

      <section className="form-section">
        <h2 className="form-label">题量（可选 {pool.length} 题）</h2>
        <Segmented
          ariaLabel="题量"
          options={COUNT_OPTIONS.map((value) => ({ value, label: value === 'all' ? '全部' : `${value}` }))}
          value={count}
          onChange={setCount}
        />
      </section>

      {mode === 'exam' ? (
        <section className="form-section">
          <h2 className="form-label">考试时长</h2>
          <Segmented
            ariaLabel="考试时长"
            options={TIME_OPTIONS.map((value) => ({ value, label: value === 0 ? '不限时' : `${value} 分钟` }))}
            value={timeLimitMin}
            onChange={setTimeLimitMin}
          />
        </section>
      ) : null}
    </Page>
  );
};
