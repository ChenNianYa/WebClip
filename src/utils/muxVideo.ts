import ImageElement from "@/classes/element/ImageElement";
import VideoElement from "@/classes/element/VideoElement";
import { ElementsMap } from "@/types/element-option-types";
// @ts-ignore
import MP4Box from 'mp4box'
const DataStream = MP4Box.DataStream
const muxVideo = async (elemntsMap: ElementsMap, writableStream: FileSystemWritableFileStream) => {
    console.log('muxVideo');

    const { videos, images } = elemntsMap
    for (const video of videos) {
        await muxClip(video, images, writableStream)
    }
}
/**
 * 以 视频为单位剪辑
 */
const muxClip = async (video: VideoElement, images: ImageElement[], writableStream: FileSystemWritableFileStream) => {
    const showCanvas: HTMLCanvasElement = document.querySelector('#cvs') as HTMLCanvasElement
    const showctx = showCanvas.getContext('2d')
    const nbSampleMax = 10
    const oneSecondInMicrosecond = 100000
    const videoH = 1080
    const videoW = 1920
    const canvas = new OffscreenCanvas(videoW, videoH)
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    let nbSampleTotal: number = 0
    // indexdb  存生成的videoFrame---------------------------------------------------------------
    // let indexDb: IDBDatabase
    const storeName = 'frames'
    const videoFramesIndexDbDeleteRequest = new Promise((resolve) => {
        const request = window.indexedDB.deleteDatabase("video-frames");
        request.onsuccess = resolve
        request.onerror = resolve
    })
    await videoFramesIndexDbDeleteRequest
    const videoFramesIndexDbRequest = window.indexedDB.open("video-frames", 1);
    const indexDbPromise = new Promise<IDBDatabase>((resolve) => {
        videoFramesIndexDbRequest.onsuccess = () => {
            resolve(videoFramesIndexDbRequest.result)
        }
        videoFramesIndexDbRequest.onupgradeneeded = () => {
            const store = videoFramesIndexDbRequest.result.createObjectStore(storeName, {
                keyPath: 'index',
            })
            store.createIndex('index', 'index', { unique: true })
            resolve(videoFramesIndexDbRequest.result)
        }
    })
    const indexDb = await indexDbPromise

    const addVideoFrameToIndexDb = (index: number, value: Blob, timestamp: number) => {
        return new Promise((resolve) => {
            const request = indexDb.transaction([storeName], 'readwrite').objectStore(storeName).add({ index, value, timestamp })
            request.onsuccess = (e) => { resolve(e) }
        })
    }
    const getVideoFrameFromIndexDb = (index: number) => {
        return new Promise<VideoFrame>((resolve) => {
            const request = indexDb.transaction([storeName]).objectStore(storeName).get(index);
            request.onsuccess = async () => {
                if (request.result) {
                    const ibmp = await createImageBitmap(request.result.value)
                    const videoFrame = new VideoFrame(ibmp, { timestamp: request.result.timestamp })
                    ibmp.close()
                    resolve(videoFrame)
                }
            };
        })
    }
    console.log('indexbd ready');
    // ----------------------------------------------------------------------------------
    let videoDuration: number
    let videoFramerate: number
    let videoFrameDurationInMicrosecond: number
    // encoder 部分----------------------------------------------------------------------
    let encodedVideoFrameCount = 0
    let encodingVideoTrack: any
    const encoderFile = MP4Box.createFile()
    const videoEncoder = new VideoEncoder({
        output: async (encodedChunk, config) => {
            if (!encodingVideoTrack) {
                encodingVideoTrack = encoderFile.addTrack({
                    timescale: oneSecondInMicrosecond,
                    width: videoW,
                    height: videoH,
                    nb_samples: nbSampleTotal,
                    avcDecoderConfigRecord: config?.decoderConfig?.description
                });
            }
            const buffer = new ArrayBuffer(encodedChunk.byteLength);
            encodedChunk.copyTo(buffer);
            encoderFile.addSample(encodingVideoTrack, buffer, {
                duration: videoFrameDurationInMicrosecond,
                dts: encodedChunk.timestamp,
                cts: encodedChunk.timestamp,
                is_sync: encodedChunk.type == "key"
            })

            encodedVideoFrameCount++
            if (encodedVideoFrameCount === decodedVideoFrameCount) {
                const buffer = await encoderFile.getBuffer();
                let e = new Blob([buffer]);
                await writableStream.write(e)
                await writableStream.close()
                console.log('mux over');
            }
        },
        error: (err) => {
            console.log("VideoEncoder error : ", err);
        }
    })
    const encoderVideo = async () => {
        for (let i = 0; i < decodedVideoFrameCount; i++) {
            const vf = await getVideoFrameFromIndexDb(i)
            videoEncoder.encode(vf)
            vf.close()
        }
    }
    console.log('encoder ready');
    // decoder 部分 ------------------------------------------------------------------------------
    let countSample = 0;
    let decodedVideoFrameCount = 0;
    let decoderFile = MP4Box.createFile()
    const videoDecoder = new VideoDecoder({
        output: async (videoFrame) => {
            ctx.clearRect(0, 0, videoW, videoH)
            ctx.drawImage(videoFrame, 0, 0, videoW, videoH)
            for (const img of images) {
                ctx.drawImage(img.source.image, 0, 0, img.source.width / 5, img.source.height / 5)
            }
            const blob = await canvas.convertToBlob()
            // showctx?.drawImage(canvas, 0, 0, videoW, videoH)
            let timestamp = videoFrameDurationInMicrosecond * decodedVideoFrameCount;
            // 可以用webworker去做
            await addVideoFrameToIndexDb(decodedVideoFrameCount, blob, timestamp)
            // const encodeVideoFrame = new VideoFrame(showCanvas, { timestamp: timestamp })
            // const buffer = new ArrayBuffer(encodeVideoFrame.allocationSize())
            // encodeVideoFrame.copyTo(buffer)
            // await addVideoFrameToIndexDb(decodedVideoFrameCount, buffer)
            // encodeVideoFrame.close()
            decodedVideoFrameCount++
            // ibmp.close()
            videoFrame.close()
            if (videoDecoder.decodeQueueSize === 0 && videoDecoder.state === 'configured') {
                if (countSample === nbSampleTotal) {
                    console.log('decoder over');
                    // 这里应该decoderFile 置为空
                    decoderFile.stream.cleanBuffers()
                    videoDecoder.close()
                    encoderVideo()
                } else {
                    decoderFile.start()
                }
            }
        },
        error: (e) => {
            console.log("webcodec.VideoDecoder error : ", e);
        }
    })

    decoderFile.onReady = (info: any) => {
        decoderFile.stream.cleanBuffers()
        const videoTrack = info.videoTracks[0];
        nbSampleTotal = videoTrack.nb_samples;
        videoDuration = (info.duration / info.timescale) * 1000;
        //|-> with some videos, videoTrack.movie_duration doesn't match with the real duration

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
            const box = entry.avcC || entry.hvcC || entry.vpcC || entry.av1C;
            if (box) {
                const stream = new DataStream(undefined, 0, DataStream.BIG_ENDIAN);
                box.write(stream);
                description = new Uint8Array(stream.buffer, 8); // Remove the box header.
            }
        }
        videoEncoder.configure({
            // 编码格式
            codec: "avc1.4D0032",
            width: videoW,
            height: videoH,
            hardwareAcceleration: "prefer-hardware",
            //  帧率
            framerate: videoFramerate,
            // 比特率
            bitrate: 15000000,
            avc: { format: "avc" }
        })
        videoDecoder.configure({
            codec: videoTrack.codec.startsWith("vp08") ? "vp8" : videoTrack.codec,
            codedWidth: videoW,
            codedHeight: videoH,
            description
        })
        decoderFile.setExtractionOptions(videoTrack.id, null, { nbSamples: nbSampleMax });
        decoderFile.start()
    }
    decoderFile.onSamples = async (trackId: number, ref: any, samples: any[]) => {
        decoderFile.stop();
        decoderFile.releaseUsedSamples(trackId, countSample)
        //console.log("onSample ",countSample+" VS "+nbSampleTotal)
        countSample += samples.length;
        for (const sample of samples) {
            // is it a keyframe
            const type = sample.is_sync ? "key" : "delta";

            // sample转换成EncodedVideoChunk,进而可以被VideoDecoder进行解码
            const chunk = new EncodedVideoChunk({
                type: type,
                timestamp: sample.cts,
                duration: sample.duration,
                data: sample.data
            });
            // start decode
            videoDecoder.decode(chunk);
        }

    }
    console.log('dncoder ready');
    // mp4box解析视频 ----------------------------------------------------
    const chunkSize = 1024 * 1024 * 10;
    let start = 0;
    const resolveVideo = async () => {
        // const buffer = await video.source.file.arrayBuffer()
        // buffer.fileStart = start
        // decoderFile.appendBuffer(buffer)
        // decoderFile.flush()
        const end = start + chunkSize;
        const chunk = video.source.file.slice(start, end);
        const buffer = await chunk.arrayBuffer()
        //@ts-ignore
        buffer.fileStart = start
        decoderFile.appendBuffer(buffer)
        start = end;
        if (start < video.source.file.size) {
            await resolveVideo()
        } else {
            decoderFile.flush()  //-> will call file.onReady
        }
    };
    await resolveVideo()
    console.log('解析视频 ready');
};

export default muxVideo