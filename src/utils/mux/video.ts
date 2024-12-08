import VideoElement from '@/classes/element/VideoElement';
import useClipStore from '@/store/useClipStore';
import mp4box, { MP4ArrayBuffer, MP4File, MP4Info } from '@webav/mp4box.js';
import { Muxer, FileSystemWritableFileStreamTarget } from 'mp4-muxer';
import { elementInPreview } from '../preview-utils';
import MuxVideoConfig from './config';
type DecoderFileInfo = { decoder: VideoDecoder, file: MP4File, info: MP4Info, frameRate: number, resetDecoder: () => VideoDecoder | undefined }
const DataStream = mp4box.DataStream
export const muxVideo = async (muxer: Muxer<FileSystemWritableFileStreamTarget>, writableStream: FileSystemWritableFileStream) => {
    const clipStore = useClipStore()
    const muxOffscreenCanvas = new OffscreenCanvas(clipStore.width, clipStore.height)
    const ctx = muxOffscreenCanvas.getContext('2d')
    if (!ctx) return
    const cts = MuxVideoConfig.oneSecondInMicrosecond / clipStore.frameRate
    const framesCount = clipStore.frameRate * Math.ceil(clipStore.duration)
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
    const decoderFiles: { [key in number]: { decoder: VideoDecoder, file: MP4File, decoderNum: number, info: MP4Info, frameRate: number, resetDecoder: () => VideoDecoder | undefined } } = {}
    let decoderIndex = 0
    let decoderSampleCount = 0;
    let timer: NodeJS.Timeout
    let outputFrames: { id: number, frame: VideoFrame }[] = []
    let needAddMux = true
    const output = async (videoFrame: VideoFrame, id: number) => {
        if (!needAddMux) {
            // console.log(videoFrame);
            videoFrame.close()
        } else {
            // console.log(id, videoFrame);
            outputFrames.push({ id, frame: videoFrame })
            if (decoderSampleCount !== outputFrames.length) return
            console.log(decoderIndex, 'success');
            // ctx.clearRect(0, 0, clipStore.width, clipStore.height)
            // 画帧
            for (const outputFrame of outputFrames) {
                const video = clipStore.elements.videos.find(v => v.id === outputFrame.id)
                if (!video) return
                ctx.drawImage(outputFrame.frame, video.x, video.y, video.width, video.height)
                outputFrame.frame.close()
            }
            // 画图片
            for (const img of clipStore.elements.images) {
                const frameTime = decoderIndex / clipStore.frameRate
                if (elementInPreview(img, frameTime)) {
                    ctx.drawImage(img.source.image, img.x, img.y, img.width, img.height)
                }
            }
            encodeFrame(decoderIndex)
            decoderIndex++
            decoderSamples(decoderIndex)
        }

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
        const frameTime = i / clipStore.frameRate
        const samples: { vid: number, index: number }[] = []
        for (const video of clipStore.elements.videos) {
            const id = video.id
            if (elementInPreview(video, frameTime)) {
                if (decoderFiles[id].info.videoTracks[0].nb_samples > decoderFiles[id].decoderNum) {
                    // console.log(decoderFiles[id].frameRate, clipStore.frameRate);

                    // @ts-ignore
                    // const sample = decoderFiles[id].file.getTrackSample(decoderFiles[id].info.videoTracks[0].id, decoderFiles[id].decoderNum)

                    if (decoderFiles[id].frameRate > clipStore.frameRate) {
                        // 算一下当前是第几秒
                        const seconed = Math.floor(decoderFiles[id].decoderNum / decoderFiles[id].frameRate)
                        // 算一下当前是该秒下第几帧
                        const frameNum = decoderFiles[id].decoderNum % decoderFiles[id].frameRate
                        // console.log(seconed, frameNum, decoderFiles[id].decoderNum, decoderFiles[id].frameRate)
                        // 多的直接去掉   不是很合理，但是方便
                        if (frameNum >= clipStore.frameRate) {
                            samples.push({ vid: id, index: decoderFiles[id].decoderNum })
                            decoderFiles[id].decoderNum = (seconed + 1) * decoderFiles[id].frameRate
                        } else {
                            samples.push({ vid: id, index: decoderFiles[id].decoderNum })
                            decoderFiles[id].decoderNum++;
                        }

                    } else if (decoderFiles[id].frameRate < clipStore.frameRate) {
                        // 默认最后一帧重复
                        const needRepeatFrameNum = clipStore.frameRate - decoderFiles[id].frameRate
                        const frameNum = decoderFiles[id].decoderNum % decoderFiles[id].frameRate
                        if (frameNum === (decoderFiles[id].frameRate - 1)) {
                            let count = 0;
                            for (let j = i - 1; j >= 0; j--) {
                                if (samplesResult[j].find(v => (v.vid === id && v.index === decoderFiles[id].decoderNum))) {
                                    count++
                                } else {
                                    break;
                                }
                            }
                            if (count === needRepeatFrameNum) {
                                samples.push({ vid: id, index: decoderFiles[id].decoderNum })
                                decoderFiles[id].decoderNum++;
                            } else {
                                samples.push({ vid: id, index: decoderFiles[id].decoderNum })
                            }
                        } else {
                            samples.push({ vid: id, index: decoderFiles[id].decoderNum })
                            decoderFiles[id].decoderNum++;
                        }
                        // const frameNum = decoderFiles[id].decoderNum % decoderFiles[id].frameRate
                        // const interver = Math.floor(decoderFiles[id].frameRate / clipStore.frameRate)
                        // 从samplesResult 根据i值往前找，看重复几帧
                    } else {
                        samples.push({ vid: id, index: decoderFiles[id].decoderNum })
                        decoderFiles[id].decoderNum++;
                    }

                }

            }
        }
        samplesResult.push(samples)
    }
    console.log(samplesResult);

    // 编码samples
    const decoderSamples = async (i: number) => {
        if (i >= framesCount) return
        clearTimeout(timer)
        needAddMux = true
        outputFrames = []
        const frameSamples = samplesResult[i]
        const preFrameSamples = samplesResult[i - 1]
        decoderSampleCount = frameSamples.length
        for (let i = 0; i < frameSamples.length; i++) {
            const frameSample = frameSamples[i]


            const { vid, index } = frameSample
            const { file, decoder, info, resetDecoder } = decoderFiles[vid]
            const tid = info.videoTracks[0].id
            // 补帧数据，不然解析不了
            if (preFrameSamples) {
                const preFrameSample = preFrameSamples[i]
                if (preFrameSample.vid === frameSample.vid && (preFrameSample.index + 1) !== frameSample.index) {
                    console.log(frameSample, preFrameSample);
                    for (let j = preFrameSample.index + 1; j < frameSample.index; j++) {
                        //@ts-ignore
                        const sample = file.getTrackSample(tid, j)
                        const type = sample.is_sync ? "key" : "delta";
                        needAddMux = false
                        // sample转换成EncodedVideoChunk,进而可以被VideoDecoder进行解码
                        const chunk = new EncodedVideoChunk({
                            type: type,
                            timestamp: sample.cts,
                            duration: sample.duration,
                            data: sample.data
                        });
                        // console.log(chunk);

                        decoder.decode(chunk)
                    }
                }

            }
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
            // try {

            // } catch (e) {
            //     const de = resetDecoder()
            //     if (de) {
            //         decoderFiles[vid].decoder = de
            //         const chunk = new EncodedVideoChunk({
            //             type: 'key',
            //             timestamp: sample.cts,
            //             duration: sample.duration,
            //             data: sample.data
            //         });
            //         de.decode(chunk)
            //     }

            //     // console.log(e);

            // }

            // file.releaseUsedSamples(tid, i)
        }


        timer = setTimeout(async () => {
            // 说明16ms过去 还是没有结果，可能就是decoder失败
            if (i === decoderIndex && i !== framesCount) {
                console.log(decoderIndex, 'fail');
                // const blob = await muxOffscreenCanvas.convertToBlob()
                // console.log(URL.createObjectURL(blob));
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
    const encodeFrame = async (count: number) => {
        // WebM 文件只能有最大 32768 秒的 Matroska 并且每个簇必须以视频关键帧开始。因此，你需要告诉你的视频编码器至少每 32 秒将一个视频帧编码为关键帧
        // 记1秒为一次关键帧
        // const blob = await muxOffscreenCanvas.convertToBlob()
        // console.log(URL.createObjectURL(blob));
        // ctx.save()
        // ctx.save()
        const ibmp = await createImageBitmap(muxOffscreenCanvas)
        if (ibmp) {
            const frame = new VideoFrame(ibmp, { timestamp: cts * count })
            videoEncoder.encode(frame, { keyFrame: count % (clipStore.frameRate * 10) === 0 })
            ibmp.close()
            frame.close()
        }
    }
    decoderSamples(decoderIndex)
}

const getDecoderFile = async (video: VideoElement, output: (frame: VideoFrame, id: number) => any): Promise<DecoderFileInfo | undefined> => {
    let config: VideoDecoderConfig
    let decoderFileInfo: DecoderFileInfo | undefined = undefined
    const decoderFile = mp4box.createFile()
    const init: VideoDecoderInit = {
        output: (v) => {
            output(v, video.id)
        },
        error: (e) => {
            console.log(e);
        }
    }
    const resetDecoder = () => {
        if (config) {
            const decoder = new VideoDecoder(init)
            decoder.configure(config)
            return decoder
        }
        return undefined

    }
    let videoDecoder = new VideoDecoder(init)
    const decoderFileOnReady = new Promise<DecoderFileInfo | undefined>((resolve) => {
        decoderFile.onReady = async (info) => {
            const videoTrack = info.videoTracks[0];
            const video_track = decoderFile.getTrackById(videoTrack.id);
            console.log(info, video_track);
            // 获取帧率
            const frameRate = Math.ceil(1000 / ((info.duration / info.timescale) * 1000 / videoTrack.nb_samples))
            // const cts = oneSecondInMicrosecond / frameRate

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
            config = {
                codec: videoTrack.codec.startsWith("vp08") ? "vp8" : videoTrack.codec,
                codedWidth: info.videoTracks[0].track_width,
                codedHeight: info.videoTracks[0].track_height,
                description,
            }
            videoDecoder.configure(config)
            decoderFileInfo = {
                file: decoderFile,
                decoder: videoDecoder,
                info,
                frameRate,
                resetDecoder: resetDecoder
            }
            resolve(decoderFileInfo)
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
