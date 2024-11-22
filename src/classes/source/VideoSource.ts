import { VideoSourceOption } from "@/types/source-option-types";
import BaseSource from "./BaseSource";

class VideoSource extends BaseSource {
    id!: number
    duration!: number
    cover!: string
    src!: string
    width!: number
    height!: number
    constructor(option: VideoSourceOption) {
        super(option)
        this.duration = option.duration
        this.cover = option.cover
        this.src = option.src
        this.id = BaseSource._id
        this.width = option.width
        this.height = option.height
        BaseSource._id++
    }
}

export default VideoSource