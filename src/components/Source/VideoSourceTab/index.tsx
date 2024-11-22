import { useState } from "react";
import VideoSource from "../../../class/VideoSource";
import VideoList from "./VideoList";
import FileSelect from "../../FileSelect";

const Video = () => {
    const [list, setList] = useState<VideoSource[]>([])
    const getVideoSource = async (videoBlob: File) => {
        const video = document.createElement('video');
        video.setAttribute('preload', 'auto')
        const loadVideoPromise = new Promise((resolve) => {
            video.onloadeddata = (e) => {
                resolve(e);
            };
        });
        video.src = URL.createObjectURL(videoBlob);
        await loadVideoPromise;
        const canvas = document.createElement('canvas');
        canvas.height = video.videoHeight;
        canvas.width = video.videoWidth;
        const ctx = canvas.getContext('2d');
        if (!ctx) return
        ctx.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
        const canvasToUrl = new Promise<string>((resolve) => {
            canvas.toBlob((blob) => {
                if (blob) {
                    resolve(URL.createObjectURL(blob))
                }
            })
        })
        const cover = await canvasToUrl
        const videoSource = new VideoSource({
            name: videoBlob.name,
            file: videoBlob,
            size: videoBlob.size,
            duration: video.duration,
            src: URL.createObjectURL(videoBlob),
            width: video.videoWidth,
            height: video.videoHeight,
            cover,
        })
        list.push(videoSource)
        setList([...list])
        canvas.remove()
        video.remove()
    }
    const onDelete = (id: number | undefined) => {
        setList(list.filter(v => v.id !== id))
    }
    return (
        <>
            <div className="px-2">
                <FileSelect
                    onSelectFile={getVideoSource}
                    accept={{
                        'video/mp4': ['.mp4']
                    }}
                    text="选择需要上传的视频"
                />
                <VideoList list={list} onDelete={onDelete} />
            </div>
        </>
    )
}

export default Video