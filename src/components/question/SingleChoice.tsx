import React from 'react';
import { CheckIcon, CrossIcon } from '../Icons';
import { RichText } from '../RichText';
import type { QuestionRendererProps } from './types';

type OptionState = 'idle' | 'selected' | 'correct' | 'wrong' | 'dimmed';

function optionState(key: string, props: QuestionRendererProps): OptionState {
  const chosen = props.selected?.includes(key) ?? false;
  if (!props.reveal) return chosen ? 'selected' : 'idle';
  if (props.question.answer.includes(key)) return 'correct';
  return chosen ? 'wrong' : 'dimmed';
}

export const SingleChoice: React.FC<QuestionRendererProps> = (props) => {
  const { question, format, disabled, onSelect } = props;
  return (
    <div className="options" role="radiogroup">
      {question.options.map((option) => {
        const state = optionState(option.key, props);
        return (
          <button
            key={option.key}
            type="button"
            role="radio"
            aria-checked={props.selected?.includes(option.key) ?? false}
            className={`option option-${state}`}
            disabled={disabled}
            onClick={() => onSelect?.(option.key)}
          >
            <span className="option-key">{option.key}</span>
            <RichText className="option-text" content={option.content} format={format} />
            {state === 'correct' ? (
              <span className="option-mark">
                <CheckIcon />
              </span>
            ) : state === 'wrong' ? (
              <span className="option-mark">
                <CrossIcon />
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
};
