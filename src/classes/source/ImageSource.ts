import { ImageSourceOption } from "@/types/source-option-types";
import BaseSource from "./BaseSource";

class ImageSource extends BaseSource {
    id!: number
    src!: string
    width!: number
    height!: number
    image!: InstanceType<typeof Image>
    constructor(option: ImageSourceOption) {
        super(option)
        this.src = option.src
        this.id = BaseSource._id
        this.width = option.width
        this.height = option.height
        this.image = option.image
        BaseSource._id++
    }
}

export default ImageSource