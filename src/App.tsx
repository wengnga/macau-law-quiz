import React, { useEffect, useMemo, useState } from 'react';
import { HashRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import type { BankIndexEntry } from './domain/types';
import { useTheme } from './hooks/useTheme';
import { ArticlesPage } from './pages/ArticlesPage';
import { HomePage } from './pages/HomePage';
import { QuizPage } from './pages/QuizPage';
import { ResultPage } from './pages/ResultPage';
import { SearchPage } from './pages/SearchPage';
import { SettingsPage } from './pages/SettingsPage';
import { SetupPage } from './pages/SetupPage';
import { StarredPage } from './pages/StarredPage';
import { WrongBookPage } from './pages/WrongBookPage';
import { BankContext, fetchBank, fetchBankIndex, type BankContextValue, type LoadedBank } from './state/bank';
import { useAppData } from './state/store';

type LoadState = { status: 'loading' } | { status: 'error'; message: string } | { status: 'ready'; loaded: LoadedBank };

const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [pathname]);
  return null;
};

export const App: React.FC = () => {
  const { settings } = useAppData();
  useTheme(settings.theme);

  const [banks, setBanks] = useState<BankIndexEntry[] | null>(null);
  const [state, setState] = useState<LoadState>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    fetchBankIndex()
      .then(setBanks)
      .catch((error: unknown) => setState({ status: 'error', message: error instanceof Error ? error.message : String(error) }));
  }, [attempt]);

  const entry = banks ? (banks.find((item) => item.id === settings.bankId) ?? banks[0]) : undefined;

  useEffect(() => {
    if (!entry) return undefined;
    let cancelled = false;
    setState({ status: 'loading' });
    fetchBank(entry)
      .then((loaded) => {
        if (!cancelled) setState({ status: 'ready', loaded });
      })
      .catch((error: unknown) => {
        if (!cancelled) setState({ status: 'error', message: error instanceof Error ? error.message : String(error) });
      });
    return () => {
      cancelled = true;
    };
  }, [entry]);

  const contextValue = useMemo<BankContextValue | null>(
    () => (state.status === 'ready' && banks ? { ...state.loaded, banks } : null),
    [state, banks],
  );

  if (state.status === 'error') {
    return (
      <div className="splash">
        <p>题库加载失败：{state.message}</p>
        <button type="button" className="button button-primary" onClick={() => setAttempt((value) => value + 1)}>
          重试
        </button>
      </div>
    );
  }
  if (!contextValue) return <div className="splash">正在加载题库…</div>;

  return (
    <BankContext.Provider value={contextValue}>
      <HashRouter>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/setup" element={<SetupPage />} />
          <Route path="/quiz" element={<QuizPage />} />
          <Route path="/result/:id" element={<ResultPage />} />
          <Route path="/wrong" element={<WrongBookPage />} />
          <Route path="/starred" element={<StarredPage />} />
          <Route path="/articles" element={<ArticlesPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </BankContext.Provider>
  );
};
