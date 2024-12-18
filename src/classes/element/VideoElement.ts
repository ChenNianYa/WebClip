import VideoSource from "../source/VideoSource";
import BaseElement from "./BaseElement";
import { VideoElementOption } from "@/types/element-option-types";

class VideoElement extends BaseElement {
    source!: VideoSource
    muted = false
    constructor(option: VideoElementOption) {
        option.duration = option.source.duration
        super(option)
        this.source = option.source
        this.muted = option.muted || false
    }
}

export default VideoElement