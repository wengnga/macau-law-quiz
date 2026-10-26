import React from 'react';
import { toggleStar } from '../state/actions';
import { StarIcon } from './Icons';

interface StarButtonProps {
  questionId: string;
  starred: boolean;
  withLabel?: boolean;
}

export const StarButton: React.FC<StarButtonProps> = ({ questionId, starred, withLabel = false }) => (
  <button
    type="button"
    className={`${withLabel ? 'button button-ghost button-small' : 'icon-button'} star-button ${starred ? 'is-starred' : ''}`}
    aria-pressed={starred}
    aria-label={starred ? '取消收藏' : '收藏'}
    onClick={(event) => {
      event.stopPropagation();
      toggleStar(questionId);
    }}
  >
    <StarIcon filled={starred} size={withLabel ? 18 : 22} />
    {withLabel ? <span>{starred ? '已收藏' : '收藏'}</span> : null}
  </button>
);
