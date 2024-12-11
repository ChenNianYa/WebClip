import VideoElement from "@/classes/element/VideoElement";
import { defineStore, storeToRefs } from "pinia";
import useClipStore from "./useClipStore";
import VideoSource from "@/classes/source/VideoSource";

const useVideoStore = defineStore('video', () => {
    const clipStore = useClipStore()
    const { activeElementId } = storeToRefs(clipStore)
    const videoSourceList = ref<VideoSource[]>([])
    // 增加videoElemnt
    const addVideoElement = (videoElement: VideoElement) => {
        clipStore.playState = false
        clipStore.elements.videos.push(videoElement)
        activeElementId.value = videoElement.id
        // clipStore.updatePreviewCanvas(clipStore.currentTime)
    }
    const addVideoSource = (videoSource: VideoSource) => {
        videoSourceList.value.push(videoSource)
    }
    const deleteVideoSource = (id: number) => {
        videoSourceList.value = videoSourceList.value.filter(v => {
            if (v.id === id) {
                URL.revokeObjectURL(v.src)
                URL.revokeObjectURL(v.cover)
            } else {
                return v
            }
        })
    }
    return {
        addVideoElement,
        videoSourceList,
        addVideoSource,
        deleteVideoSource
    }
})

export default useVideoStore