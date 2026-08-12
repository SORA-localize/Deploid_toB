import * as migration_20260811_153537_initial_schema from './20260811_153537_initial_schema';
import * as migration_20260812_014819_deployment_status_enum from './20260812_014819_deployment_status_enum';

export const migrations = [
  {
    up: migration_20260811_153537_initial_schema.up,
    down: migration_20260811_153537_initial_schema.down,
    name: '20260811_153537_initial_schema',
  },
  {
    up: migration_20260812_014819_deployment_status_enum.up,
    down: migration_20260812_014819_deployment_status_enum.down,
    name: '20260812_014819_deployment_status_enum'
  },
];
