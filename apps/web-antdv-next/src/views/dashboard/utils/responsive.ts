import { computed } from 'vue';

/**
 * 根据屏幕宽度计算响应式字体大小
 * @param base 基准字体大小（基于1920px宽度）
 * @returns 计算后的字体大小
 */
export function responsiveFontSize(base: number): number {
  return Math.round((window.innerWidth / 1920) * base);
}

/**
 * 根据屏幕宽度计算响应式尺寸（用于宽度、高度等）
 * @param base 基准尺寸（基于1920px宽度）
 * @returns 计算后的尺寸
 */
export function responsiveSize(base: number): number {
  return Math.round((window.innerWidth / 1920) * base);
}

/**
 * 创建响应式字体大小 Ref
 * @param base 基准字体大小
 * @returns 响应式的字体大小值
 */
export function useResponsiveFontSize(base: number) {
  return computed(() => responsiveFontSize(base));
}
