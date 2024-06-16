import { useMediaQuery } from './useMediaQuery.js';

// https://tailwindcss.com/docs/responsive-design
const mediaQueries = {
  sm: '(min-width: 640px)',
  md: '(min-width: 768px)',
  lg: '(min-width: 1024px)',
  xl: '(min-width: 1280px)',
  xxl: '(min-width: 1536px)',
};

export function useResponsive(size: keyof typeof mediaQueries) {
  return useMediaQuery(mediaQueries[size]);
}
