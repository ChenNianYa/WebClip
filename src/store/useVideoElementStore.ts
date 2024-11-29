import VideoElement from "@/classes/element/VideoElement";
import { defineStore, storeToRefs } from "pinia";
import useClipStore from "./useClipStore";

const useVideoElementStore = defineStore('videoElement', () => {
    const clipStore = useClipStore()
    const { activeElementId } = storeToRefs(clipStore)
    // 增加videoElemnt
    const addVideoElement = (videoElement: VideoElement) => {
        clipStore.playState = false
        clipStore.elements.videos.push(videoElement)
        activeElementId.value = videoElement.id
        clipStore.updatePreviewCanvas(clipStore.currentTime)
    }
    return {
        addVideoElement
    }
})

export default useVideoElementStore