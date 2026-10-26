import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeftIcon } from './Icons';

interface PageProps {
  title: React.ReactNode;
  /** `true` goes back in history (or home on a fresh tab); a string navigates to that path. */
  back?: boolean | string;
  actions?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
}

export const Page: React.FC<PageProps> = ({ title, back, actions, footer, children }) => {
  const navigate = useNavigate();
  const goBack = (): void => {
    if (typeof back === 'string') navigate(back);
    else if ((window.history.state as { idx?: number } | null)?.idx) navigate(-1);
    else navigate('/', { replace: true });
  };

  return (
    <div className="page">
      <header className="page-header">
        {back ? (
          <button type="button" className="icon-button" onClick={goBack} aria-label="返回">
            <ChevronLeftIcon size={24} />
          </button>
        ) : (
          <span className="icon-button-placeholder" />
        )}
        <h1 className="page-title">{title}</h1>
        <div className="page-actions">{actions}</div>
      </header>
      <main className="page-content">{children}</main>
      {footer ? <footer className="page-footer">{footer}</footer> : null}
    </div>
  );
};
