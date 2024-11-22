import { Button, Image, Typography } from "antd"
import ImageSource from "../../../class/ImageSource"

interface ImageListProps {
    list: ImageSource[]
    onDelete: (id: number) => void
}
const ImageList = (props: ImageListProps) => {
    return (
        <>
            <div className="flex flex-wrap justify-between">
                {
                    props.list.map((item => {
                        return (
                            <div className="flex flex-col items-center mb-2" key={item.id}>
                                <div className="w-[120px] h-[200px] flex items-center">
                                    <Image src={item.src}></Image>
                                    {/* <img src={item.src} style={{ objectFit: 'contain' }} alt={item.name} /> */}
                                </div>
                                <Typography.Paragraph ellipsis={{ tooltip: item.name, rows: 1 }} className="w-[130px] text-xs">
                                    <b>名称</b>:&nbsp;&nbsp;{item.name}
                                </Typography.Paragraph>
                                <div className="flex justify-between w-full">
                                    <Button size="small" className="text-xs" color='primary' variant="solid">加入轨道</Button>
                                    <Button size="small" className="text-xs" color='danger' variant="solid" onClick={() => { props.onDelete(item.id) }}>删除</Button>
                                </div>
                            </div>
                        )
                    }))
                }
            </div>
        </>
    )
}
export default ImageList