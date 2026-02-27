// Cron 组件初始状态
import { CRON_MODE, DAY_MODE, WEEK_MODE, type State } from './cronTypes';

export function getInitialState(): State {
  return {
    second: {
      cronEvery: CRON_MODE.EVERY,
      incrementStart: 0,
      incrementIncrement: 1,
      rangeStart: 0,
      rangeEnd: 0,
      specificSpecific: [],
    },
    minute: {
      cronEvery: CRON_MODE.EVERY,
      incrementStart: 0,
      incrementIncrement: 1,
      rangeStart: 0,
      rangeEnd: 0,
      specificSpecific: [],
    },
    hour: {
      cronEvery: CRON_MODE.EVERY,
      incrementStart: 1,
      incrementIncrement: 1,
      rangeStart: 0,
      rangeEnd: 0,
      specificSpecific: [],
    },
    day: {
      cronEvery: DAY_MODE.EVERY_DAY,
      incrementStart: 1,
      incrementIncrement: 1,
      rangeStart: 0,
      rangeEnd: 0,
      specificSpecific: [],
      cronLastSpecificDomDay: 1,
      cronDaysBeforeEomMinus: 0,
      cronDaysNearestWeekday: 1,
    },
    week: {
      cronEvery: WEEK_MODE.EVERY,
      incrementStart: 1,
      incrementIncrement: 1,
      specificSpecific: [],
      cronNthDayDay: 1,
      cronNthDayNth: 1,
    },
    month: {
      cronEvery: CRON_MODE.EVERY,
      incrementStart: 1,
      incrementIncrement: 1,
      rangeStart: 1,
      rangeEnd: 1,
      specificSpecific: [],
    },
    year: {
      cronEvery: CRON_MODE.EVERY,
      incrementStart: new Date().getFullYear(),
      incrementIncrement: 1,
      rangeStart: new Date().getFullYear(),
      rangeEnd: new Date().getFullYear(),
      specificSpecific: [],
    },
  };
}
