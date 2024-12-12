import { VideoSourceOption } from "@/types/source-option-types";
import BaseSource from "./BaseSource";
import LibAV from "libav.js";

class VideoSource extends BaseSource {
    id!: number
    duration!: number
    cover!: string
    src!: string
    width!: number
    height!: number
    videoStreamIndex!: number
    audioStreamIndex!: number
    videoDecoderConfig!: VideoDecoderConfig
    audioDecoderConfig!: AudioDecoderConfig
    constructor(option: VideoSourceOption) {
        super(option)
        this.duration = option.duration
        this.cover = option.cover
        this.src = option.src
        this.width = option.width
        this.height = option.height
        this.videoStreamIndex = option.videoStreamIndex
        this.audioStreamIndex = option.audioStreamIndex
        this.videoDecoderConfig = option.videoDecoderConfig
        this.audioDecoderConfig = option.audioDecoderConfig
        this.id = BaseSource._id
        BaseSource._id++
    }
}

export default VideoSource