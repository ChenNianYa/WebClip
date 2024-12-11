import useClipStore from "@/store/useClipStore";
import { libav } from "@/web-clip-sdk";
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
            frameRate: clipStore.frameRate
        },
        fastStart: false
    })
    let endDecoder = false
    let encoderOver = false
    const videoEncoder = new VideoEncoder({
        output: (chunk, meta) => {
            muxer.addVideoChunk(chunk, meta)
        },
        error: e => console.error(e)
    });
    videoEncoder.addEventListener('dequeue', async (e) => {
        // console.log(e);
        if (videoEncoder.encodeQueueSize === 0 && endDecoder) {
            encoderOver = true
            console.log(encoderOver);
            requestAnimationFrame(async () => {
                videoEncoder.close()
                muxer.finalize();
                await writableStream.close()
                console.log('over');
            })


        }
    })
    videoEncoder.configure({
        codec: 'avc1.4D0032',
        width: clipStore.width,
        height: clipStore.height,
        hardwareAcceleration: 'prefer-software'
    });
    for (const video of clipStore.elements.videos) {
        let count = 0
        const { videoStreamIndex, streams, fc, name } = video.source
        // await libav.mkreadaheadfile(video.source.name, video.source.file)
        // libav.readFile(video.source.name)
        const config = await videoStreamToConfig(libav, streams[videoStreamIndex])

        const decoder = new VideoDecoder({
            output: async (v) => {
                console.log(v);

                const frame = new VideoFrame(await createImageBitmap(v), { timestamp: count * 1000000 / 25 })
                videoEncoder.encode(frame)
                count++
                frame.close()
                v.close()
            },
            error: console.log
        })
        decoder.addEventListener('dequeue', () => {
            if (decoder.decodeQueueSize === 0) {
                if (!endDecoder) {
                    parserVideo()
                }
            }
        })
        decoder.configure(config)
        const rpkt = await libav.av_packet_alloc();
        const findBeastStartFrame = async () => {
            const rpkt = await libav.av_packet_alloc();
            const [res, packets] = await libav.ff_read_frame_multi(fc, rpkt, { limit: 1024 * 1024 * 100 })
            let bestPts = 0;
            for (const pkt of packets[video.source.videoStreamIndex]) {
                if (pkt.pts && pkt.time_base_den) {
                    const pktTime = pkt.pts / pkt.time_base_den
                    const encodedVideoChunk = packetToEncodedVideoChunk(pkt, streams[videoStreamIndex])
                    if (encodedVideoChunk.type === 'key') {
                        if (pktTime < 30) {
                            bestPts = pkt.pts
                        } else if (pktTime > 30) {
                            if ((pktTime - 30) < (30 - bestPts / pkt.time_base_den)) {
                                bestPts = pkt.pts
                                libav.av_packet_free(rpkt)
                                return bestPts
                            }
                        }
                    }
                    // if (encodedVideoChunk.type === 'key') {

                    // }
                }

            }
            libav.av_packet_free(rpkt)
            return bestPts
        }
        const bestPts = await findBeastStartFrame()
        console.log(bestPts);
        const mpkt = await libav.av_packet_alloc();
        const [fc2, streams2] = await libav.ff_init_demuxer_file(name)
        const parserVideo = async () => {
            const [res, packets] = await libav.ff_read_frame_multi(fc2, mpkt, { limit: 1024 * 1024 * 100 })
            for (const pkt of packets[video.source.videoStreamIndex]) {
                if (pkt.pts && pkt.time_base_den) {
                    const pktTime = pkt.pts / pkt.time_base_den
                    if (pkt.pts >= bestPts && pktTime < 40) {
                        const encodedVideoChunk = packetToEncodedVideoChunk(pkt, streams2[videoStreamIndex])
                        decoder.decode(encodedVideoChunk)
                    } else if (pktTime > 40) {
                        endDecoder = true
                        // libav.av_packet_free(rpkt)
                    }
                }

            }
        }
        parserVideo()
    }

}

export default muxMP4