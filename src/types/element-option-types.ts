/**
 * BaseElement 配置选项
 */

import ImageElement from "@/classes/element/ImageElement";
import VideoElement from "@/classes/element/VideoElement";
import ImageSource from "@/classes/source/ImageSource";
import VideoSource from "@/classes/source/VideoSource";

export interface BaseElementOption {
    width: number;
    height: number;
    x?: number;
    y?: number;
    rotateDeg?: number
    scale?: number
    level?: number
}

export type VideoElementOption = {
    source: VideoSource;
} & BaseElementOption

export type ImageElementOption = {
    source: ImageSource;
} & BaseElementOption

export interface ElementsMap {
    videos: VideoElement[],
    images: ImageElement[]
}