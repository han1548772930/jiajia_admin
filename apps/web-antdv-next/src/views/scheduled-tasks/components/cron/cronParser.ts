// Cron 表达式解析函数
import { CRON_MODE, DAY_MODE, WEEK_MODE, type CronPart, type State } from './cronTypes';

// 安全数字解析
const toNum = (s?: string, fallback = 0) => {
  const parsed = Number.parseInt(s ?? '', 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

type ParseUnit = 'second' | 'minute' | 'hour' | 'day' | 'month' | 'week' | 'year';

const normalizeParts = (cronExpression: string) => {
  const raw = (cronExpression ?? '').trim().split(/\s+/).filter(Boolean);
  if (raw.length < 5) return [...raw, '*', '*', '*', '*', '*'].slice(0, 5);
  if (raw.length > 5) return raw.slice(0, 5);
  return raw;
};

const parseList = (part: string) => part.split(',').filter(Boolean);

function parseCommonPart(
  part: string,
  target: CronPart,
  options: { intervalStartFallback: number; rangeFallback: number }
) {
  if (part === '*') {
    target.cronEvery = CRON_MODE.EVERY;
    return;
  }

  if (part.includes('/')) {
    const [start, increment] = part.split('/');
    target.incrementStart = toNum(start, options.intervalStartFallback);
    target.incrementIncrement = toNum(increment, 1);
    target.cronEvery = CRON_MODE.INTERVAL;
    return;
  }

  if (part.includes(',')) {
    target.specificSpecific = parseList(part);
    target.cronEvery = CRON_MODE.SPECIFIC;
    return;
  }

  if (part.includes('-')) {
    const [start, end] = part.split('-');
    target.rangeStart = toNum(start, options.rangeFallback);
    target.rangeEnd = toNum(end, options.rangeFallback);
    target.cronEvery = CRON_MODE.RANGE;
    return;
  }

  target.specificSpecific = parseList(part);
  target.cronEvery = CRON_MODE.SPECIFIC;
}

export function parseCron(cronExpression: string, state: State) {
  const parts = normalizeParts(cronExpression);

  function parsePart(part: string, unit: ParseUnit) {
    switch (unit) {
      case 'second':
        parseCommonPart(part, state.second, {
          intervalStartFallback: 0,
          rangeFallback: 0,
        });
        return;

      case 'minute':
        parseCommonPart(part, state.minute, {
          intervalStartFallback: 0,
          rangeFallback: 0,
        });
        return;

      case 'hour':
        parseCommonPart(part, state.hour, {
          intervalStartFallback: 0,
          rangeFallback: 0,
        });
        return;

      case 'day':
        if (part === '*') {
          state.day.cronEvery = DAY_MODE.EVERY_DAY;
        } else if (part.includes('/')) {
          const [start, increment] = part.split('/');
          state.day.incrementStart = toNum(start, 1);
          state.day.incrementIncrement = toNum(increment, 1);
          state.day.cronEvery = DAY_MODE.EVERY_DAY_INTERVAL;
        } else if (part.includes(',')) {
          state.day.specificSpecific = parseList(part);
          state.day.cronEvery = DAY_MODE.SPECIFIC_DAY;
        } else if (part.includes('-')) {
          const [start, end] = part.split('-');
          state.day.rangeStart = toNum(start, 0);
          state.day.rangeEnd = toNum(end, 0);
          state.day.cronEvery = DAY_MODE.SPECIFIC_WEEK;
        } else if (part === '?') {
          state.day.cronEvery = DAY_MODE.NO_SPECIFIC_DAY;
        } else if (part === 'L') {
          state.day.cronEvery = DAY_MODE.LAST_DAY;
        } else if (part === 'LW') {
          state.day.cronEvery = DAY_MODE.LAST_WORKDAY;
        } else if (part.includes('L-')) {
          state.day.cronEvery = DAY_MODE.DAYS_BEFORE_EOM;
          const [, days] = part.split('-');
          state.day.cronDaysBeforeEomMinus = toNum(days, 0);
        } else if (part.includes('W')) {
          state.day.cronEvery = DAY_MODE.NEAREST_WEEKDAY;
          const [day] = part.split('W');
          state.day.cronDaysNearestWeekday = toNum(day, 1);
        } else if (part.includes('L')) {
          state.day.cronEvery = DAY_MODE.LAST_SPECIFIC_DAY;
          const [day] = part.split('L');
          state.day.cronLastSpecificDomDay = toNum(day, 1);
        } else {
          state.day.specificSpecific = parseList(part);
          state.day.cronEvery = DAY_MODE.SPECIFIC_DAY;
        }
        return;

      case 'month':
        parseCommonPart(part, state.month, {
          intervalStartFallback: 1,
          rangeFallback: 1,
        });
        return;

      case 'week':
        if (part === '*') {
          state.week.cronEvery = WEEK_MODE.EVERY;
        } else if (part.includes('/')) {
          const [start, increment] = part.split('/');
          state.week.incrementStart = toNum(start, 1);
          state.week.incrementIncrement = toNum(increment, 1);
          state.week.cronEvery = WEEK_MODE.INTERVAL;
          state.day.cronEvery = DAY_MODE.EVERY_WEEK_INTERVAL;
        } else if (part.includes(',')) {
          state.week.specificSpecific = parseList(part);
          state.week.cronEvery = WEEK_MODE.SPECIFIC;
          state.day.cronEvery = DAY_MODE.SPECIFIC_WEEK;
        } else if (part.includes('-')) {
          const [start, end] = part.split('-');
          state.week.rangeStart = toNum(start, 1);
          state.week.rangeEnd = toNum(end, 1);
          state.week.cronEvery = WEEK_MODE.RANGE;
        } else if (part.includes('#')) {
          const [day, nth] = part.split('#');
          state.week.cronNthDayDay = toNum(day, 1);
          state.week.cronNthDayNth = toNum(nth, 1);
          state.week.cronEvery = WEEK_MODE.NTH;
          state.day.cronEvery = DAY_MODE.NO_SPECIFIC_DAY;
        } else {
          state.week.specificSpecific = parseList(part);
          state.week.cronEvery = WEEK_MODE.SPECIFIC;
          state.day.cronEvery = DAY_MODE.SPECIFIC_WEEK;
        }
        return;

      case 'year':
        parseCommonPart(part, state.year, {
          intervalStartFallback: new Date().getFullYear(),
          rangeFallback: new Date().getFullYear(),
        });
        return;
    }
  }

  // parsePart(parts[0], 'second');
  parsePart((parts[0] ?? '*') as string, 'minute');
  parsePart((parts[1] ?? '*') as string, 'hour');
  parsePart((parts[2] ?? '*') as string, 'day');
  parsePart((parts[3] ?? '*') as string, 'month');
  parsePart((parts[4] ?? '*') as string, 'week');
  // parsePart(parts[5], 'year');
}
