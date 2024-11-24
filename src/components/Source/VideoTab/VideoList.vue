<template>
    <el-card v-for="item in props.list" body-class="!p-2" class="mb-2">
        <div class="flex justify-between mb-3 ">
            <div class="w-[160px] shrink-0 flex items-center">
                <el-image :src="item.cover" fit="contain" class="w-full" />
            </div>
            <div class="ml-2 flex flex-col justify-between w-[140px]">
                <div>
                    <el-tooltip effect="dark" :content="item.name" placement="top-start">
                        <el-text truncated size='small'>
                            <b>名称</b>:&nbsp;&nbsp;{{ item.name }}
                        </el-text>
                    </el-tooltip>
                    <el-text truncated size='small'>
                        <b>时长</b>:&nbsp;&nbsp;{{ secondsToTimeFormat(item.duration) }}
                    </el-text>
                    <el-text truncated size='small'>
                        <b>大小</b>:&nbsp;&nbsp;{{ formatBytesToUnit(item.size) }}
                    </el-text>
                </div>
                <div class="flex justify-between">
                    <el-button size="small" @click="emits('add-track', item.id)">加入轨道</el-button>
                    <el-button size="small" type='danger' @click="emits('delete', item.id)">删除</el-button>
                </div>
            </div>
        </div>
    </el-card>
</template>
<script setup lang="ts">
import VideoSource from '@/classes/source/VideoSource';
import { formatBytesToUnit, secondsToTimeFormat } from '@/utils/transform';

const emits = defineEmits<{
    (e: 'delete', id: number): void
    (e: 'add-track', id: number): void
}>()
const props = withDefaults(defineProps<{
    list: VideoSource[]
}>(), {
    list: () => []
})

</script>