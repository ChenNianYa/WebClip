import { UploadOutlined } from "@ant-design/icons"
import { Button } from "antd"
interface ImageSelectProps {
    onSelectFile: (e: File) => void
    accept: { [key in string]: string[] },
    text: string
}
const FileSelect = (props: ImageSelectProps) => {
    const chooseFile = async () => {
        try {
            // @ts-ignore
            const [fileHandle] = await window.showOpenFilePicker({
                types: [
                    {
                        accept: props.accept,
                    },
                ],
            });
            if (fileHandle) {
                const file = await fileHandle.getFile()
                props.onSelectFile(file)
            }
        } catch (error) {
            // @ts-ignore
            if (error.name === "AbortError") {
                console.log("用户取消了文件选择。");
            } else {
                console.error("出现错误：", error);
            }
        }
    }
    return (
        <>
            <Button icon={<UploadOutlined />} onClick={chooseFile} block size="large">{props.text}</Button>
        </>
    )
}
export default FileSelect