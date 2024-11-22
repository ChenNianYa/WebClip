import { BaseSourceOption } from "@/types/source-option-types"

class BaseSource {
    static _id = 1
    name!: string
    file!: Blob
    size!: number
    constructor(option: BaseSourceOption) {
        this.name = option.name
        this.file = option.file
        this.size = option.size
    }
}
export default BaseSource