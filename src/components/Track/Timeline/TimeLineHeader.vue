<template>
    <div :style="{ width: (props.duration + 1) * (props.perSecondPx) + 'px' }"
        class="h-[60px] flex items-end border-b border-orange-600 pointer-events-auto" ref="headerRef">
        <div v-for="(num, index) in Math.ceil(props.duration) + 1" class="border-l border-orange-600 relative"
            :style="{ width: perSecondPx + 'px' }" :key="index" :class="{
                'h-[20%]': index % 5 !== 0,
                'h-[50%]': index % 5 === 0
            }">
            <div v-if="index % 5 === 0" class="text-xs absolute top-[-20px] ">{{ secondsToTimeFormat(index) }}</div>
        </div>
    </div>
</template>

<script setup lang="ts">
import useClipStore from '@/store/useClipStore';
import { ClipCut } from '@/types/utils';
import { secondsToTimeFormat } from '@/utils/transform';
import { storeToRefs } from 'pinia';
const clipStore = useClipStore()
const { clipCuts } = storeToRefs(clipStore)
const headerRef = ref<HTMLElement>()
const props = withDefaults(defineProps<{
    duration: number,
    perSecondPx: number,
    trackRef: HTMLDivElement | undefined
}>(), {
    duration: 0,
    perSecondPx: 5
})
const trackRefRect = computed(() => {
    return props.trackRef?.getBoundingClientRect()
})
const emits = defineEmits<{
    (e: 'add-per-second-px'): void,
    (e: 'decrease-per-second-px'): void
}>()

onMounted(() => {
    if (!headerRef.value) return

    headerRef.value.addEventListener('wheel', headerWheel)
    headerRef.value.addEventListener('mousedown', headerMouseDown)

    window.addEventListener('mouseup', headerMouseUp)
})
const headerWheel = (e: WheelEvent) => {
    e.preventDefault()
    if (e.deltaY < 0) {
        emits('add-per-second-px')
    } else if (e.deltaY > 0) {
        emits('decrease-per-second-px')
    }
}

let isMouseDown = false
let currentArea: ClipCut
const headerMouseDown = (e: MouseEvent) => {
    e.preventDefault()
    if (!(trackRefRect.value && props.trackRef)) return
    let x = e.clientX - trackRefRect.value.left + props.trackRef.scrollLeft
    const time = x / props.perSecondPx
    if (checkTime([time, time])) {
        isMouseDown = true
        clipCuts.value.push([time, time])
        currentArea = clipCuts.value[clipCuts.value.length - 1]
        window.addEventListener('mousemove', headerMouseMove)
    }
}

const headerMouseMove = (e: MouseEvent) => {
    e.preventDefault()
    console.log('mouse move');
    if (!(trackRefRect.value && props.trackRef)) return
    let x = e.clientX - trackRefRect.value.left + props.trackRef.scrollLeft
    const time = x / props.perSecondPx
    if (checkTime(currentArea)) {
        if (isMouseDown) {
            clipCuts.value[clipCuts.value.length - 1][1] = time
        }
    }
}
const headerMouseUp = (e: MouseEvent) => {
    e.preventDefault()
    isMouseDown = false
    console.log('mouse up', clipCuts.value);
    window.removeEventListener('mousemove', headerMouseMove)
}
const checkTime = ([time1, time2]: ClipCut) => {
    const start = Math.min(time1, time2)
    const end = Math.max(time1, time2)
    if (start <= props.duration && end <= props.duration) {
        for (let i = 0; i < clipCuts.value.length; i++) {
            const [rangeStart, rangeEnd] = clipCuts.value[i];
            const max = Math.max(rangeStart, rangeEnd)
            const min = Math.min(rangeStart, rangeEnd)
            if ((start > min && start < max) || (end > min && end < max) || (start < min && end > max)) {
                return false;
            }
        }
        return true
    }
    return false
}
</script>