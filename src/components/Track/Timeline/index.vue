<template>
    <div style="width: calc(100vw - 700px);overflow: scroll" class="relative h-[260px]" ref="trackRef"
        @mouseenter="() => { showTrackCurrentTime = true }" @mouseleave="() => { showTrackCurrentTime = false }">
        <div class="relative">
            <!-- 头部 -->
            <TimeLineHeader :duration="props.duration" :per-second-px="props.perSecondPx" :track-ref="trackRef"
                @add-per-second-px="emits('add-per-second-px')"
                @decrease-per-second-px="emits('decrease-per-second-px')" class="sticky top-0 z-20 bg-primary-1" />

            <div class="mt-2 relative">
                <div class="relative">
                    <TrackRows :data-list="props.dataList" :per-second-px="props.perSecondPx" :duration="props.duration"
                        @update-track-row-start-time="(id, time) => { emits('update-track-row-start-time', id, time); }"
                        @update-duration="(id, duration) => { emits('update-duration', id, duration) }" />
                    <ClipCutAreas :per-second-px="props.perSecondPx" />
                    <!-- 鼠标悬浮的游标 -->
                    <div class="absolute top-0 h-full border-l border-white border-dashed pointer-events-none z-10"
                        v-show="showTrackCurrentTime" :style="{ left: trackCurrentTime.x + 'px' }">
                        <el-tag type="info" class="sticky">{{ trackCurrentTime.time }}</el-tag>
                    </div>
                </div>
            </div>
        </div>

    </div>
</template>
<script setup lang="ts">
import { TrackItem } from '@/types/timeline-types';
import { secondsToTimeFormat } from '@/utils/transform';
const emits = defineEmits<{
    (e: 'update-duration', id: number, duration: number): void,
    (e: 'add-per-second-px'): void,
    (e: 'decrease-per-second-px'): void
    (e: 'update-track-row-start-time', id: number, time: number): void
}>()
const trackRef = ref<HTMLDivElement>()
const props = withDefaults(defineProps<{
    dataList: TrackItem[],
    duration: number,
    perSecondPx: number
}>(), {
    dataList: () => [],
    perSecondPx: 5,
    duration: 0
})
onMounted(() => {
    if (!trackRef.value) return
    trackRef.value.addEventListener('mousemove', trackMouseMove)
})
// track events
const trackCurrentTime = ref({ x: 0, time: '' })
const showTrackCurrentTime = ref(false)
const trackMouseMove = (e: MouseEvent) => {
    e.preventDefault()
    if (!trackRefRect.value) return
    let x = e.clientX - trackRefRect.value.left + (trackRef.value?.scrollLeft ?? 0)
    const time = x / props.perSecondPx
    if (time <= props.duration) {
        trackCurrentTime.value.x = x
        trackCurrentTime.value.time = secondsToTimeFormat(time)
    }
}
const trackRefRect = computed(() => {
    return trackRef?.value?.getBoundingClientRect()
})
</script>