import { defineStore, storeToRefs } from "pinia";
import useClipStore from "./useClipStore";
import AudioSource from "@/classes/source/AudioSource";
import AudioElement from "@/classes/element/AudioElement";

const useAudioStore = defineStore('audio', () => {
    const clipStore = useClipStore()
    const audioSourceList = ref<AudioSource[]>([])
    const audioElementList = ref<AudioElement[]>([])
    const addAuidoSource = (audioSource: AudioSource) => {
        audioSourceList.value.push(audioSource)
    }
    const deleteAuidoSource = (id: number) => {
        audioSourceList.value = audioSourceList.value.filter(v => {
            if (v.id === id) {
                URL.revokeObjectURL(v.src)
            } else {
                return v
            }
        })
    }
    // 增加videoElemnt
    const addAudioElement = (audioElement: AudioElement) => {
        clipStore.playState = false
        audioElementList.value.push(audioElement)
        // clipStore.updatePreviewCanvas(clipStore.currentTime)
    }
    return {
        addAudioElement,
        addAuidoSource,
        deleteAuidoSource,
        audioSourceList,
        audioElementList
    }
})

export default useAudioStore