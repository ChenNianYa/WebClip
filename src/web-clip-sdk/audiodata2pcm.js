"use strict";
const __audiodata2pcm_formats = {
    u8: {
        arrayType: Uint8Array,
        lower: 0,
        upper: (1 << 8) - 1,
    },
    s16: {
        arrayType: Int16Array,
        lower: -((1 << 15) - 1),
        upper: (1 << 15) - 1,
    },
    s32: {
        arrayType: Int32Array,
        lower: -((1 << 31) - 1),
        upper: (1 << 31) - 1,
    },
    f32: {
        arrayType: Float32Array,
        lower: -1,
        upper: 1,
    },
};
function __audiodata2pcm_scaleValue(val, fromLower, fromUpper, toLower, toUpper) {
    if (fromUpper == toUpper && fromLower == toLower) {
        return val;
    }
    if (val < fromLower) {
        return toLower;
    }
    if (val > fromUpper) {
        return toUpper;
    }
    return (toLower +
        (val - fromLower) * ((toUpper - toLower) / (fromUpper - fromLower)));
}
function audiodata2pcm(frame) {
    // fixed sample rate to 16k
    const outputSampleRate = 16000;
    const outputLower = -((1 << 15) - 1);
    const outputUpper = -outputLower;
    // get frame info
    const sampleRate = frame.sampleRate;
    const numberOfChannels = frame.numberOfChannels;
    const numberOfFrames = frame.numberOfFrames;
    if (numberOfFrames === 0) {
        return new Int16Array(0);
    }
    // ignore planar since we are converting to mono
    const format = frame.format.split("-")[0];
    const config = __audiodata2pcm_formats[format];
    if (!config) {
        throw new Error(`Unsupported format: ${frame.format}`);
    }
    // convert to mono
    console.log(config);
    
    const buf = new config.arrayType(numberOfFrames);
    {
        if (numberOfChannels === 1) {
            // single channel
            frame.copyTo(buf, { planeIndex: 0 });
        }
        else if (numberOfChannels > 1) {
            // merge channels
            const subs = [];
            for (let i = 0; i < numberOfChannels; i++) {
                const sub = new config.arrayType(numberOfFrames);
                frame.copyTo(sub, { planeIndex: i });
                subs.push(sub);
            }
            for (let i = 0; i < numberOfFrames; i++) {
                buf[i] = 0;
                for (let j = 0; j < numberOfChannels; j++) {
                    buf[i] += subs[j][i] / numberOfChannels;
                }
            }
        }
        else {
            throw new Error(`Unsupported number of frames: ${frame.numberOfFrames}`);
        }
    }
    // value
    const outputNumberOfFrames = outputSampleRate === frame.sampleRate
        ? numberOfFrames
        : Math.floor((numberOfFrames * outputSampleRate) / sampleRate);
    const output = new Int16Array(outputNumberOfFrames);
    if (outputNumberOfFrames === numberOfFrames) {
        // same
        for (let i = 0; i < outputNumberOfFrames; i++) {
            output[i] = __audiodata2pcm_scaleValue(buf[i], config.lower, config.upper, outputLower, outputUpper);
        }
    }
    else if (outputNumberOfFrames > numberOfFrames) {
        // upscale
        for (let i = 0; i < outputNumberOfFrames; i++) {
            const j = Math.min(Math.round((i * sampleRate) / outputSampleRate), numberOfFrames - 1);
            output[i] = __audiodata2pcm_scaleValue(buf[j], config.lower, config.upper, outputLower, outputUpper);
        }
    }
    else {
        // downscale
        for (let i = 0; i < outputNumberOfFrames; i++) {
            const start = Math.round((i * sampleRate) / outputSampleRate);
            const end = Math.min(Math.round(((i + 1) * sampleRate) / outputSampleRate), numberOfFrames - 1);
            let val = 0;
            for (let j = start; j < end; j++) {
                val += buf[j];
            }
            if (start !== end) {
                val = val / (end - start);
            }
            output[i] = __audiodata2pcm_scaleValue(val, config.lower, config.upper, outputLower, outputUpper);
        }
    }
    return output;
}

export default audiodata2pcm