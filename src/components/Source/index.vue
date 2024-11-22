<template>
    <el-tabs v-model="activeTab" stretch>
        <el-tab-pane label="视频" name="1">
            <VideoTab />
        </el-tab-pane>
        <el-tab-pane label="图片" name="2">
            <ImageTab />
        </el-tab-pane>
        <el-tab-pane label="花字" name="3">花字</el-tab-pane>
        <el-tab-pane label="音频" name="4">音频</el-tab-pane>
    </el-tabs>
</template>
<script setup lang="ts">
const activeTab = ref('1')

</script>
