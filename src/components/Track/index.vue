<template>
    <!-- 时间轴  拖拽选择区域，即为最后的切割区域-->
    <div v-for="element in clipStore.elements.videos">
        {{ element.source.name }}
    </div>
    <div v-for="element in clipStore.elements.images">
        {{ element.source.name }}
    </div>
</template>
<script setup lang="ts">
import useClipStore from '@/store/useClipStore';

const clipStore = useClipStore()

</script>
