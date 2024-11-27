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
        <Timeline v-show="list.length > 0" :data-list="list" :per-second-px="perSecondPx" :duration="clipStore.duration"
            @decrease-per-second-px="() => { if (perSecondPx > 10) { perSecondPx-- } }"
            @add-per-second-px="() => { perSecondPx++ }" @update-track-row-start-time="clipStore.updateElemntStartTime"
            @update-duration="clipStore.updateElementDuration" />
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
            startTime: video.startTime,
            name: video.source.name,
            stretchable: false,
        })
    }
    for (const image of clipStore.elements.images) {
        list.push({
            id: image.id,
            duration: clipStore.duration,
            startTime: image.startTime,
            name: image.source.name,
            stretchable: true
        })
    }
    return list
})
</script>
