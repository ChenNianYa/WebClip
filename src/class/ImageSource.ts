import { ImageSourceOption } from "../types/class-option-types";
import BaseSource from "./BaseSource";

class ImageSource extends BaseSource {
    id!: number
    src!: string
    width!: number
    height!: number
    constructor(option: ImageSourceOption) {
        super(option)
        this.src = option.src
        this.id = BaseSource._id
        this.width = option.width
        this.height = option.height
        BaseSource._id++
    }
}

export default ImageSource