<template>
    <div class="flex flex-wrap justify-between">
        <el-card v-for="(audio) in props.list" :key="audio.id" class="mb-2"
            body-class="!p-2 flex flex-col items-center mb-2 w-[160px] h-full">
            <el-tooltip effect="dark" :content="audio.name" placement="top-start">
                <el-text truncated size='small'>
                    <b>名称</b>:&nbsp;&nbsp;{{ audio.name }}
                </el-text>
            </el-tooltip>
            <div class="flex justify-between w-full mt-2">
                <el-button size="small" @click="emits('add-track', audio.id)">加入轨道</el-button>
                <el-button size="small" type='danger' @click="emits('delete', audio.id)">删除</el-button>
            </div>
        </el-card>
    </div>
</template>
<script setup lang="ts">
import AudioSource from '@/classes/source/AudioSource';

const emits = defineEmits<{
    (e: 'delete', id: number): void
    (e: 'add-track', id: number): void
}>()
const props = withDefaults(defineProps<{
    list: AudioSource[]
}>(), {
    list: () => []
})
</script>