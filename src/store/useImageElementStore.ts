import { defineStore } from "pinia";
import useClipStore from "./useClipStore";
import ImageElement from "@/classes/element/ImageElement";

const useImageElementStore = defineStore('imageElement', () => {
    const clipStore = useClipStore()
    // 增加videoElemnt
    const addImageElement = (ImageElement: ImageElement) => {
        clipStore.elements.images.push(ImageElement)
    }
    return {
        addImageElement
    }
})

export default useImageElementStore