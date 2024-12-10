<template>
    <FileSelect :accept="{ 'video/mp4': ['.mp4'] }" text="选择需要上传的视频" @select-file="getVideoSource" class="mb-2" />
    <VideoList :list="videoList" @delete="onDelete" @add-track="onAddTrack" />
</template>
<script setup lang="ts">
import VideoElement from '@/classes/element/VideoElement';
import VideoSource from '@/classes/source/VideoSource';
import useVideoStore from '@/store/useVideoStore';
const videoStore = useVideoStore()
const videoList = ref<VideoSource[]>([])
const getVideoSource = async (videoBlob: File) => {
    const video = document.createElement('video');
    video.setAttribute('preload', 'auto')
    const loadVideoPromise = new Promise((resolve) => {
        video.onloadeddata = (e) => {
            resolve(e);
        };
    });
    const src = URL.createObjectURL(videoBlob)
    video.src = src;
    await loadVideoPromise;
    const canvas = document.createElement('canvas');
    canvas.height = video.videoHeight;
    canvas.width = video.videoWidth;
    const ctx = canvas.getContext('2d');
    if (!ctx) return
    ctx.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
    const canvasToUrl = new Promise<string>((resolve) => {
        canvas.toBlob((blob) => {
            if (blob) {
                resolve(URL.createObjectURL(blob))
            }
        })
    })
    const cover = await canvasToUrl
    const videoSource = new VideoSource({
        name: videoBlob.name,
        file: videoBlob,
        size: videoBlob.size,
        duration: video.duration,
        src: src,
        width: video.videoWidth,
        height: video.videoHeight,
        cover,
        video: video,
    })
    videoList.value.push(videoSource)
    canvas.remove()
}
const onDelete = (id: number) => {
    videoList.value = videoList.value.filter(v => v.id !== id)
}

const onAddTrack = (id: number) => {
    // 将source转化成element 加入到clip中
    const videoSource = videoList.value.find(v => v.id === id)
    if (!videoSource) return
    const videoElement = new VideoElement({
        width: videoSource.width,
        height: videoSource.height,
        source: videoSource
    })
    videoStore.addVideoElement(videoElement)
}
</script>
