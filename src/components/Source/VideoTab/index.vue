<template>
    <FileSelect :accept="{ 'video/*': [] }" text="选择需要上传的视频" @select-file="getVideoSource" class="mb-2" />
    <VideoList :list="videoStore.videoSourceList" @delete="onDelete" @add-track="onAddTrack" />
</template>
<script setup lang="ts">
import VideoElement from '@/classes/element/VideoElement';
import VideoSource from '@/classes/source/VideoSource';
import useVideoStore from '@/store/useVideoStore';
import { libav } from '@/web-clip-sdk';
import { audioStreamToConfig, packetToEncodedVideoChunk, videoStreamToConfig } from 'libavjs-webcodecs-bridge';
const videoStore = useVideoStore()
const drawCoverCanvas = new OffscreenCanvas(1920, 1080)
const drawCoverCanvasCtx = drawCoverCanvas.getContext('2d')
const getVideoSource = async (videoBlob: File) => {
    if (!drawCoverCanvasCtx) return
    await libav.mkreadaheadfile(videoBlob.name, videoBlob)
    const [fc, streams] = await libav.ff_init_demuxer_file(videoBlob.name)
    const videoStreamIndex = streams.findIndex(v => v.codec_type === libav.AVMEDIA_TYPE_VIDEO)
    const audioStreamIndex = streams.findIndex(v => v.codec_type === libav.AVMEDIA_TYPE_AUDIO)
    const videoDecoderConfig = await videoStreamToConfig(libav, streams[videoStreamIndex])
    const audioDecoderConfig = await audioStreamToConfig(libav, streams[audioStreamIndex])
    console.log(audioDecoderConfig, streams);

    // streams[audioStreamIndex].
    let findFirstFrame = true
    const videoDecoder = new VideoDecoder({
        output: async (v) => {
            if (findFirstFrame === true) {
                findFirstFrame = false
                drawCoverCanvas.height = v.displayHeight
                drawCoverCanvas.width = v.displayWidth
                drawCoverCanvasCtx?.drawImage(v, 0, 0)
                const blob = await drawCoverCanvas.convertToBlob()
                videoDecoder.close()
                libav.av_packet_free(pkt)
                const videoSource = new VideoSource({
                    name: videoBlob.name,
                    file: videoBlob,
                    size: videoBlob.size,
                    duration: streams[libav.AVMEDIA_TYPE_VIDEO].duration,
                    src: URL.createObjectURL(videoBlob),
                    cover: URL.createObjectURL(blob),
                    videoStreamIndex: videoStreamIndex,
                    audioStreamIndex: audioStreamIndex,
                    width: v.displayWidth,
                    height: v.displayHeight,
                    videoDecoderConfig: videoDecoderConfig,
                    audioDecoderConfig: audioDecoderConfig,
                })
                videoStore.addVideoSource(videoSource)
            }
            v.close()
        },
        error: (e) => {
            console.log(e);
        }
    })
    videoDecoder.configure(videoDecoderConfig)
    const pkt = await libav.av_packet_alloc();
    while (findFirstFrame) {
        const [res, packets] = await libav.ff_read_frame_multi(fc, pkt, { limit: 1 })
        if (res !== -libav.EAGAIN && res !== 0 && res !== libav.AVERROR_EOF) {
            libav.av_packet_free(pkt)
            break;
        }
        if (packets[videoStreamIndex]) {
            const chunk = packetToEncodedVideoChunk(packets[videoStreamIndex][0], streams[videoStreamIndex]);
            videoDecoder.decode(chunk)
        }
        if (res === libav.AVERROR_EOF) {
            libav.av_packet_free(pkt)
            break;
        }
    }
}
const onDelete = (id: number) => {
    videoStore.deleteVideoSource(id)
}
const onAddTrack = (id: number) => {
    // 将source转化成element 加入到clip中
    const videoSource = videoStore.videoSourceList.find(v => v.id === id)
    if (!videoSource) return
    const videoElement = new VideoElement({
        width: videoSource.width,
        height: videoSource.height,
        source: videoSource
    })
    videoStore.addVideoElement(videoElement)
}
</script>
