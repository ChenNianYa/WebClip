<template>
    <div style="width: calc(100vw - 700px);overflow: auto" class="relative">
        <Header :duration="props.duration" :per-second-px="props.perSecondPx" class="static"
            @add-per-second-px="emits('add-per-second-px')" @decrease-per-second-px="emits('decrease-per-second-px')">
        </Header>
        <div class="mt-2  h-[170px]">
            <TrackRow v-for="item in props.dataList" :item="item" :per-second-px="props.perSecondPx" />
        </div>
    </div>
</template>
<script setup lang="ts">
import { TrackItem } from '@/types/timeline-types';
const emits = defineEmits<{
    (e: 'add-per-second-px'): void,
    (e: 'decrease-per-second-px'): void
}>()
const props = withDefaults(defineProps<{
    dataList: TrackItem[],
    duration: number,
    perSecondPx: number
}>(), {
    dataList: () => [],
    perSecondPx: 5,
    duration: 0
})
</script>