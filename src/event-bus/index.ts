// import { useEventBus } from '@vueuse/core'

// export const updateCanvasElementBus = useEventBus<string>(UPDATE_CANVAS_ELEMENT)

// fooKey.ts
import CanvasElement from '@/classes/preview/CanvasElement'
import type { EventBusKey } from '@vueuse/core'
const UPDATE_CANVAS_ELEMENT = 'canvas-element-update'
export const updateCanvasElementKey: EventBusKey<{ cvsElement: CanvasElement }> = Symbol(UPDATE_CANVAS_ELEMENT)