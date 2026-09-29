import * as migration_20260921_085427_initial from './20260921_085427_initial';
import * as migration_20260929_080740_site_collections from './20260929_080740_site_collections';
import * as migration_20260929_100823_inquiries from './20260929_100823_inquiries';
import * as migration_20260929_133018_wos336_inquiries_optional_name from './20260929_133018_wos336_inquiries_optional_name';

export const migrations = [
  {
    up: migration_20260921_085427_initial.up,
    down: migration_20260921_085427_initial.down,
    name: '20260921_085427_initial',
  },
  {
    up: migration_20260929_080740_site_collections.up,
    down: migration_20260929_080740_site_collections.down,
    name: '20260929_080740_site_collections',
  },
  {
    up: migration_20260929_100823_inquiries.up,
    down: migration_20260929_100823_inquiries.down,
    name: '20260929_100823_inquiries',
  },
  {
    up: migration_20260929_133018_wos336_inquiries_optional_name.up,
    down: migration_20260929_133018_wos336_inquiries_optional_name.down,
    name: '20260929_133018_wos336_inquiries_optional_name'
  },
];
