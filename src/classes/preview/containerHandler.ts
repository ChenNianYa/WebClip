
import { CtrlOption, Point } from "@/types/utils";
import PreviewCanvasManager from "./PreviewCanvasManager";
import { updateCanvasElementKey } from "@/event-bus";
import { useEventBus } from "@vueuse/core";
const updateCanvasElementBus = useEventBus(updateCanvasElementKey)
// import CanvasManager from "./CanvasManager";
const curStyles: [CtrlOption, string][] = [
    ['tl', 'nw-resize'],
    ['tr', 'ne-resize'],
    ['bl', 'sw-resize'],
    ['br', 'se-resize'],
    ['rotate', 'alias'],
];
const containerHandler = (cvsManager: PreviewCanvasManager) => {
    const findIntersection = (point1: Point, point2: Point, startPoint: Point): Point => {
        const [x1, y1] = point1;
        const [x2, y2] = point2;
        const [x0, y0] = startPoint;
        // 处理两点重合的情况
        if (x1 === x2 && y1 === y2) {
            return point1;
        }
        // 计算两点确定的直线的斜率
        let lineSlope;
        if (x2 === x1) {
            // 两点横坐标相同，直线垂直于 x 轴
            return [x1, y0]
        } else if (y2 === y1) {
            return [x0, y2]
        } else {
            lineSlope = (y2 - y1) / (x2 - x1);
        }

        let perpendicularSlope;
        if (lineSlope === 0) {
            perpendicularSlope = Infinity;
        } else if (lineSlope === Infinity) {
            perpendicularSlope = 0;
        } else {
            perpendicularSlope = -1 / lineSlope;
        }

        // 计算垂直直线经过起始点的截距
        let perpendicularIntercept;
        if (perpendicularSlope === Infinity) {
            perpendicularIntercept = x0;
        } else if (perpendicularSlope === 0) {
            perpendicularIntercept = y0;
        } else {
            perpendicularIntercept = y0 - perpendicularSlope * x0;
        }

        let intersectionX, intersectionY;
        if (lineSlope === Infinity) {
            intersectionX = x1;
            intersectionY = perpendicularIntercept;
        } else if (perpendicularSlope === Infinity) {
            intersectionX = x0;
            intersectionY = lineSlope * x0 + y1 - lineSlope * x1;
        } else {
            intersectionX = (perpendicularIntercept - y1 + lineSlope * x1) / (lineSlope - perpendicularSlope);
            intersectionY = lineSlope * intersectionX + y1 - lineSlope * x1;
        }
        return [intersectionX, intersectionY];
    }
    const ctrlOptionMouseMove = (e: MouseEvent) => {
        if (!(cvsManager.activeElement && cvsManager.ctrlOption)) return
        const el = cvsManager.activeElement
        switch (cvsManager.ctrlOption) {
            case 'moving': {
                el.x += cvsManager.pxToRatio(e.movementX)
                el.y += cvsManager.pxToRatio(e.movementY)
                break;
            }
            case 'rotate': {
                const currentX = e.pageX - cvsManager.container.getBoundingClientRect().left;
                const currentY = e.pageY - cvsManager.container.getBoundingClientRect().top
                const rotateStartX = currentX - e.movementX
                const rotateStartY = currentY - e.movementY
                const [centerX, centerY] = el.getRectCenter().map(v => cvsManager.ratioToPx(v))
                // 两个向量
                const v1 = [rotateStartX - centerX, rotateStartY - centerY];
                const v2 = [currentX - centerX, currentY - centerY];
                // 公式的分子
                const numerator = v1[0] * v2[1] - v1[1] * v2[0];
                // 公式的分母
                const denominator = Math.sqrt(Math.pow(v1[0], 2) + Math.pow(v1[1], 2))
                    * Math.sqrt(Math.pow(v2[0], 2) + Math.pow(v2[1], 2));
                const sin = numerator / denominator;
                const deg = Math.asin(sin) * (180 / Math.PI)
                el.rotateDeg += deg
                break;
            }
            case 'tl': {
                const endPointX = cvsManager.pxToRatio(e.pageX - cvsManager.container.getBoundingClientRect().left);
                const endPointY = cvsManager.pxToRatio(e.pageY - cvsManager.container.getBoundingClientRect().top);
                const rectPoint = el.getRectPoint()
                const [x, y] = findIntersection(el.getRectCenter(), rectPoint[0], [endPointX, endPointY])
                const [intersectionX, intersectionY] = findIntersection(rectPoint[0], rectPoint[1], [x, y])
                const changeWidth = Math.sqrt((intersectionX - rectPoint[0][0]) ** 2 + (intersectionY - rectPoint[0][1]) ** 2)
                const changeHeight = Math.sqrt((intersectionX - x) ** 2 + (intersectionY - y) ** 2)
                const ratio = x < rectPoint[0][0] ? 1 : -1
                const width = el.width + ratio * changeWidth
                const height = el.height + ratio * changeHeight
                if (width < 0 || height < 0) return
                el.width = width
                el.height = height
                el.x += (-ratio * changeWidth)
                el.y += (-ratio * changeHeight)
                break;
            }
            case 'tr': {
                const endPointX = cvsManager.pxToRatio(e.pageX - cvsManager.container.getBoundingClientRect().left);
                const endPointY = cvsManager.pxToRatio(e.pageY - cvsManager.container.getBoundingClientRect().top);
                const rectPoint = el.getRectPoint()
                const [x, y] = findIntersection(el.getRectCenter(), rectPoint[1], [endPointX, endPointY])
                const [intersectionX, intersectionY] = findIntersection(rectPoint[0], rectPoint[1], [x, y])
                const changeWidth = Math.sqrt((intersectionX - rectPoint[1][0]) ** 2 + (intersectionY - rectPoint[1][1]) ** 2)
                const changeHeight = Math.sqrt((intersectionX - x) ** 2 + (intersectionY - y) ** 2)
                const ratio = x > rectPoint[1][0] ? 1 : -1
                const width = el.width + ratio * changeWidth
                const height = el.height + ratio * changeHeight
                if (width < 0 || height < 0) return
                el.width = width
                el.height = height
                el.y += (-ratio * changeHeight)
                break;
            }
            case 'bl': {
                const endPointX = cvsManager.pxToRatio(e.pageX - cvsManager.container.getBoundingClientRect().left);
                const endPointY = cvsManager.pxToRatio(e.pageY - cvsManager.container.getBoundingClientRect().top);
                const rectPoint = el.getRectPoint()
                const [x, y] = findIntersection(el.getRectCenter(), rectPoint[2], [endPointX, endPointY])
                const [intersectionX, intersectionY] = findIntersection(rectPoint[2], rectPoint[3], [x, y])
                const changeWidth = Math.sqrt((intersectionX - rectPoint[2][0]) ** 2 + (intersectionY - rectPoint[2][1]) ** 2)
                const changeHeight = Math.sqrt((intersectionX - x) ** 2 + (intersectionY - y) ** 2)
                const ratio = x < rectPoint[2][0] ? 1 : -1
                const width = el.width + ratio * changeWidth
                const height = el.height + ratio * changeHeight
                if (width < 0 || height < 0) return
                el.width = width
                el.height = height
                el.x += (-ratio * changeWidth)
                break;
            }
            case 'br': {
                const endPointX = cvsManager.pxToRatio(e.pageX - cvsManager.container.getBoundingClientRect().left);
                const endPointY = cvsManager.pxToRatio(e.pageY - cvsManager.container.getBoundingClientRect().top);
                const rectPoint = el.getRectPoint()
                const [x, y] = findIntersection(el.getRectCenter(), rectPoint[3], [endPointX, endPointY])
                const [intersectionX, intersectionY] = findIntersection(rectPoint[2], rectPoint[3], [x, y])
                const changeWidth = Math.sqrt((intersectionX - rectPoint[3][0]) ** 2 + (intersectionY - rectPoint[3][1]) ** 2)
                const changeHeight = Math.sqrt((intersectionX - x) ** 2 + (intersectionY - y) ** 2)
                const ratio = x > rectPoint[3][0] ? 1 : -1
                const width = el.width + ratio * changeWidth
                const height = el.height + ratio * changeHeight
                if (width < 0 || height < 0) return
                el.width = width
                el.height = height
                break;
            }
        }
        updateCanvasElementBus.emit({ cvsElement: cvsManager.activeElement })
        cvsManager.resetCtrlElPos()
        cvsManager.drawCanvas()
    }
    const curStyleMouseMove = (e: MouseEvent) => {
        // ctrl根据鼠标位置判断
        if (cvsManager.activeElement) {
            const ratioX = cvsManager.pxToRatio(e.pageX - cvsManager.container.getBoundingClientRect().left)
            const ratioY = cvsManager.pxToRatio(e.pageY - cvsManager.container.getBoundingClientRect().top)
            const rect = cvsManager.activeElement.getRectPoint()
            for (let i = 0; i < rect.length; i++) {
                const point = rect[i]
                if (ratioX >= point[0] - cvsManager.pxToRatio(5) && ratioX <= point[0] + cvsManager.pxToRatio(5)
                    && ratioY >= point[1] - cvsManager.pxToRatio(5) && ratioY <= point[1] + cvsManager.pxToRatio(5)
                ) {
                    cvsManager.container.style.cursor = curStyles[i][1]
                    return
                }
            }
            // 将角度转换为弧度
            const radians = (cvsManager.activeElement.rotateDeg * Math.PI) / 180;
            const [centerX, centerY] = cvsManager.activeElement.getRectCenter()
            const initPoint = [centerX, centerY - cvsManager.activeElement.height / 2 - cvsManager.pxToRatio(22.5)]
            // 先将点相对于圆心平移
            const relativeX = initPoint[0] - cvsManager.activeElement.getRectCenter()[0];
            const relativeY = initPoint[1] - cvsManager.activeElement.getRectCenter()[1];
            // 进行旋转操作
            const newX = relativeX * Math.cos(radians) - relativeY * Math.sin(radians) + centerX;
            const newY = relativeX * Math.sin(radians) + relativeY * Math.cos(radians) + centerY;

            // 再将新坐标平移回原来的坐标系
            if (ratioX >= newX - cvsManager.pxToRatio(7.5) && ratioX <= newX + cvsManager.pxToRatio(7.5)
                && ratioY >= newY - cvsManager.pxToRatio(7.5) && ratioY <= newY + cvsManager.pxToRatio(7.5)
            ) {
                cvsManager.container.style.cursor = 'alias'
                return
            }
        }
        // element上鼠标是move
        const el = cvsManager.findElement(e.pageX - cvsManager.container.getBoundingClientRect().left, e.pageY - cvsManager.container.getBoundingClientRect().top)
        if (el && el === cvsManager.activeElement) {
            cvsManager.container.style.cursor = 'move'
        } else {
            cvsManager.container.style.cursor = ''
        }
    }
    const mouseDown = (e: MouseEvent) => {
        window.addEventListener('mouseup', mouseUp)
        if (cvsManager.activeElement) {
            const ratioX = cvsManager.pxToRatio(e.pageX - cvsManager.container.getBoundingClientRect().left)
            const ratioY = cvsManager.pxToRatio(e.pageY - cvsManager.container.getBoundingClientRect().top)
            const rect = cvsManager.activeElement.getRectPoint()
            for (let i = 0; i < rect.length; i++) {
                const point = rect[i]
                if (ratioX >= point[0] - cvsManager.pxToRatio(5) && ratioX <= point[0] + cvsManager.pxToRatio(5)
                    && ratioY >= point[1] - cvsManager.pxToRatio(5) && ratioY <= point[1] + cvsManager.pxToRatio(5)
                ) {
                    cvsManager.ctrlOption = curStyles[i][0]
                    return
                }
            }
            // 将角度转换为弧度
            const radians = (cvsManager.activeElement.rotateDeg * Math.PI) / 180;
            const [centerX, centerY] = cvsManager.activeElement.getRectCenter()
            const initPoint = [centerX, centerY - cvsManager.activeElement.height / 2 - cvsManager.pxToRatio(22.5)]
            // 先将点相对于圆心平移
            const relativeX = initPoint[0] - cvsManager.activeElement.getRectCenter()[0];
            const relativeY = initPoint[1] - cvsManager.activeElement.getRectCenter()[1];
            // 进行旋转操作
            const newX = relativeX * Math.cos(radians) - relativeY * Math.sin(radians) + centerX;
            const newY = relativeX * Math.sin(radians) + relativeY * Math.cos(radians) + centerY;

            // 再将新坐标平移回原来的坐标系
            if (ratioX >= newX - cvsManager.pxToRatio(7.5) && ratioX <= newX + cvsManager.pxToRatio(7.5)
                && ratioY >= newY - cvsManager.pxToRatio(7.5) && ratioY <= newY + cvsManager.pxToRatio(7.5)
            ) {
                cvsManager.ctrlOption = 'rotate'
                return
            }
        }
        // 选中element的情况  后面优先级高 所以从后往前便利
        const el = cvsManager.findElement(e.pageX - cvsManager.container.getBoundingClientRect().left, e.pageY - cvsManager.container.getBoundingClientRect().top)
        if (el) {
            // 设置为拖拽状态
            cvsManager.ctrlOption = 'moving'
            cvsManager.activeElement = el
            cvsManager.resetCtrlElPos()
        } else {
            cvsManager.cancelActiveElement()
        }
    }
    const mouseUp = () => {
        window.removeEventListener('mouseup', mouseUp)
        cvsManager.ctrlOption = null
    }
    cvsManager.container.addEventListener('mousemove', curStyleMouseMove)
    cvsManager.container.addEventListener('mousemove', ctrlOptionMouseMove)
    cvsManager.container.addEventListener('mousedown', mouseDown)
}




export default containerHandler