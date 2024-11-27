import { Point } from "@/types/utils"

class CanvasElement {
    id!: number
    width!: number
    height!: number
    initWidth!: number
    initHeight!: number
    x!: number
    y!: number
    rotateDeg!: number
    scale?: number
    element!: ImageBitmap
    constructor(id: number, element: ImageBitmap, width: number, height: number, x = 0, y = 0, rotateDeg = 0) {
        this.id = id
        this.element = element
        this.width = width
        this.height = height
        this.initWidth = width
        this.initHeight = height
        this.x = x
        this.y = y
        this.rotateDeg = rotateDeg
    }
    getRectPoint(): [Point, Point, Point, Point] {
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
    getRectCenter(): Point {
        return [this.x + this.width / 2, this.y + this.height / 2]
    }
}

export default CanvasElement