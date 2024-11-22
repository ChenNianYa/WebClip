<template>
    <div class="flex flex-wrap justify-between">
        <el-card v-for="(image, index) in props.list" :key="image.id" class="mb-2"
            body-class="!p-2 flex flex-col items-center mb-2 w-[160px] h-full">
            <div class="flex items-center flex-1 w-[120px]">
                <el-image :src="image.src" fit="contain" class="w-full" :initial-index="index"
                    :preview-src-list="props.list.map(v => v.src)" />
            </div>
            <el-tooltip effect="dark" :content="image.name" placement="top-start">
                <el-text truncated size='small'>
                    <b>名称</b>:&nbsp;&nbsp;{{ image.name }}
                </el-text>
            </el-tooltip>
            <div class="flex justify-between w-full mt-2">
                <el-button size="small">加入轨道</el-button>
                <el-button size="small" type='danger' @click="emits('delete', image.id)">删除</el-button>
            </div>
        </el-card>
    </div>
</template>
<script setup lang="ts">
import ImageSource from '@/classes/source/ImageSource';

const emits = defineEmits<{
    (e: 'delete', id: number): void
}>()
const props = withDefaults(defineProps<{
    list: ImageSource[]
}>(), {
    list: () => []
})
</script>