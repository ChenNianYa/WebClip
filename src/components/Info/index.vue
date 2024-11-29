<template>
    <div v-show="clipStore.activeElementId">
        <el-descriptions title="素材信息" border size='small' label-width="80" :column='2'>
            <el-descriptions-item label="name">name</el-descriptions-item>
            <el-descriptions-item label="width">{{ twoDecimalNumberize(clipStore.activeElement?.width ?? 0)
                }}px</el-descriptions-item>
            <el-descriptions-item label="height">{{ twoDecimalNumberize(clipStore.activeElement?.height ?? 0)
                }}px</el-descriptions-item>
            <el-descriptions-item label="x">{{ twoDecimalNumberize(clipStore.activeElement?.x ?? 0)
                }}px</el-descriptions-item>
            <el-descriptions-item label="y">{{ twoDecimalNumberize(clipStore.activeElement?.y ?? 0)
                }}px</el-descriptions-item>
            <el-descriptions-item label="start">{{ twoDecimalNumberize(clipStore.activeElement?.startTime ?? 0)
                }}s</el-descriptions-item>
            <el-descriptions-item label="duration">{{ twoDecimalNumberize(clipStore.activeElement?.duration ?? 0)
                }}s</el-descriptions-item>
            <el-descriptions-item label="end">{{ twoDecimalNumberize((clipStore.activeElement?.startTime ?? 0) +
                (clipStore.activeElement?.duration ?? 0))
                }}s</el-descriptions-item>
        </el-descriptions>
        <div><el-button type='danger' @click="deleteElement">删除素材</el-button></div>
    </div>

</template>

<script setup lang="ts">
import useClipStore from '@/store/useClipStore';
import { twoDecimalNumberize } from '@/utils/transform';

const clipStore = useClipStore()
const deleteElement = () => {
    if (!clipStore.activeElementId) return
    clipStore.deleteElementById(clipStore.activeElementId)
}
</script>