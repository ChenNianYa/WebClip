import BaseElement from "@/classes/element/BaseElement";
import ImageElement from "@/classes/element/ImageElement";
import VideoElement from "@/classes/element/VideoElement";
import previewCanvasManager from "@/classes/preview";
import CanvasElement from "@/classes/preview/CanvasElement";
import PreviewCanvasManager from "@/classes/preview/PreviewCanvasManager";
import ImageSource from "@/classes/source/ImageSource";
import VideoSource from "@/classes/source/VideoSource";
import { updateCanvasElementKey } from "@/event-bus";
import { Ratio } from "@/types/clip-config-types";
import { ElementsMap } from "@/types/element-option-types";
import { ClipCut } from "@/types/utils";
// import muxVideo from "@/utils/muxVideo";
import { muxVideo } from "@/utils/mux-video-webm";
import { elementInPreview } from "@/utils/preview-utils";
import { useDebounceFn, useEventBus } from "@vueuse/core";
import { defineStore } from "pinia";
const updateCanvasElementBus = useEventBus(updateCanvasElementKey)
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
    // 激活的元素
    const activeElementId = ref<number>(0)
    watch(activeElementId, (val) => {
        if (previewCanvasManager.value) {
            previewCanvasManager.value.activeElement = previewCanvasManager.value?.elements.find(v => v.id === val)
            previewCanvasManager.value.resetCtrlElPos()
        }

    })
    const activeElement = computed(() => {
        return Object.values(elements.value).flat().find(v => v.id === activeElementId.value)
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
                if ((item.duration + item.startTime) > duration) {
                    duration = item.duration + item.startTime
                }
            })
        })
        return duration
    })
    // 视频比例
    const ratio = ref<Ratio>(Ratio.Horizontal)
    const width = computed(() => ratio.value === Ratio.Horizontal ? 1920 : 100)
    const height = computed(() => ratio.value === Ratio.Horizontal ? 1080 : 100)
    // preview canvas manager
    updateCanvasElementBus.on((e) => {
        const els = Object.values(elements.value).flat()
        for (const el of els) {
            if (el.id === e.cvsElement.id) {
                el.width = e.cvsElement.width
                el.height = e.cvsElement.height
                el.x = e.cvsElement.x
                el.y = e.cvsElement.y
            }
        }
    })
    // update preview 
    const updatePreviewCanvas = async (time: number) => {
        if (!previewCanvasManager.value) return
        const width = previewCanvasManager.value.width
        const height = previewCanvasManager.value.height
        const canvas = new OffscreenCanvas(width, height);
        const ctx = canvas.getContext('2d')
        if (!ctx) return
        previewCanvasManager.value.reset()
        // 后面可以合并成一个循环。。再看吧
        for (const video of elements.value.videos) {
            if (!elementInPreview(video, time)) {
                if (previewCanvasManager.value.activeElement?.id === video.id) {
                    previewCanvasManager.value.cancelActiveElement()
                }
                continue
            }
            // ctx.clearRect(0, 0, canvas.width, canvas.height)
            video.source.video.width = video.width
            video.source.video.height = video.height
            if (time !== video.source.video.currentTime || (video.source.video.readyState <= HTMLMediaElement.HAVE_CURRENT_DATA)) {
                const canPlayPromise = new Promise((resolve) => {
                    video.source.video.addEventListener('canplay', () => {
                        resolve(true)
                    })
                    video.source.video.addEventListener('timeupdate', () => {
                        resolve(true)
                    })
                })
                video.source.video.currentTime = time
                await canPlayPromise
            }
            video.source.video.currentTime = time
            canvas.width = video.width
            canvas.height = video.height
            ctx.drawImage(video.source.video, 0, 0, video.width, video.height)
            const imbp = canvas.transferToImageBitmap()
            previewCanvasManager.value.addElement(new CanvasElement(video.id, imbp, video.width, video.height, video.x, video.y))
        }
        for (const image of elements.value.images) {
            console.log(image);

            if (!elementInPreview(image, time)) {
                if (previewCanvasManager.value.activeElement?.id === image.id) {
                    previewCanvasManager.value.cancelActiveElement()
                }
                continue
            }
            // ctx.clearRect(0, 0, canvas.width, canvas.height)
            image.source.image.width = image.width
            image.source.image.height = image.height
            canvas.width = image.width
            canvas.height = image.height
            ctx.drawImage(image.source.image, 0, 0, image.width, image.height)
            const imbp = canvas.transferToImageBitmap()
            previewCanvasManager.value.addElement(new CanvasElement(image.id, imbp, image.width, image.height, image.x, image.y))
        }
    }
    // preview 预览函数
    const preview = () => {
        playState.value = true
        // let startTime = currentTime.value
        // let start = Date.now()
        // const play = () => {
        //     requestAnimationFrame(() => {
        //         const now = Date.now()
        //         const currentTime = (now - start) / 1000 + startTime
        //         updatePreviewCanvas(currentTime)
        //         play()
        //     })
        // }
        // requestAnimationFrame(play)
    }
    const pause = () => {
        playState.value = false

    }
    const exportVideo = async () => {
        muxVideo()
    }
    // 通过id来更新元素
    const updateElemntStartTime = (id: number, startTime: number) => {
        const els = Object.values(elements.value).flat()
        outer:
        for (const el of els) {
            if (el.id === id) {
                el.startTime = startTime
                break outer
            }
        }
        updatePreviewCanvas(currentTime.value)
    }
    const updateElementDuration = (id: number, duration: number) => {
        const els = Object.values(elements.value).flat()
        outer:
        for (const el of els) {
            if (el.id === id) {
                el.duration = duration
                break outer
            }
        }
        updatePreviewCanvas(currentTime.value)
    }
    const deleteElementById = (id: number) => {
        const mapList = Object.values(elements.value)
        outer:
        for (let i = 0; i < mapList.length; i++) {
            for (let j = 0; j < mapList[i].length; i++) {
                if (mapList[i][j].id === id) {
                    mapList[i].splice(j, 1)
                    break outer
                }
            }
        }
        activeElementId.value = 0
        updatePreviewCanvas(currentTime.value)
    }
    return {
        elements,
        activeElementId,
        activeElement,
        exportVideo,
        playState,
        currentTime,
        duration,
        clipCuts,
        updateElemntStartTime,
        updateElementDuration,
        ratio,
        updatePreviewCanvas,
        width,
        height,
        deleteElementById,
        preview

    }
})

export default useClipStore