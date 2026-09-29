import * as migration_20260921_085427_initial from './20260921_085427_initial';
import * as migration_20260929_080740_site_collections from './20260929_080740_site_collections';

export const migrations = [
  {
    up: migration_20260921_085427_initial.up,
    down: migration_20260921_085427_initial.down,
    name: '20260921_085427_initial',
  },
  {
    up: migration_20260929_080740_site_collections.up,
    down: migration_20260929_080740_site_collections.down,
    name: '20260929_080740_site_collections'
  },
];
