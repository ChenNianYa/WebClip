<template>
    <FileSelect :accept="{ ' image/*': ['.png', '.gif', '.jpeg', '.jpg'] }" text="选择需要上传的图片"
        @select-file="getImageSource" class="mb-2" />
    <ImageList :list="imageList" @delete="onDelete" />
</template>
<script setup lang="ts">
import ImageSource from '@/classes/source/ImageSource';

const imageList = ref<ImageSource[]>([])
const getImageSource = async (imageBlob: File) => {
    const src = URL.createObjectURL(imageBlob)
    const image = new Image()
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
        height: image.height
    })
    imageList.value.push(imageSource)
}
const onDelete = (id: number) => {
    imageList.value = imageList.value.filter(v => v.id !== id)
}
</script>
