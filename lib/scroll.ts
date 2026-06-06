export function getPageScrollBehavior(): ScrollBehavior {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return 'auto';
  }

  return 'smooth';
}

export function scrollToPageTop() {
  window.scrollTo({ top: 0, behavior: getPageScrollBehavior() });
}
