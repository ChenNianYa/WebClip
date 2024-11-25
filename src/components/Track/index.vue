<template>
    <!-- 时间轴  拖拽选择区域，即为最后的切割区域-->
    <!-- <div v-for="element in clipStore.elements.videos">
        {{ element.source.name }}
    </div>
    <div v-for="element in clipStore.elements.images">
        {{ element.source.name }}
    </div> -->
    <!-- <x-gantt data-id="index" :data="dataList" /> -->
    <div>
        <Timeline :data-list="list" :per-second-px="perSecondPx" :duration="clipStore.duration"
            @decrease-per-second-px="() => { if (perSecondPx > 10) { perSecondPx-- } }"
            @add-per-second-px="() => { perSecondPx++ }" />
    </div>
</template>
<script setup lang="ts">
import useClipStore from '@/store/useClipStore';
import { TrackItem } from '@/types/timeline-types';
const clipStore = useClipStore()
const perSecondPx = ref(10)
const list = computed<TrackItem[]>(() => {
    const list: TrackItem[] = []
    for (const video of clipStore.elements.videos) {
        list.push({
            id: video.id,
            duration: video.duration,
            startTime: 0,
            name: video.source.name
        })
    }
    for (const image of clipStore.elements.images) {
        list.push({
            id: image.id,
            duration: image.duration,
            startTime: 0,
            name: image.source.name
        })
    }
    return list
})
</script>
