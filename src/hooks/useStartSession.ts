import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { startSession, type StartSessionOptions } from '../state/actions';
import { getAppData } from '../state/store';

/** Starts a session and opens the quiz page, asking before discarding an unfinished one. */
export function useStartSession(): (options: StartSessionOptions) => void {
  const navigate = useNavigate();
  return useCallback(
    (options: StartSessionOptions) => {
      if (options.questionIds.length === 0) {
        window.alert('没有符合条件的题目');
        return;
      }
      const active = getAppData().activeSession;
      if (active && !window.confirm(`「${active.title}」还没做完，开始新的练习会放弃它，确定吗？`)) return;
      startSession(options);
      navigate('/quiz');
    },
    [navigate],
  );
}
