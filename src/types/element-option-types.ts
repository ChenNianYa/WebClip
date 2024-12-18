/**
 * BaseElement 配置选项
 */

import AudioElement from "@/classes/element/AudioElement";
import ImageElement from "@/classes/element/ImageElement";
import VideoElement from "@/classes/element/VideoElement";
import ImageSource from "@/classes/source/ImageSource";
import VideoSource from "@/classes/source/VideoSource";

export interface BaseElementOption {
    width: number;
    height: number;
    duration?: number;
    x?: number;
    y?: number;
    rotateDeg?: number
    scale?: number
    level?: number
}

export type VideoElementOption = {
    source: VideoSource;
    muted?: boolean
} & BaseElementOption

export type ImageElementOption = {
    source: ImageSource;
} & BaseElementOption

export interface ElementsMap {
    videos: VideoElement[],
    images: ImageElement[],
}