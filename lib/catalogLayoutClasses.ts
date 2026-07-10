export const browserGridClassNames = {
  robots:
    'robot-card-grid grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5',
  manufacturers:
    'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5',
  reports:
    'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 items-stretch',
  useCases:
    'grid auto-rows-fr grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
} as const;

export const browserFilterGridClassNames = {
  robots:
    'flex w-max min-w-full gap-3 sm:grid sm:w-auto sm:grid-cols-2 sm:gap-4 xl:grid-cols-3 xl:max-w-3xl xl:shrink-0',
  manufacturers:
    'flex w-max min-w-full gap-3 sm:grid sm:w-auto sm:grid-cols-2 sm:gap-4 sm:max-w-2xl sm:shrink-0',
} as const;
