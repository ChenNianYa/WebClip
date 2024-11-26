<template>
    <!-- <el-button @click="clipStore.exportVideo">导出视频</el-button> -->
    <div class="flex items-center h-full">
        <!-- 没有素材的时候 -->
        <div v-if="noElement">暂无素材</div>
        <!-- 有素材的时候 -->
        <div v-else class="flex items-center justify-between w-full">
            <div class="flex items-center flex-1 mr-10">
                <el-icon :size="50" class="mr-4" @click="() => { playState = !playState }">
                    <VideoPlay v-show="!clipStore.playState" />
                    <VideoPause v-show="clipStore.playState" />
                </el-icon>
                <el-slider v-model="currentTime" :max="clipStore.duration" :min="0"
                    :format-tooltip="secondsToTimeFormat" />
            </div>
            <div>
                <el-button @click="clipStore.exportVideo">导出视频</el-button>
            </div>
        </div>
    </div>
</template>
<script setup lang="ts">
import useClipStore from '@/store/useClipStore';
import { secondsToTimeFormat } from '@/utils/transform';
import { VideoPause, VideoPlay } from '@element-plus/icons-vue';
import { storeToRefs } from 'pinia';
const clipStore = useClipStore()
const { currentTime, playState } = storeToRefs(clipStore)
// const canvasRef = ref()

const noElement = computed(() => {
    let elmentsNumber = 0
    Object.values(clipStore.elements).forEach(v => {
        console.log(v);

        elmentsNumber += v.length
    })
    return !elmentsNumber
})
</script>
