import { Button, Image, List, Typography } from "antd"
import VideoSource from "../../../class/VideoSource"

interface VideoListProps {
    list: VideoSource[]
    onDelete: (id: number) => void
}
const VideoList = (props: VideoListProps) => {
    const secondsToTimeFormat = (seconds: number): string => {
        if (seconds < 0) return '00:00:00';
        let totalSeconds = Math.floor(seconds);
        const hours = Math.floor(totalSeconds / 3600);
        totalSeconds %= 3600;
        const minutes = Math.floor(totalSeconds / 60);
        const remainingSeconds = totalSeconds % 60;
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    const formatBytesToUnit = (bytes: number): string => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
    }
    return (
        <>
            <List
                className="text-xs"
                itemLayout="horizontal"
                dataSource={props.list}
                renderItem={(item) => (
                    <List.Item>
                        <div className="flex">
                            <div className="w-[150px] flex-1 shrink-0">
                                <Image width={150} src={item.cover} preview={{
                                    destroyOnClose: true,
                                    imageRender: () => (
                                        <video
                                            muted
                                            width="50%"
                                            controls
                                            src={item.src}
                                        />
                                    ),
                                    toolbarRender: () => null,
                                }} />
                            </div>
                            <div className="ml-2 flex flex-col justify-between">
                                <div>
                                    <Typography.Paragraph ellipsis={{ tooltip: item.name, rows: 1 }} className="w-[130px] text-xs" style={{ marginBottom: '2px' }}>
                                        <b>名称</b>:&nbsp;&nbsp;{item.name}
                                    </Typography.Paragraph>
                                    <Typography.Paragraph className="w-[130px] text-xs" style={{ marginBottom: '2px' }}>
                                        <b>时长</b>:&nbsp;&nbsp;{secondsToTimeFormat(item.duration)}
                                    </Typography.Paragraph>
                                    <Typography.Paragraph className="w-[130px] text-xs" style={{ marginBottom: '2px' }}>
                                        <b>大小</b>:&nbsp;&nbsp;{formatBytesToUnit(item.size)}
                                    </Typography.Paragraph>
                                </div>
                                <div className="flex justify-between">
                                    <Button size="small" className="text-xs" color='primary' variant="solid">加入轨道</Button>
                                    <Button size="small" className="text-xs" color='danger' variant="solid" onClick={() => { props.onDelete(item.id) }}>删除</Button>
                                </div>
                            </div>
                        </div>
                    </List.Item>
                )}
            />
        </>
    )
}
export default VideoList