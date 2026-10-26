import type { ContentFormat, Question } from '../../domain/types';

export interface QuestionRendererProps {
  question: Question;
  format: ContentFormat;
  selected?: readonly string[];
  /** Show the correct answer (after answering, in memorize mode, or in review lists). */
  reveal: boolean;
  disabled: boolean;
  onSelect?: (key: string) => void;
}
