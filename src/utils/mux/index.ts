import useClipStore from "@/store/useClipStore";
import { FileSystemWritableFileStreamTarget, Muxer } from "mp4-muxer";
import MuxVideoConfig from "./config";
import { mergeAudioBuffer, muxAudio } from "./audio"
import { muxVideo } from "./video";
import Crunker from "crunker";

// 获取可写入文件流 最后用来流式 的存入本地文件中
const getWritableFileStream = async (fileName: string = 'clip.mp4') => {
    let folderHandle
    try {
        //@ts-ignore
        folderHandle = await window.showDirectoryPicker();
    } catch (error) {
        // @ts-ignore
        if (error.name === "AbortError") {
            console.log("用户取消了文件夹选择。");
        } else {
            console.error("出现错误：", error);
        }
    }
    if (!folderHandle) return
    const handle: FileSystemDirectoryHandle = folderHandle
    const fileHandle = await handle.getFileHandle(fileName, { create: true });
    const writableStream = await fileHandle.createWritable();
    return writableStream
}
const muxMP4 = async () => {
    const clipStore = useClipStore()
    const writableStream = await getWritableFileStream(clipStore.muxVideoName)
    // 没有可写流就return吧，如果结果都放在内存里对大文件不一定放得下
    if (!writableStream) return
    const fileSystemWritableFileStreamTarget = new FileSystemWritableFileStreamTarget(writableStream)
    const crunker = new Crunker()
    // const framesCount = MuxVideoConfig.framerate * Math.ceil(clipStore.duration)
    // 1. 先合成音频  
    const audioBuffer = await mergeAudioBuffer(crunker)

    // 创建muxer对象
    const muxer = new Muxer({
        target: fileSystemWritableFileStreamTarget,
        video: {
            codec: 'avc',
            width: clipStore.width,
            height: clipStore.height,
            frameRate: MuxVideoConfig.framerate
        },
        audio: {
            codec: 'aac',
            numberOfChannels: audioBuffer?.numberOfChannels ?? 1,
            sampleRate: audioBuffer?.sampleRate ?? 48000
        },
        fastStart: false
    })
    // 单独执行还是一起执行呢，怕爆内存? 先单独执行吧
    if (audioBuffer) {
        const data = audioBuffer.getChannelData(0)
        const slice = audioBuffer.length / audioBuffer.duration / MuxVideoConfig.framerate
        for (let i = 0; i < MuxVideoConfig.framerate * audioBuffer.duration; i++) {
            const sample = new Uint8Array(data.slice(i * slice, (i + 1) * slice))
            muxer.addAudioChunkRaw(sample, i % MuxVideoConfig.framerate === 0 ? 'key' : 'delta', i * MuxVideoConfig.cts, MuxVideoConfig.cts)
        }
        // sample=length/duration/framerate
        // function convertAudioBufferToSamples(audioBuffer: AudioBuffer) {
        //     const numberOfChannels = audioBuffer.numberOfChannels;
        //     const length = audioBuffer.length;
        //     const samples = [];
        //     for (let i = 0; i < length; i++) {
        //         for (let channel = 0; channel < numberOfChannels; channel++) {
        //             samples.push();
        //         }
        //     }
        //     return samples;
        // }
        // const samples=convertAudioBufferToSamples(audioBuffer)

        // console.log(audioBuffer, data);

        // const buffer = await crunker.export(audioBuffer, 'audio/mp3').blob.arrayBuffer()
        // const arraybuffer = await crunker.export(audioBuffer, 'audio/mp3').blob.arrayBuffer()
        // muxAudio(arraybuffer)
        // {
        // const data = new Uint8Array(buffer)
        // muxer.addAudioChunkRaw(new Uint8Array(audioBuffer.getChannelData(0)), 'key', 0, MuxVideoConfig.cts)
        // }
        // console.log(muxer);



        // }
    }
    // muxer.
    muxVideo(muxer, writableStream)
}

export default muxMP4