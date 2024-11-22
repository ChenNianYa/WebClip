<template>
    <el-button @click="chooseFile" size="large" class="w-full" :dark="true">{{ props.text }}</el-button>
</template>
<script setup lang="ts">
const emits = defineEmits<{
    (e: 'select-file', file: File): void
}>()
const props = defineProps<{
    accept: { [key in string]: string[] },
    text: string
}>()
const chooseFile = async () => {
    try {
        // @ts-ignore
        const [fileHandle] = await window.showOpenFilePicker({
            types: [
                {
                    accept: props.accept,
                },
            ],
        });
        if (fileHandle) {
            const file = await fileHandle.getFile()
            emits('select-file', file)
        }
    } catch (error) {
        // @ts-ignore
        if (error.name === "AbortError") {
            console.log("用户取消了文件选择。");
        } else {
            console.error("出现错误：", error);
        }
    }
}
</script>
