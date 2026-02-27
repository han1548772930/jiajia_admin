import { computed } from 'vue';

import { usePreferences } from '@vben/preferences';

import { themeQuartz, type Theme } from 'ag-grid-community';

// 基础配置 (所有主题共享的样式)
const baseTheme = {
  headerFontFamily: 'inherit',
  headerFontSize: 14,
  headerFontWeight: 600,
  fontFamily: 'inherit',
  fontSize: 14,
  spacing: 8,
  rowHeight: 40,
  headerHeight: 48,
  iconSize: 16,
  rangeSelectionBorderStyle: 'solid',
} as const;

// 主题调色板
const themePalettes = {
  light: {
    backgroundColor: 'oklch(1 0 0)',
    foregroundColor: 'oklch(0.21 0.006 285.885)',
    borderColor: 'oklch(0.95 0 0)',
    borderWidth: 1,
    headerBackgroundColor: 'oklch(0.98 0 0)',
    rowHoverColor: 'oklch(0.98 0 0)',
    accentColor: 'oklch(0.45 0.24 277.023)',
    borderRadius: 4,
    wrapperBorderRadius: 8,
    tooltipBackgroundColor: 'oklch(0.14 0.005 285.823)',
    tooltipTextColor: 'oklch(0.92 0.004 286.32)',
  },
  dark: {
    backgroundColor: '#0f172a', // slate-900
    foregroundColor: '#e2e8f0', // slate-200
    borderColor: '#1e293b', // slate-800
    borderWidth: 1,
    headerBackgroundColor: '#1e293b', // slate-800
    rowHoverColor: '#334155', // slate-700
    accentColor: 'oklch(0.58 0.233 277.117)',
    borderRadius: 4,
    wrapperBorderRadius: 8,
    tooltipBackgroundColor: '#020617', // slate-950
    tooltipTextColor: '#e2e8f0', // slate-200
  },
} as const;

type ThemePalette = (typeof themePalettes)[keyof typeof themePalettes];
export type AgThemeName = keyof typeof themePalettes;

function createFullTheme(palette: ThemePalette) {
  const {
    borderWidth,
    borderColor,
    foregroundColor,
    accentColor,
    backgroundColor,
    headerBackgroundColor,
    rowHoverColor,
  } = palette;
  const borderStyle = `${borderWidth}px solid ${borderColor}`;

  return {
    ...baseTheme,
    backgroundColor,
    foregroundColor,
    borderColor,
    borderWidth,
    headerBackgroundColor,
    oddRowBackgroundColor: backgroundColor,
    rowHoverColor,
    accentColor,
    borderRadius: palette.borderRadius,
    wrapperBorderRadius: palette.wrapperBorderRadius,
    headerTextColor: foregroundColor,
    cellTextColor: foregroundColor,
    selectedRowBackgroundColor: accentColor,
    rangeSelectionBorderColor: accentColor,
    rangeSelectionBackgroundColor: accentColor,
    menuBackgroundColor: backgroundColor,
    menuTextColor: foregroundColor,
    menuBorder: borderStyle,
    menuSeparatorColor: borderColor,
    panelBackgroundColor: headerBackgroundColor,
    sideBarBackgroundColor: headerBackgroundColor,
    rowBorder: borderStyle,
    columnBorder: borderStyle,
    headerColumnBorder: borderStyle,
    pinnedColumnBorder: borderStyle,
    tooltipBackgroundColor: palette.tooltipBackgroundColor,
    tooltipTextColor: palette.tooltipTextColor,
    tooltipBorder: borderStyle,
  };
}

export function getAgTheme(themeName: AgThemeName) {
  return themePalettes[themeName] ? createFullTheme(themePalettes[themeName]) : createFullTheme(themePalettes.light);
}

export function createAgGridTheme(themeName: AgThemeName): Theme {
  const themeParams = getAgTheme(themeName);
  return themeQuartz.withParams(themeParams);
}

export function useAgGridTheme() {
  const { isDark } = usePreferences();

  const normalizedTheme = computed<AgThemeName>(() => (isDark.value ? 'dark' : 'light'));

  const currentAgGridTheme = computed(() => {
    return createAgGridTheme(normalizedTheme.value);
  });

  const defaultColDef = computed(() => ({
    minWidth: 100,
    filter: true,
    sortable: true,
    resizable: true,
  }));

  const gridOptions = computed(() => ({
    animateRows: true,
    suppressMenuHide: false,
    enableCellTextSelection: true,
    ensureDomOrder: true,
    animationDuration: 200,
  }));

  return {
    isDark,
    currentAgGridTheme,
    defaultColDef,
    gridOptions,
    getAgTheme,
    createAgGridTheme,
  };
}
