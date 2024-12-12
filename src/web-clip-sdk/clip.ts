import VideoElement from "@/classes/element/VideoElement";
import LibAV from "libav.js";
import { packetToEncodedAudioChunk, packetToEncodedVideoChunk } from "libavjs-webcodecs-bridge";
import { FileSystemWritableFileStreamTarget, Muxer } from "mp4-muxer";
// @ts-ignore
// import audiodata2pcm from './audiodata2pcm.js'
export const clipAv = async (libav: LibAV.LibAV, video: VideoElement, muxer: Muxer<FileSystemWritableFileStreamTarget>, writableStream: FileSystemWritableFileStream) => {
    const { name, videoStreamIndex, videoDecoderConfig, audioStreamIndex, width, height } = video.source
    const clips = [...video.clips]
    if (clips.length === 0) {
        clips.push([0, video.source.duration])
    }
    // 由于剪切点并不一定是key帧，所以需要找最佳点去decoder
    const findBestClips = async () => {
        let i = 0;
        const bestClips = []
        const [fc, streams] = await libav.ff_init_demuxer_file(name)
        const apkt = await libav.av_packet_alloc();
        let countinueFind = true
        let bestTime = 0
        // 对于video找最佳帧
        do {
            const [res, packets] = await libav.ff_read_frame_multi(fc, apkt, { limit: 1024 * 1024 * 100 })
            if (res === LibAV.AVERROR_EOF) {
                countinueFind = false
            }
            for (const pkt of packets[video.source.videoStreamIndex]) {
                // 转化成单位为second
                const pktTime = (pkt.pts ?? 0) / (pkt.time_base_den ?? 100000)
                const encodedVideoChunk = packetToEncodedVideoChunk(pkt, streams[videoStreamIndex])
                if (encodedVideoChunk.type === 'key') {
                    if (pktTime < clips[i][0]) {
                        bestTime = pktTime
                    } else {
                        bestClips.push([bestTime, clips[i][1]])
                        i++;
                        if (i === clips.length) {
                            countinueFind = false
                            break;
                        }
                    }
                }
            }
        } while (countinueFind)
        await libav.av_packet_free(apkt)
        return bestClips
    }
    const bestClips = await findBestClips()
    console.log('bestClips', bestClips);


    // video encoder--------------------------------------------------------
    const videoEncoder = new VideoEncoder({
        output: (chunk, meta) => {
            muxer.addVideoChunk(chunk, meta)

        },
        error: e => console.error(e)
    })
    videoEncoder.configure({
        codec: 'avc1.4D0032',
        width: width,
        height: height,
        hardwareAcceleration: 'prefer-software'
    });
    // video decoder--------------------------------------------------------
    const videoDecoder = new VideoDecoder({
        output: async (v) => {
            const time = v.timestamp / 1000000
            if (clips.some(clip => time >= clip[0] && time <= clip[1])) {
                activeAVDecoder = true
                const frame = new VideoFrame(await createImageBitmap(v), { timestamp: decoderVideoFrameCount * decoderVideoFrameDuration })
                videoEncoder.encode(frame)
                decoderVideoFrameCount++
                frame.close()
            }
            v.close()

        },
        error: console.error
    })
    videoDecoder.configure(videoDecoderConfig)

    // // audio encoder --------------------------------------------------------
    let decoderAudioFrameCount = 0;
    let decoderAudioFrameDuration = 0;
    // const audioEncoder = new AudioEncoder({
    //     output: (chunk, meta) => {
    //         console.log(decoderAudioFrameCount * decoderAudioFrameDuration, 'timestamp');

    //         muxer.addAudioChunk(chunk, meta, decoderAudioFrameCount * decoderAudioFrameDuration)
    //         decoderAudioFrameCount++
    //     },
    //     error: console.error
    // })
    // audioEncoder.configure({
    //     codec: 'mp4a.40.2',
    //     sampleRate: audioDecoderConfig.sampleRate,
    //     numberOfChannels: audioDecoderConfig.numberOfChannels
    // })

    // // audio dncoder --------------------------------------------------------
    // const audioContext = new AudioContext()
    // const audioDecoder = new AudioDecoder({
    //     output: async (ad) => {
    //         audioEncoder.encode(ad)
    //         ad.close()
    //     },

    //     error: console.error
    // })
    // audioDecoder.configure(audioDecoderConfig)



    let decoderVideoFrameCount = 0;
    let decoderVideoFrameDuration = 0;

    let activeAVDecoder = false
    let decoderVideoEnd = false
    let decoderAudioEnd = false
    let clipEnd = false
    const dequeue = () => {
        if (videoEncoder.encodeQueueSize === 0) {
            if (decoderVideoEnd) {
                setTimeout(async () => {
                    if (!clipEnd) {
                        clipEnd = true
                        muxer.finalize();
                        await writableStream.close()
                        console.log('over');
                    }
                }, 1000);
            } else {
                console.log('encoder over demuxAV');
                demuxAV()
            }
        }
    }
    videoEncoder.addEventListener('dequeue', dequeue)
    // audioEncoder.addEventListener('dequeue', dequeue)
    // 开始clip
    const [fc, streams] = await libav.ff_init_demuxer_file(name)
    const apkt = await libav.av_packet_alloc();
    const demuxAV = async () => {
        console.log('parserVideo');
        activeAVDecoder = false
        const [res, packets] = await libav.ff_read_frame_multi(fc, apkt, { limit: 1024 * 1024 })
        for (const pkt of packets[video.source.videoStreamIndex]) {
            const pktTime = (pkt.pts ?? 0) / (pkt.time_base_den ?? 100000)
            if (bestClips.some((v) => pktTime >= v[0] && pktTime <= v[1])) {
                const encodedVideoChunk = packetToEncodedVideoChunk(pkt, streams[videoStreamIndex])
                if (!decoderVideoFrameDuration) {
                    decoderVideoFrameDuration = encodedVideoChunk.duration
                }
                videoDecoder.decode(encodedVideoChunk)
            } else if (pktTime >= bestClips[bestClips.length - 1][1]) {
                decoderVideoEnd = true
                break;
            }
        }
        for (const pkt of packets[video.source.audioStreamIndex]) {
            const pktTime = (pkt.pts ?? 0) / (pkt.time_base_den ?? 100000)
            if (clips.some(clip => pktTime >= clip[0] && pktTime <= clip[1])) {
                if (!decoderAudioFrameDuration) {
                    const encoderAudioChunk = packetToEncodedAudioChunk(pkt, streams[audioStreamIndex])
                    decoderAudioFrameDuration = encoderAudioChunk.duration
                }
                muxer.addAudioChunkRaw(new Uint8Array(pkt.data.buffer), 'key', decoderAudioFrameCount * decoderAudioFrameDuration, decoderAudioFrameDuration)
                // const encoderAudioChunk = packetToEncodedAudioChunk(pkt, streams[audioStreamIndex])
                decoderAudioFrameCount++
                // audioDecoder.decode(encoderAudioChunk)
            } else if (pktTime >= bestClips[bestClips.length - 1][1]) {
                decoderAudioEnd = true
                break;
            }
        }
        if (res === LibAV.AVERROR_EOF) {
            decoderAudioEnd = true
            decoderVideoEnd = true
        }
        requestAnimationFrame(() => {
            if (!activeAVDecoder) {
                console.log('no decoder demuxAV');
                demuxAV()
            }
        })
        // const [res, packets] = await libav.ff_read_frame_multi(fc, mpkt, { limit: 1024 * 1024 })
    }
    demuxAV()

}