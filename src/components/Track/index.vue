<template>
    <Timeline v-show="list.length > 0" :data-list="list" :per-second-px="perSecondPx" :duration="clipStore.duration"
        @decrease-per-second-px="() => { if (perSecondPx > 10) { perSecondPx-- } }"
        @add-per-second-px="() => { perSecondPx++ }" @update-track-row-start-time="clipStore.updateElemntStartTime"
        @update-duration="clipStore.updateElementDuration" class="absolute w-full h-full" />
</template>
<script setup lang="ts">
import useAudioStore from '@/store/useAudioStore';
import useClipStore from '@/store/useClipStore';
import { TrackItem } from '@/types/timeline-types';
const clipStore = useClipStore()
const audioStore = useAudioStore()
const perSecondPx = ref(10)
const list = computed<TrackItem[]>(() => {
    const list: TrackItem[] = []
    for (const video of clipStore.elements.videos) {
        list.push({
            id: video.id,
            duration: video.duration,
            startTime: video.startTime,
            name: video.source.name,
            stretchable: false,
            moveable: true,
        })
    }
    for (const image of clipStore.elements.images) {
        list.push({
            id: image.id,
            duration: image.duration,
            startTime: image.startTime,
            name: image.source.name,
            stretchable: true,
            moveable: true
        })
    }
    for (const audio of audioStore.audioElementList) {
        list.push({
            id: audio.id,
            duration: clipStore.duration,
            startTime: 0,
            name: audio.source.name,
            stretchable: false,
            moveable: false
        })
    }
    return list
})
</script>
