import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Page } from '../components/Page';
import { ProgressBar } from '../components/ProgressBar';
import { Segmented, type SegmentedOption } from '../components/Segmented';
import { accuracy, summarize } from '../domain/stats';
import type { ThemePreference } from '../domain/types';
import { formatDateTime, formatPercent, MODE_LABELS } from '../helpers/format';
import { replaceAppData, resetProgress, setTheme } from '../state/actions';
import { useBank } from '../state/bank';
import { getAppData, useAppData } from '../state/store';
import { parseExport, serializeExport, type ImportPreview } from '../storage/appData';

const THEME_OPTIONS: SegmentedOption<ThemePreference>[] = [
  { value: 'system', label: '跟随系统' },
  { value: 'light', label: '浅色' },
  { value: 'dark', label: '深色' },
];
const RECENT_SESSIONS = 10;

async function exportProgress(): Promise<void> {
  const now = Date.now();
  const date = new Date(now);
  const stamp = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
  const file = new File([serializeExport(getAppData(), now)], `法例刷题进度-${stamp}.json`, { type: 'application/json' });
  // On phones the share sheet ("save to Files", AirDrop, WeChat...) is more reliable than a download.
  const isTouch = window.matchMedia('(pointer: coarse)').matches;
  if (isTouch && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: file.name });
      return;
    } catch (error) {
      if ((error as DOMException).name === 'AbortError') return;
      console.warn('[export] 分享失败，改为下载', error);
    }
  }
  const url = URL.createObjectURL(file);
  const link = document.createElement('a');
  link.href = url;
  link.download = file.name;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export const SettingsPage: React.FC = () => {
  const data = useAppData();
  const { bank, questionsBySection } = useBank();
  const fileInput = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [persisted, setPersisted] = useState<boolean | null>(null);

  useEffect(() => {
    navigator.storage?.persisted?.().then(setPersisted).catch(() => setPersisted(null));
  }, []);

  const rows = useMemo(() => {
    const now = Date.now();
    return bank.sections.map((section) => ({
      section,
      summary: summarize((questionsBySection.get(section.id) ?? []).map((question) => question.id), data.stats, now),
    }));
  }, [bank, questionsBySection, data.stats]);
  const overall = useMemo(
    () => summarize(bank.questions.map((question) => question.id), data.stats, Date.now()),
    [bank, data.stats],
  );
  const recent = data.sessions.filter((record) => record.bankId === bank.id).slice(0, RECENT_SESSIONS);

  const onFileChosen = async (event: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    try {
      setPreview(parseExport(await file.text()));
    } catch (error) {
      window.alert(`导入失败：${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const confirmImport = (): void => {
    if (!preview) return;
    replaceAppData(preview.data);
    setPreview(null);
    window.alert('导入完成');
  };

  const onReset = (): void => {
    if (!window.confirm('确定清空所有做题记录、错题本、收藏和笔记吗？此操作无法撤销，建议先导出备份。')) return;
    resetProgress();
  };

  return (
    <Page title="统计与设置" back>
      <section className="card">
        <div className="card-title">总体</div>
        <ProgressBar value={overall.attempted / overall.total} highlight={overall.mastered / overall.total} />
        <div className="stat-grid">
          <div>
            <div className="stat-value">
              {overall.attempted}/{overall.total}
            </div>
            <div className="stat-label">已做（覆盖率 {formatPercent(overall.attempted / overall.total)}）</div>
          </div>
          <div>
            <div className="stat-value">{formatPercent(accuracy(overall))}</div>
            <div className="stat-label">正确率（{overall.attempts} 次作答）</div>
          </div>
          <div>
            <div className="stat-value">{overall.mastered}</div>
            <div className="stat-label">已掌握（连对 3 次）</div>
          </div>
          <div>
            <div className="stat-value">{overall.inWrongBook}</div>
            <div className="stat-label">错题本</div>
          </div>
        </div>
      </section>

      <section className="card">
        <div className="card-title">各专题</div>
        <table className="table">
          <thead>
            <tr>
              <th>专题</th>
              <th>已做</th>
              <th>正确率</th>
              <th>掌握</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ section, summary }) => (
              <tr key={section.id}>
                <td>{section.shortTitle}</td>
                <td>
                  {summary.attempted}/{summary.total}
                </td>
                <td>{formatPercent(accuracy(summary))}</td>
                <td>{formatPercent(summary.mastered / summary.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="card">
        <div className="card-title">最近练习</div>
        {recent.length === 0 ? (
          <p className="text-secondary">还没有完成的练习</p>
        ) : (
          <div className="history">
            {recent.map((record) => (
              <Link key={record.id} className="history-row" to={`/result/${record.id}`}>
                <span className="history-main">
                  <span className="history-title">{record.title}</span>
                  <span className="text-secondary">
                    {formatDateTime(record.finishedAt)} · {MODE_LABELS[record.mode]}
                  </span>
                </span>
                <span className="history-score">
                  {record.correct}/{record.total}
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="card">
        <div className="card-title">外观</div>
        <Segmented ariaLabel="外观" options={THEME_OPTIONS} value={data.settings.theme} onChange={setTheme} />
      </section>

      <section className="card">
        <div className="card-title">数据</div>
        <p className="text-secondary">
          做题记录只保存在这台设备的浏览器里，手机和电脑互不相通。清除浏览器数据或删除主屏幕应用会丢失记录，换设备前请先导出。
          {persisted === true ? ' 已开启持久存储。' : persisted === false ? ' 浏览器未授予持久存储，建议定期导出。' : ''}
        </p>
        <div className="button-row">
          <button type="button" className="button button-primary" onClick={() => void exportProgress()}>
            导出进度
          </button>
          <button type="button" className="button button-ghost" onClick={() => fileInput.current?.click()}>
            导入进度
          </button>
          <button type="button" className="button button-danger" onClick={onReset}>
            重置进度
          </button>
        </div>
        <input ref={fileInput} type="file" accept="application/json,.json" hidden onChange={(event) => void onFileChosen(event)} />
      </section>

      {preview ? (
        <div className="sheet-backdrop" role="presentation" onClick={() => setPreview(null)}>
          <div className="sheet" role="dialog" aria-label="确认导入" onClick={(event) => event.stopPropagation()}>
            <div className="card-title">确认导入</div>
            <ul className="preview-list">
              <li>导出时间：{preview.exportedAt ? formatDateTime(preview.exportedAt) : '未知'}</li>
              <li>做过的题：{preview.questionCount} 题</li>
              <li>错题本：{preview.wrongBookCount} 题</li>
              <li>练习记录：{preview.sessionCount} 次</li>
            </ul>
            <p className="text-danger">导入会覆盖当前设备上的全部做题记录。</p>
            <div className="button-row">
              <button type="button" className="button button-ghost" onClick={() => setPreview(null)}>
                取消
              </button>
              <button type="button" className="button button-primary" onClick={confirmImport}>
                确认覆盖
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </Page>
  );
};
