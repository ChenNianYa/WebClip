import VideoElement from '@/classes/element/VideoElement';
import useClipStore from '@/store/useClipStore';
import mp4box, { MP4ABoxParser, MP4ArrayBuffer, MP4File, MP4Info, MP4Sample, MP4VideoTrack, SampleOpts, TrakBoxParser, VideoTrackOpts } from '@webav/mp4box.js';
import { elementInPreview } from './preview-utils';
const framerate = 25
// 可能要改，因为1000000/24 除不尽
const oneSecondInMicrosecond = 1000000
const cts = oneSecondInMicrosecond / framerate
const defaultEncodeConfig: VideoEncoderConfig = {
    // 编码格式
    codec: "avc1.4D0032",
    hardwareAcceleration: "prefer-hardware",
    avc: { format: "avc" },
    framerate: framerate,
    height: 1080,
    width: 1920
}
const DataStream = mp4box.DataStream
export const muxVideo = async () => {
    const clipStore = useClipStore()
    const writableStream = await getWritableFileStream()
    if (writableStream === undefined) return
    const muxOffscreenCanvas = new OffscreenCanvas(clipStore.width, clipStore.height)
    const ctx = muxOffscreenCanvas.getContext('2d')
    if (!ctx) return
    const duration = Math.ceil(clipStore.duration)
    // 最后需要的帧数为
    const framesCount = framerate * duration
    // encoder  mp4box
    const encoderFile = mp4box.createFile()
    // 最后合成的视频轨道
    let encodingVideoTrack = 0
    let encoderCount = 0;
    const videoEncoder = new VideoEncoder({
        output: async (encodedChunk, config) => {
            if (!encodingVideoTrack) {
                encodingVideoTrack = encoderFile.addTrack({
                    timescale: oneSecondInMicrosecond,
                    width: clipStore.width,
                    height: clipStore.height,
                    duration: duration,
                    avcDecoderConfigRecord: config?.decoderConfig?.description,
                    brands: [],
                })
            }
            const buffer = new ArrayBuffer(encodedChunk.byteLength);
            encodedChunk.copyTo(buffer);
            encoderFile.addSample(encodingVideoTrack, buffer, {
                duration: encodedChunk.duration ?? 0,
                dts: encodedChunk.timestamp,
                cts: encodedChunk.timestamp,
                is_sync: encodedChunk.type == "key"
            })
            encoderFile.releaseUsedSamples(encodingVideoTrack, encoderCount)
            encoderCount++
            if (encoderCount === framesCount) {
                for (let i = 0; i < encoderFile.boxes.length; i++) {
                    if (encoderFile.boxes[i] === null) continue;
                    const ds = new mp4box.DataStream()
                    ds.endianness = mp4box.DataStream.BIG_ENDIAN;
                    encoderFile.boxes[i].write(ds);
                    await writableStream.write(ds.buffer)
                    delete encoderFile.boxes[i];
                }
                await writableStream.close()
            }
        },
        error: () => { }
    })
    videoEncoder.configure({ ...defaultEncodeConfig, width: clipStore.width, height: clipStore.height })
    // key 是id
    const decoderFiles: { [key in number]: { decoder: VideoDecoder, file: MP4File, decoderNum: number, info: MP4Info } } = {}
    let decoderSampleOver = false
    let decoderIndex = 0
    let outputFrames: { id: number, frame: VideoFrame }[] = []
    const output = async (videoFrame: VideoFrame, id: number) => {
        // console.log(id, videoFrame);
        outputFrames.push({ id, frame: videoFrame })
        // 在这里判断所有的decoderFiles 是否全部为0
        for (const key in decoderFiles) {
            if (decoderFiles[key].decoder.decodeQueueSize !== 0)
                return
        }
        if (decoderSampleOver) return
        console.log('success');

        decoderSampleOver = true
        // 编译chunck
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
        const bob = await muxOffscreenCanvas.convertToBlob()
        console.log(URL.createObjectURL(bob));

        const ibmp = muxOffscreenCanvas.transferToImageBitmap()
        const frame = new VideoFrame(ibmp, { timestamp: cts * decoderIndex, duration: cts })
        ibmp.close()
        videoEncoder.encode(frame)
        frame.close()
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
        // console.log(i);
        decoderSampleOver = false
        outputFrames = []
        const frameSamples = samplesResult[i]
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
        }
        const polling = () => {
            const rafId = requestAnimationFrame(() => {
                if (i === decoderIndex && !decoderSampleOver && outputFrames.length == 0) {
                    let size = 0
                    for (const key in decoderFiles) {
                        size += decoderFiles[key].decoder.decodeQueueSize
                    }
                    if (size === 0) {
                        console.log('fail');

                        cancelAnimationFrame(rafId)
                        decoderSampleOver = true
                        // 渲染空帧
                        const ibmp = muxOffscreenCanvas.transferToImageBitmap()
                        const frame = new VideoFrame(ibmp, { timestamp: cts * decoderIndex, duration: cts })
                        ibmp.close()
                        videoEncoder.encode(frame)
                        frame.close()
                        decoderIndex++
                        decoderSamples(decoderIndex)
                    } else {
                        requestAnimationFrame(polling)
                    }
                }
            })
        }
        polling()
    }
    decoderSamples(decoderIndex)
}

// 获取可写入文件流 最后用来流式 的存入本地文件中
const getWritableFileStream = async () => {
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
    const fileName = 'test22.mp4'
    const fileHandle = await handle.getFileHandle(fileName, { create: true });
    const writableStream = await fileHandle.createWritable();
    return writableStream
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
        decoderFile.onReady = (info) => {
            // console.log(decoderFile);
            const videoTrack = info.videoTracks[0];
            const _track = decoderFile.getTrackById(videoTrack.id);
            console.log(_track);

            let description
            for (const entry of _track.mdia.minf.stbl.stsd.entries) {
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
                description
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
