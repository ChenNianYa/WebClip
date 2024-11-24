<template>
    <FileSelect :accept="{ ' image/*': ['.png', '.gif', '.jpeg', '.jpg'] }" text="选择需要上传的图片"
        @select-file="getImageSource" class="mb-2" />
    <ImageList :list="imageList" @delete="onDelete" @add-track="onAddTrack" />
</template>
<script setup lang="ts">
import ImageElement from '@/classes/element/ImageElement';
import ImageSource from '@/classes/source/ImageSource';
import useImageElementStore from '@/store/useImageElementStore';
const imageElementStore = useImageElementStore()
const imageList = ref<ImageSource[]>([])
const getImageSource = async (imageBlob: File) => {
    const src = URL.createObjectURL(imageBlob)
    const image = new Image()
    image.crossOrigin = 'anonymous';
    const imageLoad = new Promise((resolve) => {
        image.onload = (e) => {
            resolve(e)
        }
    })
    image.src = src
    await imageLoad
    const imageSource = new ImageSource({
        size: imageBlob.size,
        name: imageBlob.name,
        file: imageBlob,
        src,
        width: image.width,
        height: image.height,
        image: image
    })
    imageList.value.push(imageSource)
}
const onDelete = (id: number) => {
    imageList.value = imageList.value.filter(v => v.id !== id)
}
const onAddTrack = (id: number) => {
    // 将source转化成element 加入到clip中
    const imageSource = imageList.value.find(v => v.id === id)
    if (!imageSource) return
    const imageElement = new ImageElement({
        width: imageSource.width,
        height: imageSource.height,
        source: imageSource
    })
    imageElementStore.addImageElement(imageElement)
}
</script>
