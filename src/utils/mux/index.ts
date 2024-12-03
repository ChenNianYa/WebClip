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
    // audioBuffer.
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
        crunker.play(audioBuffer)



        const numChannels = audioBuffer.numberOfChannels;
        let length = 0;
        for (let i = 0; i < numChannels; i++) {
            length += audioBuffer.getChannelData(i).length
        }
        const combinedData = new Float32Array(length)
        for (let i = 0; i < numChannels; i++) {
            audioBuffer.copyFromChannel(combinedData, i)
        }
        const audioData = new AudioData({
            // 当前音频片段的时间偏移
            timestamp: 0,
            // 双声道
            numberOfChannels: audioBuffer.numberOfChannels,
            // 帧数，就是多少个数据点，因为双声道，前一半左声道后一半右声道，所以帧数需要除以 2
            numberOfFrames: length / audioBuffer.numberOfChannels,
            // 48KHz 采样率
            sampleRate: audioBuffer.sampleRate,
            // 通常 32位 左右声道并排的意思，更多 format 看 AudioData 文档
            format: 'f32-planar',
            data: combinedData,
        });
        console.log(audioBuffer, audioData);
        // muxer.addAudioChunkRaw(audioData, 'key', audioData.timestamp,audioData.duration)
        let i = 0;
        const encoder = new AudioEncoder({
            output: (chunk) => {
                i++
                console.log(chunk, i, encoder.encodeQueueSize);
                muxer.addAudioChunk(chunk)

                // 编码（压缩）输出的 EncodedAudioChunk
            },
            error: console.error,
        });

        encoder.configure({
            // AAC 编码格式
            codec: 'mp4a.40.2',
            sampleRate: audioBuffer.sampleRate,
            numberOfChannels: audioBuffer.numberOfChannels,
        });

        // // 编码原始数据对应的 AudioData
        encoder.encode(audioData);
        await encoder.flush()
        muxVideo(muxer, writableStream)
        // audioData.close()


    }

}

export default muxMP4