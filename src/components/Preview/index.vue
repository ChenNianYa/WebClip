<template>
    <div class="w-full h-full flex items-center overflow-hidden">
        <div class="w-[80%] aspect-video  mx-auto relative" ref="containerRef">
            <canvas class="absolute bg-black w-full h-full" ref="canvasRef" :width="canvasSize?.width"
                :height="canvasSize?.height"></canvas>
            <div class="absolute w-full h-full pointer-events-none" ref="axisRef"></div>
            <div class="absolute pointer-events-none border border-blue-800 hidden" ref="ctrlRef">
                <div
                    class="w-[10px] h-[10px] rounded-full border border-violet-800 absolute top-[-5px] left-[-5px] bg-white">
                </div>
                <div
                    class="w-[10px] h-[10px] rounded-full border border-violet-800 absolute top-[-5px] right-[-5px] bg-white">
                </div>
                <div
                    class="w-[10px] h-[10px] rounded-full border border-violet-800 absolute bottom-[-5px] left-[-5px] bg-white">
                </div>
                <div
                    class="w-[10px] h-[10px] rounded-full border border-violet-800 absolute bottom-[-5px] right-[-5px] bg-white">
                </div>
                <div
                    class="w-[15px] h-[15px] rounded-full border border-violet-800 absolute bg-white left-[50%] translate-x-[-50%] top-[-30px]">
                    <div class="h-[15px] w-[1px] absolute bg-violet-800 left-[50%] z-[-1] top-[15px]"></div>
                </div>
            </div>
        </div>
    </div>
</template>
<script setup lang="ts">
import previewCanvasManager from '@/classes/preview';
import PreviewCanvasManager from '@/classes/preview/PreviewCanvasManager';
import useClipStore from '@/store/useClipStore';
import { Ratio } from '@/types/clip-config-types';

const clipStore = useClipStore()
const canvasSize = computed(() => {
    if (clipStore.ratio === Ratio.Horizontal) {
        return {
            width: 1920,
            height: 1080
        }
    }
})

const canvasRef = ref<HTMLCanvasElement>()
const ctrlRef = ref<HTMLDivElement>()
const axisRef = ref<HTMLDivElement>()
const containerRef = ref<HTMLDivElement>()
onMounted(() => {
    if (canvasSize.value && canvasRef.value && ctrlRef.value && axisRef.value && containerRef.value) {
        previewCanvasManager.value = new PreviewCanvasManager({
            width: canvasSize.value.width,
            height: canvasSize.value.height,
            container: containerRef.value,
            canvas: canvasRef.value,
            axis: axisRef.value,
            ctrl: ctrlRef.value
        })
    }
})
</script>
