import { Tabs } from 'antd';
import type { TabsProps } from 'antd';
import VideoSourceTab from './VideoSourceTab';
import ImageSourceTab from './ImageSourceTab';
const Source = () => {
    const items: TabsProps['items'] = [
        {
            key: '1',
            label: '视频',
            children: VideoSourceTab(),
        },
        {
            key: '2',
            label: '图片',
            children: ImageSourceTab(),
        },
        {
            key: '3',
            label: '花字',
            children: 'Content of Tab Pane 3',
        },
        {
            key: '4',
            label: '音频',
            children: 'Content of Tab Pane 3',
        },
    ];
    return (
        <>
            <Tabs defaultActiveKey="1" items={items} centered />
        </>
    )
}
export default Source