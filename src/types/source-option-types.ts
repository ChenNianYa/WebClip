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
    video: HTMLVideoElement
} & BaseSource

export type ImageSourceOption = {
    src: string
    width: number
    height: number
    image: HTMLImageElement
} & BaseSource