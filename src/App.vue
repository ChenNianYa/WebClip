<template>
  <div class="flex h-full bg-primary-1 text-gray-300">
    <!-- 素材区域 -->
    <div class="w-left border-r border-primary-border shrink-0 px-2">
      <Source />
    </div>
    <!-- 工作台区域 -->
    <div class="flex-1 border-r border-primary-border flex flex-col">
      <!-- 预览区域 -->
      <div class="flex-1">
        <Preview />
      </div>
      <!-- 控制区域 -->
      <div class="border-t border-primary-border h-control">
        <Control />
      </div>
      <!-- 轨道区域 -->
      <div class="border-t border-primary-border h-track">
        <Track />
      </div>
    </div>
    <!-- 配置区 -->
    <div class="w-right shrink-0">
      <Config />
    </div>
  </div>
</template>
<script setup lang="ts">
</script>
