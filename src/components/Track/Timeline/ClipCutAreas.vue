<template>
    <template v-for="clipCut in clipStore.clipCuts">
        <div class="h-full absolute bg-clip-cut-area-color top-0 pointer-events-none"
            :style="{ left: Math.min(clipCut[0], clipCut[1]) * props.perSecondPx + 'px', width: Math.abs(clipCut[0] - clipCut[1]) * props.perSecondPx + 'px' }">
            <div class="w-full h-ful"></div>
        </div>
    </template>
</template>
<script setup lang="ts">
import useClipStore from '@/store/useClipStore';
const clipStore = useClipStore()
const props = defineProps<{
    perSecondPx: number
}>()
</script>