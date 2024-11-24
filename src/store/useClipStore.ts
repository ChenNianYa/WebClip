import { ElementsMap } from "@/types/element-option-types";
import muxVideo from "@/utils/muxVideo";
import { defineStore } from "pinia";

const useClipStore = defineStore('clip', () => {
    // 轨道上的元素渲染
    const elements = ref<ElementsMap>({
        videos: [],
        images: []
    })
    const exportVideo = async () => {
        // 1. 选择要到导出的文件夹 --------------------
        let folderHandle
        try {
            //@ts-ignore
            folderHandle = await window.showDirectoryPicker();
        } catch (error) {
            // @ts-ignore
            if (error.name === "AbortError") {
                console.log("用户取消了文件夹选择。");
            } else {
                console.error("出现错误：", error);
            }
        }
        if (!folderHandle) return


        const handle: FileSystemDirectoryHandle = folderHandle
        // 2. 创建文件 ------------------------------------
        const fileName = 'test.mp4'
        const fileHandle = await handle.getFileHandle(fileName, { create: true });
        // // 可以通过writableStream去写入文件了
        const writableStream = await fileHandle.createWritable();
        // 3. 合成视频 --------------------------------------
        muxVideo(elements.value, writableStream)
    }
    return {
        elements,
        exportVideo
    }
})

export default useClipStore