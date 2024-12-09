import { FFmpeg } from "@ffmpeg/ffmpeg"
import { fetchFile, toBlobURL } from "@ffmpeg/util";
import { LogEvent } from "node_modules/@ffmpeg/ffmpeg/dist/esm/types";
export const ffmpeg = new FFmpeg()
const baseURL = ' https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm'
// const videoURL = 'https://raw.githubusercontent.com/ffmpegwasm/testdata/master/video-15s.avi'
export const loadFFmpeg = async () => {
    ffmpeg.on('log', ({ message: msg }: LogEvent) => {
        console.log(msg);
    })
    ffmpeg.on('progress', ({ progress, time }) => {
        console.log(progress, time);

    })
    await ffmpeg.load({
        coreURL: await toBlobURL(import.meta.resolve('../../../public/ffmpeg/ffmpeg-core.js'), 'text/javascript'),
        wasmURL: await toBlobURL(import.meta.resolve('../../../public/ffmpeg/ffmpeg-core.wasm'), 'application/wasm'),
        workerURL: await toBlobURL(import.meta.resolve('../../../public/ffmpeg/ffmpeg-core.worker.js'), 'text/javascript'),
    })
    console.log();

    // console.log(ffmpeg);
    // await ffmpeg.writeFile('test.avi', await fetchFile(videoURL))
    // await ffmpeg.exec(['-i', 'test.avi', 'test.mp4'])
    // const data = await ffmpeg.readFile('test.mp4')
    // console.log(URL.createObjectURL(new Blob([(data as Uint8Array).buffer], { type: 'video/mp4' })));
}
