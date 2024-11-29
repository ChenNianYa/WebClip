<template>
    <div v-for="item in props.dataList"
        :style="{ width: item.duration * props.perSecondPx + 'px', transform: `translateX(${item.startTime * perSecondPx}px)` }"
        @mousedown="(e) => { trackMouseDown(e, item) }" @click="() => { activeElementId = item.id; }"
        class="bg-black mt-2 h-10" :class="{
            'border border-orange-600 cursor-move': activeElementId === item.id
        }" :key="item.id">

        <div class="text-xs w-full h-full flex items-center justify-center">
            <div class="h-full w-2 bg-white hover:!cursor-col-resize" v-show="item.stretchable"
                @mousedown="(e) => { leftMouseDown(e, item) }" @click="() => { activeElementId = item.id; }"></div>
            <el-text truncated size='small' class="flex-1">{{ item.name }}</el-text>
            <div class="h-full w-2 bg-white hover:!cursor-col-resize" v-show="item.stretchable"
                @mousedown="(e) => { rightMouseDown(e, item) }" @click="() => { activeElementId = item.id; }"></div>
        </div>
    </div>
</template>
<script setup lang="ts">
import useClipStore from '@/store/useClipStore';
import { TrackItem } from '@/types/timeline-types';
import { storeToRefs } from 'pinia';
const clipStore = useClipStore()
const { activeElementId } = storeToRefs(clipStore)
const props = withDefaults(defineProps<{
    dataList: TrackItem[],
    perSecondPx: number,
    duration: number
}>(), {
    dataList: () => []
})
const emits = defineEmits<{
    (e: 'update-track-row-start-time', id: number, time: number): void
    (e: 'update-duration', id: number, duration: number): void
}>()
// 拖动轨道
let isMouseDown = false
const trackMouseDown = (e: MouseEvent, item: TrackItem) => {
    e.preventDefault()
    activeElementId.value = item.id
    isMouseDown = true
    window.addEventListener('mousemove', trackMouseMove)
    window.addEventListener('mouseup', trackMouseUp)
}
const trackMouseMove = (e: MouseEvent) => {
    console.log('move');

    e.preventDefault()
    if (!activeElementId.value) return
    const selectRow = props.dataList.find(v => v.id === activeElementId.value)
    if (isMouseDown && selectRow) {
        const temp = e.movementX / props.perSecondPx
        let time = selectRow.startTime + temp
        if (time < 0) { time = 0 }
        emits('update-track-row-start-time', activeElementId.value, time)
    }
}

const trackMouseUp = (e: MouseEvent) => {
    e.preventDefault()
    isMouseDown = false
    window.removeEventListener('mousemove', trackMouseMove)
    window.removeEventListener('mouseup', trackMouseUp)
}

// 左侧拉动
let isLeftMouseDown = false
const leftMouseDown = (e: MouseEvent, item: TrackItem) => {
    e.preventDefault()
    e.stopPropagation()
    activeElementId.value = item.id
    isLeftMouseDown = true
    window.addEventListener('mousemove', leftMouseMove)
    window.addEventListener('mouseup', leftMouseUp)
}
const leftMouseMove = (e: MouseEvent) => {
    console.log('left');
    e.preventDefault()
    e.stopPropagation()
    if (!activeElementId.value) return
    const selectRow = props.dataList.find(v => v.id === activeElementId.value)
    if (isLeftMouseDown && selectRow) {
        const temp = e.movementX / props.perSecondPx
        const duration = selectRow.duration - temp
        const startTime = selectRow.startTime + temp
        if (duration <= 2 || startTime < 0) {
            return
        } else {
            emits('update-track-row-start-time', activeElementId.value, startTime)
            emits('update-duration', activeElementId.value, duration)
        }
    }
}
const leftMouseUp = (e: MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    isLeftMouseDown = false
    window.removeEventListener('mousemove', leftMouseMove)
    window.removeEventListener('mouseup', leftMouseUp)
}
// 右侧拉动
let isRightMouseDown = false
const rightMouseDown = (e: MouseEvent, item: TrackItem) => {
    console.log('right');
    e.preventDefault()
    e.stopPropagation()
    activeElementId.value = item.id
    isRightMouseDown = true
    window.addEventListener('mousemove', rightMouseMove)
    window.addEventListener('mouseup', rightMouseUp)
}
const rightMouseMove = (e: MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!activeElementId.value) return
    const selectRow = props.dataList.find(v => v.id === activeElementId.value)
    if (isRightMouseDown && selectRow) {
        const temp = e.movementX / props.perSecondPx
        const duration = selectRow.duration + temp
        if (duration <= 2) {
            return
        } else {
            emits('update-duration', activeElementId.value, duration)
        }
    }
}
const rightMouseUp = (e: MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    isRightMouseDown = false
    window.removeEventListener('mousemove', rightMouseMove)
    window.removeEventListener('mouseup', rightMouseUp)
}
</script>