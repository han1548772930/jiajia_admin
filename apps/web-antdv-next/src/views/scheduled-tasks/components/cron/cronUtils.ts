// Cron 计算工具函数
import { CRON_MODE, DAY_MODE, type State } from './cronTypes';

const num = (value: number | null | undefined, fallback: number) => (value ?? fallback);
const csv = (values: string[]) => values.join(',');

// 计算分钟文本
export function computeMinutesText(state: State): string {
  switch (state.minute.cronEvery) {
    case CRON_MODE.EVERY:
      return '*';
    case CRON_MODE.INTERVAL:
      return `${num(state.minute.incrementStart, 0)}/${num(state.minute.incrementIncrement, 1)}`;
    case CRON_MODE.SPECIFIC:
      return csv(state.minute.specificSpecific);
    case CRON_MODE.RANGE:
      return `${num(state.minute.rangeStart, 0)}-${num(state.minute.rangeEnd, 0)}`;
    default:
      return '';
  }
}

// 计算小时文本
export function computeHoursText(state: State): string {
  switch (state.hour.cronEvery) {
    case CRON_MODE.EVERY:
      return '*';
    case CRON_MODE.INTERVAL:
      return `${num(state.hour.incrementStart, 1)}/${num(state.hour.incrementIncrement, 1)}`;
    case CRON_MODE.SPECIFIC:
      return csv(state.hour.specificSpecific);
    case CRON_MODE.RANGE:
      return `${num(state.hour.rangeStart, 0)}-${num(state.hour.rangeEnd, 0)}`;
    default:
      return '';
  }
}

// 计算天文本
export function computeDaysText(state: State): string {
  switch (state.day.cronEvery) {
    case DAY_MODE.EVERY_DAY:
      return '';
    case DAY_MODE.EVERY_WEEK_INTERVAL:
    case DAY_MODE.SPECIFIC_WEEK:
    case DAY_MODE.NO_SPECIFIC_DAY:
      return '*';
    case DAY_MODE.EVERY_DAY_INTERVAL:
      return `${num(state.day.incrementStart, 1)}/${num(state.day.incrementIncrement, 1)}`;
    case DAY_MODE.SPECIFIC_DAY:
      return csv(state.day.specificSpecific);
    case DAY_MODE.LAST_DAY:
      return 'L';
    case DAY_MODE.LAST_WORKDAY:
      return 'LW';
    case DAY_MODE.LAST_SPECIFIC_DAY:
      return `${num(state.day.cronLastSpecificDomDay, 1)}L`;
    case DAY_MODE.DAYS_BEFORE_EOM:
      return `L-${num(state.day.cronDaysBeforeEomMinus, 0)}`;
    case DAY_MODE.NEAREST_WEEKDAY:
      return `${num(state.day.cronDaysNearestWeekday, 1)}W`;
    default:
      return '';
  }
}

// 计算周文本
export function computeWeeksText(state: State): string {
  switch (state.day.cronEvery) {
    case DAY_MODE.EVERY_DAY:
    case DAY_MODE.EVERY_DAY_INTERVAL:
    case DAY_MODE.SPECIFIC_DAY:
      return '*';
    case DAY_MODE.EVERY_WEEK_INTERVAL:
      return `${num(state.week.incrementStart, 1)}/${num(state.week.incrementIncrement, 1)}`;
    case DAY_MODE.SPECIFIC_WEEK:
      return csv(state.week.specificSpecific);
    case DAY_MODE.LAST_DAY:
    case DAY_MODE.LAST_WORKDAY:
    case DAY_MODE.LAST_SPECIFIC_DAY:
    case DAY_MODE.DAYS_BEFORE_EOM:
    case DAY_MODE.NEAREST_WEEKDAY:
      return '*';
    case DAY_MODE.NO_SPECIFIC_DAY:
      return `${num(state.week.cronNthDayDay, 1)}#${num(state.week.cronNthDayNth, 1)}`;
    default:
      return '';
  }
}

// 计算月文本
export function computeMonthsText(state: State): string {
  switch (state.month.cronEvery) {
    case CRON_MODE.EVERY:
      return '*';
    case CRON_MODE.INTERVAL:
      return `${num(state.month.incrementStart, 1)}/${num(state.month.incrementIncrement, 1)}`;
    case CRON_MODE.SPECIFIC:
      return csv(state.month.specificSpecific);
    case CRON_MODE.RANGE:
      return `${num(state.month.rangeStart, 1)}-${num(state.month.rangeEnd, 1)}`;
    default:
      return '';
  }
}

// 生成完整的 Cron 表达式
export function computeCronExpression(state: State): string {
  const minutes = computeMinutesText(state) || '*';
  const hours = computeHoursText(state) || '*';
  const days = computeDaysText(state) || '*';
  const months = computeMonthsText(state) || '*';
  const weeks = computeWeeksText(state) || '*';

  return `${minutes} ${hours} ${days} ${months} ${weeks}`;
}
