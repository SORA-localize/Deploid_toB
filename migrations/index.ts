import * as migration_20260811_153537_initial_schema from './20260811_153537_initial_schema';
import * as migration_20260812_014819_deployment_status_enum from './20260812_014819_deployment_status_enum';
import * as migration_20260812_080919_date_only_content_fields_to_text from './20260812_080919_date_only_content_fields_to_text';
import * as migration_20260814_020026_site_settings_data_as_of_and_placement_limits from './20260814_020026_site_settings_data_as_of_and_placement_limits';
import * as migration_20260814_122137_restore_baseline_generation_ledger from './20260814_122137_restore_baseline_generation_ledger';

export const migrations = [
  {
    up: migration_20260811_153537_initial_schema.up,
    down: migration_20260811_153537_initial_schema.down,
    name: '20260811_153537_initial_schema',
  },
  {
    up: migration_20260812_014819_deployment_status_enum.up,
    down: migration_20260812_014819_deployment_status_enum.down,
    name: '20260812_014819_deployment_status_enum',
  },
  {
    up: migration_20260812_080919_date_only_content_fields_to_text.up,
    down: migration_20260812_080919_date_only_content_fields_to_text.down,
    name: '20260812_080919_date_only_content_fields_to_text',
  },
  {
    up: migration_20260814_020026_site_settings_data_as_of_and_placement_limits.up,
    down: migration_20260814_020026_site_settings_data_as_of_and_placement_limits.down,
    name: '20260814_020026_site_settings_data_as_of_and_placement_limits',
  },
  {
    up: migration_20260814_122137_restore_baseline_generation_ledger.up,
    down: migration_20260814_122137_restore_baseline_generation_ledger.down,
    name: '20260814_122137_restore_baseline_generation_ledger'
  },
];
