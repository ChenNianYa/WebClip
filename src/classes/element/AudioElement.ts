import AudioSource from "../source/AudioSource";
import BaseElement from "./BaseElement";
// 不需要继承BaseElement 不需要宽高位置什么
class AudioElement {
    source!: AudioSource
    id!: number
    // volume!: number
    constructor(source: AudioSource) {
        this.source = source
        this.id = BaseElement._id
        BaseElement._id++
    }
}
export default AudioElement