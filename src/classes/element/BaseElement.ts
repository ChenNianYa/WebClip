import { BaseElementOption } from "@/types/element-option-types"

class BaseElement {
    // 从0开始可能存在 在判断时候当false了
    static _id = 1
    id!: number
    width!: number
    height!: number
    x!: number
    y!: number
    rotateDeg!: number
    scale!: number
    level!: number
    duration!: number
    startTime!: number
    constructor({ width, height, x = 0, y = 0, rotateDeg = 0, scale = 1, level = 1, duration = 5 }: BaseElementOption) {
        this.width = width
        this.height = height
        this.x = x
        this.y = y
        this.rotateDeg = rotateDeg
        this.scale = scale
        this.level = level
        this.duration = duration
        this.id = BaseElement._id++
        this.startTime = 0;
    }
    getRectPoint(): [[number, number], [number, number], [number, number], [number, number]] {
        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2;
        const angleInRadians = (this.rotateDeg * Math.PI) / 180;
        return [
            [
                centerX + (-this.width / 2) * Math.cos(angleInRadians) - (-this.height / 2) * Math.sin(angleInRadians),
                centerY + (-this.width / 2) * Math.sin(angleInRadians) + (-this.height / 2) * Math.cos(angleInRadians),
            ],
            [
                centerX + (this.width / 2) * Math.cos(angleInRadians) - (-this.height / 2) * Math.sin(angleInRadians),
                centerY + (this.width / 2) * Math.sin(angleInRadians) + (-this.height / 2) * Math.cos(angleInRadians),
            ],
            [
                centerX + (-this.width / 2) * Math.cos(angleInRadians) - (this.height / 2) * Math.sin(angleInRadians),
                centerY + (-this.width / 2) * Math.sin(angleInRadians) + (this.height / 2) * Math.cos(angleInRadians),
            ],
            [
                centerX + (this.width / 2) * Math.cos(angleInRadians) - (this.height / 2) * Math.sin(angleInRadians),
                centerY + (this.width / 2) * Math.sin(angleInRadians) + (this.height / 2) * Math.cos(angleInRadians),
            ]
        ];
    }
    getRectCenter(): [number, number] {
        return [this.x + this.width / 2, this.y + this.height / 2]
    }
}

export default BaseElement