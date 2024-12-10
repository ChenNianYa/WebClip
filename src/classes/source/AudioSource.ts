import { AudioSourceOption } from "@/types/source-option-types";
import BaseSource from "./BaseSource";

class AudioSource extends BaseSource {
    id!: number
    duration!: number
    src!: string
    video!: HTMLVideoElement
    constructor(option: AudioSourceOption) {
        super(option)
        this.duration = option.duration
        this.src = option.src
        this.id = BaseSource._id
        BaseSource._id++
    }
}

export default AudioSource