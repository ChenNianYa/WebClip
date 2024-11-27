import VideoElement from "@/classes/element/VideoElement";
import { defineStore } from "pinia";
import useClipStore from "./useClipStore";

const useVideoElementStore = defineStore('videoElement', () => {
    const clipStore = useClipStore()
    // 增加videoElemnt
    const addVideoElement = (videoElement: VideoElement) => {
        clipStore.playState = false
        clipStore.elements.videos.push(videoElement)
        clipStore.updatePreviewCanvas()
    }
    return {
        addVideoElement
    }
})

export default useVideoElementStore