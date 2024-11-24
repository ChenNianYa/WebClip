<template>
    <el-button @click="clipStore.exportVideo">导出视频</el-button>
</template>
<script setup lang="ts">
import useClipStore from '@/store/useClipStore';
const canvasRef = ref()
const clipStore = useClipStore()
</script>
