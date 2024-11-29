import { defineStore, storeToRefs } from "pinia";
import useClipStore from "./useClipStore";
import ImageElement from "@/classes/element/ImageElement";

const useImageElementStore = defineStore('imageElement', () => {
    const clipStore = useClipStore()
    const { activeElementId } = storeToRefs(clipStore)
    // 增加videoElemnt
    const addImageElement = (ImageElement: ImageElement) => {
        clipStore.playState = false
        clipStore.elements.images.push(ImageElement)
        activeElementId.value = ImageElement.id
        clipStore.updatePreviewCanvas(clipStore.currentTime)
    }
    return {
        addImageElement
    }
})

export default useImageElementStore