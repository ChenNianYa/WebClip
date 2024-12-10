import { textDefaultConfig, TextDefaultConfigType } from "./config"

const render = (paramConfig: TextDefaultConfigType = {}) => {
    const config = { ...textDefaultConfig, ...paramConfig }
    return `<svg xmlns="http://www.w3.org/2000/svg" version="1.1">
  <text
    x="10"
    y="60"
    fill="#FFBCD7"
    font-size="${config.size}"
    font-weight="900"
    stroke="#FF3F89"
    stroke-width="4"
    stroke-linejoin="round"
    font-family="${config.family}"
    paint-order="stroke"
  >
    ${config.text}
  </text>
</svg>`
}

export default {
    id: 1,
    render: render
}