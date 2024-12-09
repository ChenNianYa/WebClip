import useClipStore from "@/store/useClipStore"
import Crunker from "crunker"
// const slientBuffer=(sampleRate:number,time:number)=>
export const mergeAudioBuffer = async (crunker: Crunker) => {
    const clipStore = useClipStore()
    const audioBuffers = []
    for (const video of clipStore.elements.videos) {
        if (video.muted) return
        const audioContext = new AudioContext()
        // 目前没看到什么比较好的处理音频的方案
        const buffer = await video.source.file.arrayBuffer()
        const info = await audioContext.decodeAudioData(buffer)
        const padBuffer = crunker.padAudio(info, 0, Math.ceil(video.startTime))
        // console.log(padBuffer);
        // return padBuffer


        // crunker.play(padBuffer)
        audioBuffers.push(padBuffer)
    }
    return crunker.mergeAudio(audioBuffers)
}

export const muxAudio = (buffer: ArrayBuffer) => {

}