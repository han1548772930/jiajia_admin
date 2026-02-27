import { computed } from 'vue';

import { usePreferences } from '@vben/preferences';

import { themeQuartz, type Theme } from 'ag-grid-community';

// Shared base params for AG Grid theme.
const baseTheme = {
  fontFamily: 'inherit',
  fontSize: 14,
  headerFontFamily: 'inherit',
  headerFontSize: 14,
  headerFontWeight: 600,
  headerHeight: 48,
  iconSize: 16,
  rangeSelectionBorderStyle: 'solid',
  rowHeight: 40,
  spacing: 8,
} as const;

interface ThemePalette {
  accentColor: string;
  backgroundColor: string;
  borderColor: string;
  borderRadius: number;
  borderWidth: number;
  foregroundColor: string;
  headerBackgroundColor: string;
  rowHoverColor: string;
  selectedRowBackgroundColor: string;
  tooltipBackgroundColor: string;
  tooltipTextColor: string;
  wrapperBorderRadius: number;
}

const themePalettes: Record<'dark' | 'light', ThemePalette> = {
  light: {
    accentColor: 'oklch(0.45 0.24 277.023)',
    backgroundColor: 'oklch(1 0 0)',
    borderColor: 'oklch(0.95 0 0)',
    borderRadius: 4,
    borderWidth: 1,
    foregroundColor: 'oklch(0.21 0.006 285.885)',
    headerBackgroundColor: 'oklch(0.98 0 0)',
    rowHoverColor: 'oklch(0.98 0 0)',
    selectedRowBackgroundColor: 'oklch(0.98 0 0)',
    tooltipBackgroundColor: 'oklch(0.14 0.005 285.823)',
    tooltipTextColor: 'oklch(0.92 0.004 286.32)',
    wrapperBorderRadius: 8,
  },
  dark: {
    accentColor: 'oklch(0.58 0.233 277.117)',
    backgroundColor: '#0f172a',
    borderColor: '#1e293b',
    borderRadius: 4,
    borderWidth: 1,
    foregroundColor: '#e2e8f0',
    headerBackgroundColor: '#1e293b',
    rowHoverColor: '#334155',
    selectedRowBackgroundColor: '#334155',
    tooltipBackgroundColor: '#020617',
    tooltipTextColor: '#e2e8f0',
    wrapperBorderRadius: 8,
  },
};
export type AgThemeName = keyof typeof themePalettes;

function readCssColorVar(variable: string, fallback: string) {
  if (typeof document === 'undefined') return fallback;

  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue(variable)
    .trim();
  if (!raw) return fallback;

  if (
    raw.startsWith('#') ||
    raw.startsWith('rgb') ||
    raw.startsWith('hsl') ||
    raw.startsWith('oklch')
  ) {
    return raw;
  }

  return `hsl(${raw})`;
}

function readCssColorVarAlpha(
  variable: string,
  alpha: number,
  fallback: string,
) {
  if (typeof document === 'undefined') return fallback;

  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue(variable)
    .trim();
  if (!raw) return fallback;

  if (
    raw.startsWith('#') ||
    raw.startsWith('rgb') ||
    raw.startsWith('hsl') ||
    raw.startsWith('oklch')
  ) {
    return fallback;
  }

  return `hsl(${raw} / ${alpha})`;
}

function resolveThemePalette(themeName: AgThemeName): ThemePalette {
  const fallback = themePalettes[themeName];

  const backgroundColor = readCssColorVar('--card', fallback.backgroundColor);
  const foregroundColor = readCssColorVar('--foreground', fallback.foregroundColor);

  return {
    ...fallback,
    accentColor: readCssColorVar('--primary', fallback.accentColor),
    backgroundColor,
    borderColor: readCssColorVar('--border', fallback.borderColor),
    foregroundColor,
    // Keep header on the same tone as cards, avoid overly dark header strips.
    headerBackgroundColor: backgroundColor,
    // Use primary tint with alpha for clearer hover/selected states in dark mode.
    rowHoverColor: readCssColorVarAlpha(
      '--primary',
      0.08,
      readCssColorVar('--accent', fallback.rowHoverColor),
    ),
    selectedRowBackgroundColor: readCssColorVarAlpha(
      '--primary',
      0.16,
      readCssColorVar('--accent-lighter', fallback.selectedRowBackgroundColor),
    ),
    tooltipBackgroundColor: readCssColorVar(
      '--popover',
      fallback.tooltipBackgroundColor,
    ),
    tooltipTextColor: readCssColorVar(
      '--popover-foreground',
      fallback.tooltipTextColor,
    ),
  };
}

function createFullTheme(palette: ThemePalette) {
  const {
    accentColor,
    backgroundColor,
    borderColor,
    borderWidth,
    foregroundColor,
    headerBackgroundColor,
    rowHoverColor,
    selectedRowBackgroundColor,
  } = palette;
  const borderStyle = `${borderWidth}px solid ${borderColor}`;

  return {
    ...baseTheme,
    accentColor,
    backgroundColor,
    borderColor,
    borderWidth,
    borderRadius: palette.borderRadius,
    cellTextColor: foregroundColor,
    columnBorder: borderStyle,
    foregroundColor,
    headerBackgroundColor,
    headerColumnBorder: borderStyle,
    headerTextColor: foregroundColor,
    menuBackgroundColor: backgroundColor,
    menuBorder: borderStyle,
    menuSeparatorColor: borderColor,
    menuTextColor: foregroundColor,
    oddRowBackgroundColor: backgroundColor,
    panelBackgroundColor: headerBackgroundColor,
    pinnedColumnBorder: borderStyle,
    rangeSelectionBackgroundColor: selectedRowBackgroundColor,
    rangeSelectionBorderColor: accentColor,
    rowBorder: borderStyle,
    rowHoverColor,
    selectedRowBackgroundColor,
    sideBarBackgroundColor: headerBackgroundColor,
    tooltipBackgroundColor: palette.tooltipBackgroundColor,
    tooltipBorder: borderStyle,
    tooltipTextColor: palette.tooltipTextColor,
    wrapperBorderRadius: palette.wrapperBorderRadius,
  };
}

export function getAgTheme(themeName: AgThemeName) {
  const palette = themePalettes[themeName]
    ? resolveThemePalette(themeName)
    : resolveThemePalette('light');
  return createFullTheme(palette);
}

export function createAgGridTheme(themeName: AgThemeName): Theme {
  return themeQuartz.withParams(getAgTheme(themeName));
}

export function useAgGridTheme() {
  const { isDark } = usePreferences();

  const normalizedTheme = computed<AgThemeName>(() =>
    isDark.value ? 'dark' : 'light',
  );

  const currentAgGridTheme = computed(() =>
    createAgGridTheme(normalizedTheme.value),
  );

  const defaultColDef = computed(() => ({
    filter: true,
    minWidth: 100,
    resizable: true,
    sortable: true,
  }));

  const gridOptions = computed(() => ({
    animateRows: true,
    animationDuration: 200,
    enableCellTextSelection: true,
    ensureDomOrder: true,
    suppressMenuHide: false,
  }));

  return {
    createAgGridTheme,
    currentAgGridTheme,
    defaultColDef,
    getAgTheme,
    gridOptions,
    isDark,
  };
}
