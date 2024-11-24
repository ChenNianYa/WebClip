/**
 * 二维坐标系中的点
 */
export type Point = [number, number]
/**
 * 剪辑的start end time
 */
export type ClipCut = [number, number]

/**
 * 分辨率（尺寸）
 */
export interface Resolution {
    width: number;
    height: number;
}

/**
 * 画布分辨率与实际宽高的比例
 */
export interface CvsRatio {
    w: number;
    h: number;
}

/**
 * CanvasManager 配置选项
 */

export interface CanvasManagerOption {
    width: number;
    height: number;
    canvas: HTMLCanvasElement;
    axis: HTMLDivElement;
    ctrl: HTMLDivElement;
    container: HTMLDivElement;
}
/**
 * ctrl option
 */

export type CtrlOption = 'tl' | 'tr' | 'bl' | 'br' | 'rotate' | 'moving' | null