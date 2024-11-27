import { defineStore } from "pinia";
import useClipStore from "./useClipStore";
import ImageElement from "@/classes/element/ImageElement";

const useImageElementStore = defineStore('imageElement', () => {
    const clipStore = useClipStore()
    // 增加videoElemnt
    const addImageElement = (ImageElement: ImageElement) => {
        clipStore.playState = false
        clipStore.elements.images.push(ImageElement)
        clipStore.updatePreviewCanvas()
    }
    return {
        addImageElement
    }
})

export default useImageElementStore