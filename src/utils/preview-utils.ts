import BaseElement from "@/classes/element/BaseElement";

export const elementInPreview = (element: BaseElement, time: number) => {
    return time >= element.startTime && time <= (element.startTime + element.duration)
}