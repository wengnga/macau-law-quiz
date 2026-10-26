import React from 'react';

interface IconProps {
  size?: number;
}

const Svg: React.FC<IconProps & { children: React.ReactNode; fill?: string }> = ({ size = 20, children, fill = 'none' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill={fill}
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {children}
  </svg>
);

export const ChevronLeftIcon: React.FC<IconProps> = (props) => (
  <Svg {...props}>
    <path d="M15 18l-6-6 6-6" />
  </Svg>
);

export const ChevronRightIcon: React.FC<IconProps> = (props) => (
  <Svg {...props}>
    <path d="M9 18l6-6-6-6" />
  </Svg>
);

export const StarIcon: React.FC<IconProps & { filled?: boolean }> = ({ filled = false, ...props }) => (
  <Svg {...props} fill={filled ? 'currentColor' : 'none'}>
    <path d="M12 3.5l2.6 5.3 5.9.9-4.25 4.1 1 5.85L12 16.9l-5.25 2.75 1-5.85L3.5 9.7l5.9-.9z" />
  </Svg>
);

export const CheckIcon: React.FC<IconProps> = (props) => (
  <Svg {...props}>
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </Svg>
);

export const CrossIcon: React.FC<IconProps> = (props) => (
  <Svg {...props}>
    <path d="M6 6l12 12M18 6L6 18" />
  </Svg>
);

export const GridIcon: React.FC<IconProps> = (props) => (
  <Svg {...props}>
    <rect x="4" y="4" width="6" height="6" rx="1" />
    <rect x="14" y="4" width="6" height="6" rx="1" />
    <rect x="4" y="14" width="6" height="6" rx="1" />
    <rect x="14" y="14" width="6" height="6" rx="1" />
  </Svg>
);
