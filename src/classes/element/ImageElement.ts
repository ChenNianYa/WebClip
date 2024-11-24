import BaseElement from "./BaseElement";
import { ImageElementOption } from "@/types/element-option-types";
import ImageSource from "../source/ImageSource";

class ImageElement extends BaseElement {
    source!: ImageSource
    constructor(option: ImageElementOption) {
        super(option)
        this.source = option.source
    }
}

export default ImageElement