import VideoElement from '@/classes/element/VideoElement';
import useClipStore from '@/store/useClipStore';
import mp4box, { MP4ArrayBuffer, MP4File, MP4VideoTrack, SampleOpts, VideoTrackOpts } from '@webav/mp4box.js';
const DataStream = mp4box.DataStream
export const muxVideo = async () => {
    const clipStore = useClipStore()
    const writableStream = await getWritableFileStream()
    if (writableStream === undefined) return
    const muxOffscreenCanvas = new OffscreenCanvas(clipStore.width, clipStore.height)
    const ctx = muxOffscreenCanvas.getContext('2d')

    if (!ctx) return
    // 最后合成的视频轨道
    const decodeMaxSampleOnce = 100
    let encodingVideoTrack = 0
    let decoderOver = false
    let encoderCount = 0
    const oneSecondInMicrosecond = 100000
    let videoFrameDurationInMicrosecond: number
    let videoFramerate: number
    // 合成视频mp4box
    const encoderFile = mp4box.createFile()
    const videoEncoder = new VideoEncoder({
        output: async (encodedChunk, config) => {
            encoderCount++;
            if (!encodingVideoTrack) {
                // @ts-ignore
                encodingVideoTrack = encoderFile.addTrack({
                    timescale: oneSecondInMicrosecond,
                    width: clipStore.width,
                    height: clipStore.height,
                    avcDecoderConfigRecord: config?.decoderConfig?.description
                });
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
            if (videoEncoder.encodeQueueSize === 0) {
                if (!decoderOver) {
                    console.log('continue');
                    decoderFile.start()
                } else {
                    if (encoderCount === decoderVideoSampleCount) {
                        console.log('over');
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

                }
            }
        },
        error: () => { }
    })
    // 解析视频文件

    let samplesCount = 0
    let decoderFileSampleCount = 0;
    let decoderVideoSampleCount = 0;
    const videoDecoder = new VideoDecoder({
        output: async (videoFrame) => {
            const video = clipStore.elements.videos[0]

            ctx.clearRect(0, 0, clipStore.width, clipStore.height)
            ctx.drawImage(videoFrame, video.x, video.y, video.width, video.height)
            // 可以拿 start和duration来判断是否要加入图片
            for (const img of clipStore.elements.images) {
                ctx.drawImage(img.source.image, img.x, img.y, img.width, img.height)
            }
            // console.log();
            // const blob = await muxOffscreenCanvas.convertToBlob()
            // const url = URL.createObjectURL(blob)
            // console.log(url);
            const ibmp = muxOffscreenCanvas.transferToImageBitmap()
            const frame = new VideoFrame(ibmp, { timestamp: videoFrameDurationInMicrosecond * decoderVideoSampleCount, duration: videoFrameDurationInMicrosecond })
            ibmp.close()
            videoEncoder.encode(frame)
            frame.close()
            decoderVideoSampleCount++;
            videoFrame.close()
            console.log(decoderFile);

            if (decoderFileSampleCount === samplesCount && videoDecoder.decodeQueueSize === 0) {
                decoderOver = true
                // @ts-ignore
                decoderFile.stream.cleanBuffers()

            }
        },
        error: () => {

        }
    })
    const decoderFile: MP4File = mp4box.createFile()
    decoderFile.onReady = info => {
        const videoTrack = info.videoTracks[0];
        samplesCount = videoTrack.nb_samples
        const videoDuration = (info.duration / info.timescale) * 1000;
        // 视频帧率
        videoFramerate = Math.ceil(
            1000 / (videoDuration / videoTrack.nb_samples)
        );
        // 一帧的duration 用微妙为单位
        videoFrameDurationInMicrosecond =
            oneSecondInMicrosecond / videoFramerate;
        const _track = decoderFile.getTrackById(videoTrack.id);
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
        // const { descKey, type } = videoTrack.codec.startsWith('avc1')
        //     ? { descKey: 'avcDecoderConfigRecord', type: 'avc1' }
        //     : videoTrack.codec.startsWith('hvc1')
        //         ? { descKey: 'hevcDecoderConfigRecord', type: 'hvc1' }
        //         : { descKey: '', type: '' };
        //@ts-ignore
        // encodingVideoTrack = encoderFile.addTrack({
        //     timescale: videoTrack.timescale,
        //     width: clipStore.width,
        //     height: clipStore.height,
        //     [descKey]: description?.buffer,
        // })
        videoEncoder.configure({
            // 编码格式
            codec: "avc1.4D0032",
            width: clipStore.width,
            height: clipStore.height,
            hardwareAcceleration: "prefer-hardware",
            avc: { format: "avc" }
        })
        console.log({
            // 编码格式
            codec: "avc1.4D0032",
            width: clipStore.width,
            height: clipStore.height,
            hardwareAcceleration: "prefer-hardware",
            avc: { format: "avc" }
        });

        videoDecoder.configure({
            codec: videoTrack.codec.startsWith("vp08") ? "vp8" : videoTrack.codec,
            codedWidth: info.videoTracks[0].track_width,
            codedHeight: info.videoTracks[0].track_height,
            description
        })
        decoderFile.setExtractionOptions(info.videoTracks[0]?.id, null, { nbSamples: decodeMaxSampleOnce })
        decoderFile.start()
    }
    decoderFile.onSamples = (id, type, samples) => {
        decoderFile.stop()
        decoderFile.releaseUsedSamples(id, decoderFileSampleCount)
        decoderFileSampleCount += samples.length
        for (const sample of samples) {
            const type = sample.is_sync ? "key" : "delta";
            // sample转换成EncodedVideoChunk,进而可以被VideoDecoder进行解码
            const chunk = new EncodedVideoChunk({
                type: type,
                timestamp: sample.cts,
                duration: sample.duration,
                data: sample.data
            });
            videoDecoder.decode(chunk)
        }
    }
    // 解析视频
    const chunkSize = 1024 * 1024 * 10;
    let start = 0;
    const resolveVideo = async () => {
        const end = start + chunkSize;
        const chunk = clipStore.elements.videos[0].source.file.slice(start, end);
        const buffer = await chunk.arrayBuffer()
        //@ts-ignore
        buffer.fileStart = start
        decoderFile.appendBuffer(buffer as MP4ArrayBuffer)
        start = end;
        if (start < clipStore.elements.videos[0].source.file.size) {
            await resolveVideo()
        }
    };
    await resolveVideo()
}
// 获取可写入文件流
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

const decoderVideo = async (video: VideoElement, encoderFile: MP4File, encodingVideoTrack: number) => {
    // videoEncoder.addEventListener('dequeue', () => {
    //     if (videoEncoder.encodeQueueSize === 0 && videoDecoder.decodeQueueSize === 0) {
    //         decoderFile.start()
    //     }
    // })


    //
    // const videoEncoder = new VideoEncoder({
    //     output: (chunk, config) => {
    //         if (!encodingVideoTrack) {
    //             encodingVideoTrack = encoderFile.addTrack({
    //                 timescale: oneSecondInMicrosecond,
    //                 width: videoW,
    //                 height: videoH,
    //                 nb_samples: nbSampleTotal,
    //                 avcDecoderConfigRecord: config?.decoderConfig?.description
    //             })
    //         }
    //     },
    //     error: () => {

    //     }
    // })

}
