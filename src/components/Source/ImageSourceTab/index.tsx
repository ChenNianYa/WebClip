import { useState } from "react";
import FileSelect from "../../FileSelect";
import ImageSource from "../../../class/ImageSource";
import ImageList from "./ImageList";
const ImageSourceTab = () => {
    const [list, setList] = useState<ImageSource[]>([])
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
        list.push(imageSource)
        setList([...list])
    }
    const onDelete = (id: number | undefined) => {
        if (!id) return
        setList(list.filter(v => v.id !== id))
    }
    return (
        <>
            <div className="px-2">
                <FileSelect
                    onSelectFile={getImageSource}
                    accept={{
                        "image/*": [".png", ".gif", ".jpeg", ".jpg"],
                    }}
                    text="选择需要上传的图片"
                />
                <ImageList list={list} onDelete={onDelete} />
            </div>
        </>
    )
}

export default ImageSourceTab