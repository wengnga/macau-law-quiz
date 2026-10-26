import React, { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronRightIcon } from '../components/Icons';
import { Page } from '../components/Page';
import { ProgressBar } from '../components/ProgressBar';
import { selectPool } from '../domain/session';
import { shuffle } from '../domain/shuffle';
import { accuracy, summarize } from '../domain/stats';
import { formatPercent, MODE_LABELS } from '../helpers/format';
import { useStartSession } from '../hooks/useStartSession';
import { abandonSession, setBankId } from '../state/actions';
import { useBank } from '../state/bank';
import { useAppData } from '../state/store';

export const HomePage: React.FC = () => {
  const data = useAppData();
  const { bank, banks, questionsBySection } = useBank();
  const navigate = useNavigate();
  const startSession = useStartSession();

  const overall = useMemo(
    () => summarize(bank.questions.map((question) => question.id), data.stats, Date.now()),
    [bank, data.stats],
  );
  const sectionSummaries = useMemo(() => {
    const now = Date.now();
    return bank.sections.map((section) => ({
      section,
      summary: summarize((questionsBySection.get(section.id) ?? []).map((question) => question.id), data.stats, now),
    }));
  }, [bank, questionsBySection, data.stats]);
  const starredCount = useMemo(
    () => bank.questions.filter((question) => data.stats[question.id]?.starred).length,
    [bank, data.stats],
  );

  const active = data.activeSession?.bankId === bank.id ? data.activeSession : null;
  const activeAnswered = active ? Object.keys(active.answers).length : 0;

  const startReview = (): void => {
    const pool = selectPool(bank.questions, data.stats, { source: 'due' }, Date.now());
    startSession({ bankId: bank.id, mode: 'practice', title: '今日复习', questionIds: shuffle(pool).map((q) => q.id) });
  };

  return (
    <Page title="法例刷题">
      {banks.length > 1 ? (
        <select className="select bank-select" value={bank.id} onChange={(event) => setBankId(event.target.value)}>
          {banks.map((entry) => (
            <option key={entry.id} value={entry.id}>
              {entry.title}（{entry.questionCount} 题）
            </option>
          ))}
        </select>
      ) : (
        <p className="bank-title">{bank.title}</p>
      )}

      {active ? (
        <section className="card card-highlight">
          <div className="card-row">
            <div>
              <div className="card-title">继续：{active.title}</div>
              <div className="text-secondary">
                {MODE_LABELS[active.mode]} · 第 {active.index + 1} / {active.questionIds.length} 题 · 已答 {activeAnswered} 题
              </div>
            </div>
          </div>
          <div className="button-row">
            <button
              type="button"
              className="button button-ghost"
              onClick={() => {
                if (window.confirm('放弃这次练习？已答题目的统计会保留。')) abandonSession();
              }}
            >
              放弃
            </button>
            <button type="button" className="button button-primary" onClick={() => navigate('/quiz')}>
              继续
            </button>
          </div>
        </section>
      ) : null}

      <section className="card">
        <div className="card-row">
          <div>
            <div className="card-title">今日待复习</div>
            <div className="text-secondary">
              {overall.due > 0 ? '按遗忘曲线安排，及时复习记得更牢' : '今天没有待复习的题目，去刷新题吧'}
            </div>
          </div>
          <div className="big-number">{overall.due}</div>
        </div>
        {overall.due > 0 ? (
          <button type="button" className="button button-primary button-block" onClick={startReview}>
            开始复习
          </button>
        ) : null}
      </section>

      <nav className="entry-grid">
        <Link className="entry" to="/setup">
          <span className="entry-title">专题练习</span>
          <span className="entry-desc">选专题，乱序刷题</span>
        </Link>
        <Link className="entry" to="/setup?mode=exam">
          <span className="entry-title">模拟考试</span>
          <span className="entry-desc">限时作答，交卷看分</span>
        </Link>
        <Link className="entry" to="/wrong">
          <span className="entry-title">错题本</span>
          <span className="entry-desc">{overall.inWrongBook} 题</span>
        </Link>
        <Link className="entry" to="/starred">
          <span className="entry-title">收藏</span>
          <span className="entry-desc">{starredCount} 题</span>
        </Link>
        <Link className="entry" to="/articles">
          <span className="entry-title">按条文练</span>
          <span className="entry-desc">同一条文集中攻克</span>
        </Link>
        <Link className="entry" to="/search">
          <span className="entry-title">搜索</span>
          <span className="entry-desc">简繁体都能搜</span>
        </Link>
      </nav>

      <section className="card">
        <div className="card-row">
          <div className="card-title">总进度</div>
          <Link className="link" to="/settings">
            统计与设置
          </Link>
        </div>
        <ProgressBar value={overall.attempted / overall.total} highlight={overall.mastered / overall.total} />
        <div className="stat-line">
          <span>
            已做 {overall.attempted}/{overall.total}
          </span>
          <span>已掌握 {overall.mastered}</span>
          <span>正确率 {formatPercent(accuracy(overall))}</span>
        </div>
      </section>

      <section className="list">
        <h2 className="list-title">专题</h2>
        {sectionSummaries.map(({ section, summary }) => (
          <Link key={section.id} className="card section-row" to={`/setup?sections=${section.id}`}>
            <div className="section-row-main">
              <div className="section-name">
                {section.order}. {section.shortTitle}
              </div>
              <ProgressBar value={summary.attempted / summary.total} highlight={summary.mastered / summary.total} />
              <div className="stat-line">
                <span>
                  已做 {summary.attempted}/{summary.total}
                </span>
                <span>正确率 {formatPercent(accuracy(summary))}</span>
                {summary.inWrongBook > 0 ? <span className="text-danger">错题 {summary.inWrongBook}</span> : null}
              </div>
            </div>
            <ChevronRightIcon />
          </Link>
        ))}
        <p className="hint">进度条：浅色为已做，深色为已掌握（连续答对 3 次）。</p>
      </section>
    </Page>
  );
};
