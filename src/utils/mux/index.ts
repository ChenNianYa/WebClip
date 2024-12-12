import useClipStore from "@/store/useClipStore";
import { libav } from "@/web-clip-sdk";
import { clipAv } from "@/web-clip-sdk/clip";
import { packetToEncodedVideoChunk, videoStreamToConfig } from "libavjs-webcodecs-bridge";
import { FileSystemWritableFileStreamTarget, Muxer } from "mp4-muxer";
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
    const offsetCnavs = new OffscreenCanvas(1920, 1080)
    const ctx = offsetCnavs.getContext('2d')
    if (!ctx) return
    const fileSystemWritableFileStreamTarget = new FileSystemWritableFileStreamTarget(writableStream)
    const muxer = new Muxer({
        target: fileSystemWritableFileStreamTarget,
        video: {
            codec: 'avc',
            width: clipStore.width,
            height: clipStore.height,
        },
        audio: {
            codec: 'aac',
            numberOfChannels: clipStore.elements.videos[0].source.audioDecoderConfig.numberOfChannels,
            sampleRate: clipStore.elements.videos[0].source.audioDecoderConfig.sampleRate
        },
        fastStart: false
    })
    for (const video of clipStore.elements.videos) {
        video.clips = [[10, 20], [40, 50], [70, 90], [120, 140], [300, 400]]
        // video.clips = [[10, 20]]
        clipAv(libav, video, muxer, writableStream)
    }

}

export default muxMP4