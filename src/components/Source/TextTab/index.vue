<template>
    <div class="w-full flex justify-between">
        <div v-for="text in texts">
            <div v-html="text.render()" :key="text.id" class="w-full flex"></div>
        </div>
    </div>
</template>

<script setup lang="ts">
import texts from './TextTemplate'
</script>