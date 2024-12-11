import LibAV from "libav.js"
import BaseSource from "../classes/source/BaseSource"

export interface BaseSourceOption {
    name: string
    file: Blob
    size: number
}

export type VideoSourceOption = {
    duration: number
    cover: string
    src: string
    width: number
    height: number
    streams: LibAV.Stream[]
    videoStreamIndex: number,
    audioStreamIndex: number,
    fc: number // format_ctx
} & BaseSource

export type ImageSourceOption = {
    src: string
    width: number
    height: number
    image: HTMLImageElement
} & BaseSource

export type AudioSourceOption = {
    duration: number
    src: string
} & BaseSource