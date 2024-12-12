import LibAV from "libav.js";
export let libav: LibAV.LibAV
export const loadLibav = async () => {
    libav = await LibAV.LibAV({
        base: '/public/libav/dist',
        variant: 'webcodecs-avf',
        toImport: '/public/libav/dist/libav-6.4.7.1-webcodecs-avf.wasm.js'
    });
}
