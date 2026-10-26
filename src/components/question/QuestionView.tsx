import React from 'react';
import type { Material, QuestionType } from '../../domain/types';
import { RichText } from '../RichText';
import { SingleChoice } from './SingleChoice';
import type { QuestionRendererProps } from './types';

/** Register a renderer here when adding a new question type. */
const RENDERERS: Partial<Record<QuestionType, React.FC<QuestionRendererProps>>> = {
  single: SingleChoice,
};

interface QuestionViewProps extends QuestionRendererProps {
  material?: Material;
  hideStem?: boolean;
}

export const QuestionView: React.FC<QuestionViewProps> = ({ material, hideStem = false, ...props }) => {
  const Renderer = RENDERERS[props.question.type];
  return (
    <div className="question">
      {material ? (
        <div className="material">
          <RichText content={material.content} format={props.format} />
        </div>
      ) : null}
      {hideStem ? null : (
        <div className="question-stem">
          <RichText content={props.question.stem} format={props.format} />
        </div>
      )}
      {Renderer ? <Renderer {...props} /> : <div className="notice">暂不支持「{props.question.type}」题型</div>}
    </div>
  );
};
