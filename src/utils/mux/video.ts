import VideoElement from '@/classes/element/VideoElement';
import useClipStore from '@/store/useClipStore';
import mp4box, { MP4ArrayBuffer, MP4File, MP4Info } from '@webav/mp4box.js';
import { Muxer, FileSystemWritableFileStreamTarget } from 'mp4-muxer';
import { elementInPreview } from '../preview-utils';
const framerate = 25
const oneSecondInMicrosecond = 1000000
const cts = oneSecondInMicrosecond / framerate
const DataStream = mp4box.DataStream
export const muxVideo = async (muxer: Muxer<FileSystemWritableFileStreamTarget>, writableStream: FileSystemWritableFileStream) => {
    const clipStore = useClipStore()
    const muxOffscreenCanvas = new OffscreenCanvas(clipStore.width, clipStore.height)
    const ctx = muxOffscreenCanvas.getContext('2d')
    if (!ctx) return
    const framesCount = framerate * Math.ceil(clipStore.duration)
    console.log('framesCount', framesCount);

    let muxNumber = 0;
    const videoEncoder = new VideoEncoder({
        output: async (chunk, meta) => {
            muxer.addVideoChunk(chunk, meta)
            muxNumber++;
            if (muxNumber === framesCount) {
                muxer.finalize();
                await writableStream.close()
                console.log('over');
            }
        },
        error: e => console.error(e)
    });
    videoEncoder.configure({
        codec: 'avc1.4D0032',
        width: clipStore.width,
        height: clipStore.height,
        hardwareAcceleration: 'prefer-software'
    });

    // key 是id
    const decoderFiles: { [key in number]: { decoder: VideoDecoder, file: MP4File, decoderNum: number, info: MP4Info } } = {}
    let decoderIndex = 0
    let decoderSampleCount = 0;
    let timer: NodeJS.Timeout
    let outputFrames: { id: number, frame: VideoFrame }[] = []
    const output = async (videoFrame: VideoFrame, id: number) => {
        // console.log(id, videoFrame);
        outputFrames.push({ id, frame: videoFrame })
        if (decoderSampleCount !== outputFrames.length) return
        console.log(decoderIndex, 'success');
        ctx.clearRect(0, 0, clipStore.width, clipStore.height)
        // 画帧
        for (const outputFrame of outputFrames) {
            const video = clipStore.elements.videos.find(v => v.id === outputFrame.id)
            if (!video) return
            ctx.drawImage(outputFrame.frame, video.x, video.y, video.width, video.height)
            outputFrame.frame.close()
        }
        // 画图片
        for (const img of clipStore.elements.images) {
            const frameTime = decoderIndex / framerate
            if (elementInPreview(img, frameTime)) {
                ctx.drawImage(img.source.image, img.x, img.y, img.width, img.height)
            }
        }
        encodeFrame(decoderIndex)
        decoderIndex++
        decoderSamples(decoderIndex)
    }

    // 获取file和trak
    for (const video of clipStore.elements.videos) {
        const res = await getDecoderFile(video, output)
        if (res) {
            decoderFiles[video.id] = { ...res, decoderNum: 0 }
        }
    }
    console.log(decoderFiles);

    // 编排samples
    const samplesResult: { vid: number, index: number }[][] = []
    for (let i = 0; i < framesCount; i++) {
        const frameTime = i / framerate
        const samples: { vid: number, index: number }[] = []
        for (const video of clipStore.elements.videos) {
            const id = video.id
            if (elementInPreview(video, frameTime)) {
                if (decoderFiles[id].info.videoTracks[0].nb_samples > decoderFiles[id].decoderNum) {
                    // @ts-ignore
                    // const sample = decoderFiles[id].file.getTrackSample(decoderFiles[id].info.videoTracks[0].id, decoderFiles[id].decoderNum)
                    samples.push({ vid: id, index: decoderFiles[id].decoderNum })
                    decoderFiles[id].decoderNum++;
                }

            }
        }
        samplesResult.push(samples)
    }
    // 编码samples
    const decoderSamples = async (i: number) => {
        if (i >= framesCount) return
        clearTimeout(timer)
        outputFrames = []
        const frameSamples = samplesResult[i]
        decoderSampleCount = frameSamples.length
        for (const frameSample of frameSamples) {
            const { vid, index } = frameSample
            const { file, decoder, info } = decoderFiles[vid]
            const tid = info.videoTracks[0].id
            //@ts-ignore
            const sample = file.getTrackSample(tid, index)
            const type = sample.is_sync ? "key" : "delta";
            // sample转换成EncodedVideoChunk,进而可以被VideoDecoder进行解码
            const chunk = new EncodedVideoChunk({
                type: type,
                timestamp: sample.cts,
                duration: sample.duration,
                data: sample.data
            });
            decoder.decode(chunk)
            // file.releaseUsedSamples(tid, i)
        }


        timer = setTimeout(() => {
            // 说明16ms过去 还是没有结果，可能就是decoder失败
            if (i === decoderIndex && i !== framesCount) {
                console.log(decoderIndex, 'fail');
                // 先释放帧资源
                for (const outputFrame of outputFrames) {
                    outputFrame.frame.close()
                }
                // 渲染上一次画面
                encodeFrame(i)
                decoderIndex++
                decoderSamples(decoderIndex)
            }
            // clearTimeout(timer)
        }, 16);

    }
    const encodeFrame = (count: number) => {
        // WebM 文件只能有最大 32768 秒的 Matroska 并且每个簇必须以视频关键帧开始。因此，你需要告诉你的视频编码器至少每 32 秒将一个视频帧编码为关键帧
        // 记1秒为一次关键帧
        const ibmp = muxOffscreenCanvas.transferToImageBitmap()
        const frame = new VideoFrame(ibmp, { timestamp: cts * count })
        videoEncoder.encode(frame, { keyFrame: count % (framerate * 10) === 0 })
        ibmp.close()
        frame.close()
    }
    decoderSamples(decoderIndex)
}

const getDecoderFile = async (video: VideoElement, output: (frame: VideoFrame, id: number) => any): Promise<{ decoder: VideoDecoder, file: MP4File, info: MP4Info } | undefined> => {
    const decoderFile = mp4box.createFile()
    const videoDecoder = new VideoDecoder({
        output: (v) => {
            output(v, video.id)
        },
        error: (e) => {
            console.log(e);
        }
    })
    const decoderFileOnReady = new Promise<{ decoder: VideoDecoder, file: MP4File, info: MP4Info } | undefined>((resolve) => {
        decoderFile.onReady = async (info) => {
            const videoTrack = info.videoTracks[0];
            const video_track = decoderFile.getTrackById(videoTrack.id);
            let description
            for (const entry of video_track.mdia.minf.stbl.stsd.entries) {
                // @ts-ignore
                const box = entry.avcC || entry.hvcC || entry.vpcC || entry.av1C;
                if (box) {
                    const stream = new DataStream(undefined, 0, DataStream.BIG_ENDIAN);
                    box.write(stream);
                    description = new Uint8Array(stream.buffer.slice(8)); // Remove the box header.
                }
            }
            videoDecoder.configure({
                codec: videoTrack.codec.startsWith("vp08") ? "vp8" : videoTrack.codec,
                codedWidth: info.videoTracks[0].track_width,
                codedHeight: info.videoTracks[0].track_height,
                description,
            })
            resolve({
                file: decoderFile,
                decoder: videoDecoder,
                info
            })
        }
    })
    const chunkSize = 1024 * 1024 * 10;
    let start = 0;
    const resolveVideo = async () => {
        const end = start + chunkSize;
        const chunk = video.source.file.slice(start, end);
        const buffer = await chunk.arrayBuffer()
        //@ts-ignore
        buffer.fileStart = start
        decoderFile.appendBuffer(buffer as MP4ArrayBuffer)
        start = end;
        if (start < video.source.file.size) {
            await resolveVideo()
        }
    };
    await resolveVideo()
    const res = await decoderFileOnReady
    if (!res) {
        return undefined
    }
    return res

}
