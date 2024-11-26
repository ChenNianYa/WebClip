import ImageElement from "@/classes/element/ImageElement";
import VideoElement from "@/classes/element/VideoElement";
import ImageSource from "@/classes/source/ImageSource";
import VideoSource from "@/classes/source/VideoSource";
import { ElementsMap } from "@/types/element-option-types";
import { ClipCut } from "@/types/utils";
import muxVideo from "@/utils/muxVideo";
import { defineStore } from "pinia";
const mockerData: ElementsMap = {
    // videos: [
    //     new VideoElement({ width: 1920, height: 1080, source: new VideoSource({ width: 1920, height: 1080, duration: 60, cover: '', src: '', name: 'video1.mp4', file: new Blob(), size: 256 }) }),
    //     new VideoElement({ width: 1920, height: 1080, source: new VideoSource({ width: 1920, height: 1080, duration: 60, cover: '', src: '', name: 'video2.mp4', file: new Blob(), size: 256 }) }),
    //     new VideoElement({ width: 1920, height: 1080, source: new VideoSource({ width: 1920, height: 1080, duration: 60, cover: '', src: '', name: 'video3.mp4', file: new Blob(), size: 256 }) }),
    //     new VideoElement({ width: 1920, height: 1080, source: new VideoSource({ width: 1920, height: 1080, duration: 60, cover: '', src: '', name: 'video4.mp4', file: new Blob(), size: 256 }) }),
    //     new VideoElement({ width: 1920, height: 1080, source: new VideoSource({ width: 1920, height: 1080, duration: 60, cover: '', src: '', name: 'video5.mp4', file: new Blob(), size: 256 }) }),
    //     new VideoElement({ width: 1920, height: 1080, source: new VideoSource({ width: 1920, height: 1080, duration: 60, cover: '', src: '', name: 'video6.mp4', file: new Blob(), size: 256 }) }),
    //     new VideoElement({ width: 1920, height: 1080, source: new VideoSource({ width: 1920, height: 1080, duration: 60, cover: '', src: '', name: 'video7.mp4', file: new Blob(), size: 256 }) }),
    //     new VideoElement({ width: 1920, height: 1080, source: new VideoSource({ width: 1920, height: 1080, duration: 60, cover: '', src: '', name: 'video8.mp4', file: new Blob(), size: 256 }) })
    // ],
    // images: [
    //     new ImageElement({ width: 200, height: 200, source: new ImageSource({ width: 1920, height: 1080, src: '', image: new Image(), name: 'img1.jpg', file: new Blob(), size: 256 }) }),
    //     new ImageElement({ width: 200, height: 200, source: new ImageSource({ width: 1920, height: 1080, src: '', image: new Image(), name: 'img2.jpg', file: new Blob(), size: 256 }) })
    // ]，
    images: [],
    videos: []
}
const useClipStore = defineStore('clip', () => {
    // 轨道上的元素渲染
    const elements = ref<ElementsMap>({
        videos: [...mockerData.videos],
        images: [...mockerData.images]
    })
    // 剪切的片段
    const clipCuts = ref<ClipCut[]>([])
    // 播放状态
    const playState = ref(false)
    // 播放的当前时间
    const currentTime = ref(0)
    // 最长时间，是个计算属性
    const duration = computed(() => {
        let duration = 0;
        Object.values(elements.value).forEach(v => {
            v.forEach(item => {
                if (item.duration + item.startTime > duration) {
                    duration = item.duration + item.startTime
                }
            })
        })
        return duration
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
    const updateElemntStartTime = (id: number, startTime: number) => {
        const els = Object.values(elements.value).flat()
        for (const el of els) {
            if (el.id === id) {
                el.startTime = startTime
                return
            }
        }
    }
    const updateElementDuration = (id: number, duration: number) => {
        const els = Object.values(elements.value).flat()
        for (const el of els) {
            if (el.id === id) {
                el.duration = duration
                return
            }
        }
    }
    return {
        elements,
        exportVideo,
        playState,
        currentTime,
        duration,
        clipCuts,
        updateElemntStartTime,
        updateElementDuration,
    }
})

export default useClipStore