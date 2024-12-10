<template>
    <FileSelect :accept="{ ' audio/*': ['.mp3'] }" text="选择需要上传的音乐" @select-file="getAudioSource" class="mb-2" />
    <AudioList :list="audioStore.audioSourceList" @delete="onDelete" @add-track="onAddTrack" />
</template>
<script setup lang="ts">
import AudioElement from '@/classes/element/AudioElement';
import AudioSource from '@/classes/source/AudioSource';
import useAudioStore from '@/store/useAudioStore';
const audioStore = useAudioStore()
const getAudioSource = async (audioFile: File) => {
    console.log(audioFile);
    const audioContext = new AudioContext()
    // 目前没看到什么比较好的处理音频的方案
    const buffer = await audioFile.arrayBuffer()
    const info = await audioContext.decodeAudioData(buffer)
    const audioSource = new AudioSource({
        duration: info.duration,
        src: URL.createObjectURL(audioFile),
        name: audioFile.name,
        file: audioFile,
        size: audioFile.size
    })
    audioStore.addAuidoSource(audioSource)
}

const onDelete = (id: number) => {
    audioStore.deleteAuidoSource(id)
}
const onAddTrack = (id: number) => {
    // 将source转化成element 加入到clip中
    const audioSource = audioStore.audioSourceList.find(v => v.id === id)
    if (!audioSource) return
    const videoElement = new AudioElement(audioSource)
    audioStore.addAudioElement(videoElement)
}
</script>