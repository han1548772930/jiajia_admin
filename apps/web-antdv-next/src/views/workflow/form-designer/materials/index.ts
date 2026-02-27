import { ADVANCED_FIELD_MATERIALS } from './advanced';
import { BASIC_FIELD_MATERIALS } from './basic';
import { DATETIME_FIELD_MATERIALS } from './datetime';
import { LAYOUT_MATERIALS } from './layout';
import { SELECTOR_FIELD_MATERIALS } from './selector';

export const ALL_FORM_MATERIALS = [
  ...BASIC_FIELD_MATERIALS,
  ...SELECTOR_FIELD_MATERIALS,
  ...DATETIME_FIELD_MATERIALS,
  ...LAYOUT_MATERIALS,
  ...ADVANCED_FIELD_MATERIALS,
] as const;
