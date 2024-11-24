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
    let fileHandle
    try {
        // @ts-ignore
        const res = await window.showOpenFilePicker({
            types: [
                {
                    accept: props.accept,
                },
            ],
        });
        fileHandle = res[0]
    } catch (error) {
        // @ts-ignore
        if (error.name === "AbortError") {
            console.log("用户取消了文件选择。");
        } else {
            console.error("出现错误：", error);
        }
    }
    if (!fileHandle) return
    const handle: FileSystemFileHandle = fileHandle
    const file = await handle.getFile()
    emits('select-file', file)
}
</script>
