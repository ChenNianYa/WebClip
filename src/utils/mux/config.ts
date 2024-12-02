const framerate = 25
const oneSecondInMicrosecond = 1000000
const cts = oneSecondInMicrosecond / framerate
const MuxVideoConfig = {
    framerate: framerate,
    oneSecondInMicrosecond: oneSecondInMicrosecond,
    cts: cts
}

export default MuxVideoConfig