
import { CtrlOption, PreviewCanvasManagerOption } from "@/types/utils";
import CanvasElement from "./CanvasElement";
import containerHandler from "./containerHandler";
// canvas 管理器
class PreviewCanvasManager {
    elements: CanvasElement[] = [] // 元素
    activeElement: CanvasElement | undefined = undefined // 激活的元素
    offScreenCvs!: OffscreenCanvas // canvasdom
    container!: HTMLDivElement
    containerRect!: DOMRect
    canvas!: HTMLCanvasElement
    axis!: HTMLDivElement // 轴线dom
    ctrl!: HTMLDivElement // 控制器dom  控制缩放 旋转
    width!: number // 原始尺寸  分辨率尺寸
    height!: number // 原始尺寸 分辨率尺寸
    ctrlOption: CtrlOption = null
    // canvasRatio!: number // 样式尺寸/原始尺寸
    constructor(option: PreviewCanvasManagerOption) {
        const { width, height, canvas, axis, ctrl, container } = option
        canvas.width = width
        canvas.height = height
        this.canvas = canvas
        this.offScreenCvs = canvas.transferControlToOffscreen()
        this.container = container
        this.containerRect = container.getBoundingClientRect()
        this.axis = axis
        this.ctrl = ctrl
        this.width = width
        this.height = height
        containerHandler(this)
    }
    addElement(element: CanvasElement) {
        this.elements.push(element)
        this.drawCanvas()
    }
    drawCanvas() {
        const ctx = this.offScreenCvs.getContext('2d')
        if (!ctx) return
        ctx.clearRect(0, 0, this.offScreenCvs.width, this.offScreenCvs.height)
        for (const element of this.elements) {
            ctx.save();
            const centerX = element.width / 2 + element.x
            const centerY = element.y + element.height / 2
            ctx.translate(centerX, centerY)
            ctx.rotate(element.rotateDeg * Math.PI / 180);
            ctx.translate(-centerX, -centerY)
            ctx.drawImage(element.element, element.x, element.y, element.width, element.height)
            // element.element.close()
            ctx.restore();
        }
    }
    reset() {
        this.elements = []
        const ctx = this.offScreenCvs.getContext('2d')
        if (!ctx) return
        ctx.clearRect(0, 0, this.offScreenCvs.width, this.offScreenCvs.height)
    }
    isPointInRect = (point: [number, number], rect: [[number, number], [number, number], [number, number], [number, number]]): boolean => {
        const [touchX, touchY] = point;
        // 长方形四个点的坐标
        const [[x1, y1], [x2, y2], [x3, y3], [x4, y4]] = rect;
        // 四个向量
        const v1 = [x1 - touchX, y1 - touchY];
        const v2 = [x2 - touchX, y2 - touchY];
        const v3 = [x3 - touchX, y3 - touchY];
        const v4 = [x4 - touchX, y4 - touchY];
        if (
            (v1[0] * v2[1] - v2[0] * v1[1]) > 0
            && (v2[0] * v4[1] - v4[0] * v2[1]) > 0
            && (v4[0] * v3[1] - v3[0] * v4[1]) > 0
            && (v3[0] * v1[1] - v1[0] * v3[1]) > 0
        ) {
            return true;
        }
        return false;
    }
    cancelActiveElement() {
        this.activeElement = undefined
        this.ctrl.style.cssText = ''
    }
    resetCtrlElPos() {
        if (!this.activeElement) return
        Object.assign(this.ctrl.style, {
            width: `${this.ratioToPx(this.activeElement.width)}px`,
            height: `${this.ratioToPx(this.activeElement.height)}px`,
            transform: `translateX(${this.ratioToPx(this.activeElement.x)}px) translateY(${this.ratioToPx(this.activeElement.y)}px) rotateZ(${this.activeElement.rotateDeg}deg)`,
            display: 'block'
        })
    }
    pxToRatio(x: number): number {
        return x / this.canvasRatio
    }
    ratioToPx(x: number): number {
        return x * this.canvasRatio
    }
    getRotateAngle(centerPoint: [number, number], startPoint: [number, number], endPoint: [number, number]) {
        const [centerX, centerY] = centerPoint;
        const [rotateStartX, rotateStartY] = startPoint;
        const [touchX, touchY] = endPoint;
        // 两个向量
        const v1 = [rotateStartX - centerX, rotateStartY - centerY];
        const v2 = [touchX - centerX, touchY - centerY];
        // 公式的分子
        const numerator = v1[0] * v2[1] - v1[1] * v2[0];
        // 公式的分母
        const denominator = Math.sqrt(Math.pow(v1[0], 2) + Math.pow(v1[1], 2))
            * Math.sqrt(Math.pow(v2[0], 2) + Math.pow(v2[1], 2));
        const sin = numerator / denominator;
        return Math.asin(sin);
    }
    findElement(x: number, y: number) {
        for (let i = this.elements.length - 1; i >= 0; i--) {
            if (this.isPointInRect([this.pxToRatio(x), this.pxToRatio(y)], this.elements[i].getRectPoint())) {
                return this.elements[i]
            }
        }
        return null
    }
    get canvasRatio() {
        return this.canvas.getBoundingClientRect().width / this.canvas.width
    }
}

export default PreviewCanvasManager