<template>
  <div class="flex h-full bg-primary-1 text-gray-300 overflow-hidden">
    <!-- 素材区域 -->
    <div class="w-left border-r border-primary-border shrink-0 px-2 overflow-hidden">
      <Source />
    </div>
    <!-- 工作台区域 -->
    <div class="flex-1 border-r border-primary-border flex flex-col">
      <div class="flex-1 flex">
        <!-- 预览区域 -->
        <div class="flex-1 border-r border-primary-border p-4">
          <Preview />
        </div>
        <!-- 配置区 -->
        <div class="w-right shrink-0">
          <Config />
        </div>
      </div>
      <!-- 控制区域 -->
      <div class="flex">
        <div class="flex-1">
          <div class="border-t border-primary-border h-control px-4">
            <Control />
          </div>
          <!-- 轨道区域 -->
          <div class="border-t border-primary-border h-track p-4">
            <Track />
          </div>
        </div>
        <!-- 选中轨道上元素的信息区域 -->
        <div class="w-right shrink-0 border-l border-t border-primary-border">
          <Info />
        </div>
      </div>
    </div>

  </div>
</template>
<script setup lang="ts">
</script>
