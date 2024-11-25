<template>
    <div :style="{ width: props.item.duration * props.perSecondPx + 'px' }" class="bg-black">
        {{ item.name }}
    </div>
</template>
<script setup lang="ts">
import { TrackItem } from '@/types/timeline-types';
const props = withDefaults(defineProps<{
    item: TrackItem,
    perSecondPx: number
}>(), {
})
</script>