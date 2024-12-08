import previewCanvasManager from "@/classes/preview";
import CanvasElement from "@/classes/preview/CanvasElement";
import { updateCanvasElementKey } from "@/event-bus";
import { Ratio } from "@/types/clip-config-types";
import { ElementsMap } from "@/types/element-option-types";
import { ClipCut } from "@/types/utils";
import muxMP4 from "@/utils/mux";
// import muxVideo from "@/utils/muxVideo";
import { elementInPreview } from "@/utils/preview-utils";
import { useEventBus } from "@vueuse/core";
import { defineStore } from "pinia";
const updateCanvasElementBus = useEventBus(updateCanvasElementKey)
const mockerData: ElementsMap = {
    images: [],
    videos: []
}
const useClipStore = defineStore('clip', () => {
    // 视频名称
    const muxVideoName = ref('testmp4.mp4')
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
    // 剪切的片段  片段剪辑现在先不实现 感觉会很复杂 最后再提娜佳
    const clipCuts = ref<ClipCut[]>([])
    // 播放状态
    const playState = ref(false)
    // 播放的当前时间
    const currentTime = ref(0)
    // 视频帧率
    const frameRate = ref(25)
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
    // preview canvas manager  里面没有用响应式数据，所以用bus传递信息
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
    // preview 预览函数  这里后面准备用html预览。  如果用canvas 逻辑写起来感觉会很复杂，而且会有bug感觉卡顿感也会强烈 用html就会刚刚好  canvas调整  html预览
    const preview = () => {
        playState.value = true
    }
    const pause = () => {
        playState.value = false

    }
    const exportVideo = async () => {
        // 核心值得单独写   utils/mux里
        muxMP4()
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
        preview,
        muxVideoName,
        frameRate

    }
})

export default useClipStore