import { BaseElementOption } from "@/types/element-option-types"

class BaseElement {
    width!: number
    height!: number
    x!: number
    y!: number
    rotateDeg!: number
    scale!: number
    level!: number
    constructor({ width, height, x = 0, y = 0, rotateDeg = 0, scale = 1, level = 1 }: BaseElementOption) {
        this.width = width
        this.height = height
        this.x = x
        this.y = y
        this.rotateDeg = rotateDeg
        this.scale = scale
        this.level = level
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