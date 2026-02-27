// Cron 组件类型定义

export const CRON_MODE = {
  EVERY: '1',
  INTERVAL: '2',
  SPECIFIC: '3',
  RANGE: '4',
} as const;

export const DAY_MODE = {
  EVERY_DAY: '1',
  EVERY_WEEK_INTERVAL: '2',
  EVERY_DAY_INTERVAL: '3',
  SPECIFIC_WEEK: '4',
  SPECIFIC_DAY: '5',
  LAST_DAY: '6',
  LAST_WORKDAY: '7',
  LAST_SPECIFIC_DAY: '8',
  DAYS_BEFORE_EOM: '9',
  NEAREST_WEEKDAY: '10',
  NO_SPECIFIC_DAY: '11',
} as const;

export const WEEK_MODE = {
  EVERY: '1',
  INTERVAL: '2',
  SPECIFIC: '3',
  RANGE: '4',
  NTH: '11',
} as const;

export type CronMode = (typeof CRON_MODE)[keyof typeof CRON_MODE];
export type DayMode = (typeof DAY_MODE)[keyof typeof DAY_MODE];
export type WeekMode = (typeof WEEK_MODE)[keyof typeof WEEK_MODE];

export type CronPart<TMode extends string = CronMode> = {
  cronEvery: TMode;
  incrementStart: number | null;
  incrementIncrement: number | null;
  rangeStart?: number | null;
  rangeEnd?: number | null;
  specificSpecific: string[];
};

export type DayPart = CronPart<DayMode> & {
  cronLastSpecificDomDay: number | null;
  cronDaysBeforeEomMinus: number | null;
  cronDaysNearestWeekday: number | null;
};

export type WeekPart = CronPart<WeekMode> & {
  cronNthDayDay: number | null;
  cronNthDayNth: number | null;
  rangeStart?: number | null;
  rangeEnd?: number | null;
};

export type State = {
  second: CronPart;
  minute: CronPart;
  hour: CronPart;
  day: DayPart;
  week: WeekPart;
  month: CronPart;
  year: CronPart;
};

export interface CronProps {
  cron: string;
  cronData: string;
}

export interface WeekItem {
  name: string;
  value: string;
  val: number;
}
