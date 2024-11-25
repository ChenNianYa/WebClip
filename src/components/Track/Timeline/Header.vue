<template>
    <div :style="{ width: (props.duration + 1) * (props.perSecondPx) + 'px' }"
        class="h-[60px] flex items-end border-b border-orange-600" ref="headerRef">
        <div v-for="(num, index) in props.duration + 1" class="border-l border-orange-600 relative"
            :style="{ width: perSecondPx + 'px' }" :key="index" :class="{
                'h-[20%]': index % 5 !== 0,
                'h-[50%]': index % 5 === 0
            }">
            <div v-if="index % 5 === 0" class="text-xs absolute top-[-20px] ">{{ secondsToTimeFormat(index)
                }}</div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { secondsToTimeFormat } from '@/utils/transform';
const headerRef = ref<HTMLElement>()
const props = withDefaults(defineProps<{
    duration: number,
    perSecondPx: number
}>(), {
    duration: 0,
    perSecondPx: 5
})

const emits = defineEmits<{
    (e: 'add-per-second-px'): void,
    (e: 'decrease-per-second-px'): void
}>()

onMounted(() => {
    if (!headerRef.value) return
    headerRef.value.addEventListener('wheel', (e) => {
        e.preventDefault()
        console.log(e);
        if (e.deltaY < 0) {
            emits('add-per-second-px')
        } else if (e.deltaY > 0) {
            emits('decrease-per-second-px')
        }

    })
})

</script>