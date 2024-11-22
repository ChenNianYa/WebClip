import { ConfigProvider, theme } from "antd"
import Config from "./components/Config"
import Control from "./components/Control"
import Preview from "./components/Preview"
import Source from "./components/Source"
import Track from "./components/Track"

function App() {

  return (
    <>
      <ConfigProvider theme={{ algorithm: theme.darkAlgorithm }}>
        <div className="flex h-full bg-primary-1 text-gray-300">
          {/* 素材区域 */}
          <div className="w-left border-r border-primary-border shrink-0">
            <Source />
          </div>
          {/* 工作台区域 */}
          <div className="flex-1 border-r border-primary-border flex flex-col">
            {/* 预览区域 */}
            <div className="flex-1">
              <Preview />
            </div>
            {/* 控制区域 */}
            <div className="border-t border-primary-border h-control">
              <Control />
            </div>
            {/* 轨道区域 */}
            <div className="border-t border-primary-border h-track">
              <Track />
            </div>
          </div>
          {/* 配置区 */}
          <div className="w-right shrink-0">
            <Config />
          </div>
        </div>
      </ConfigProvider>
    </>
  )
}

export default App
