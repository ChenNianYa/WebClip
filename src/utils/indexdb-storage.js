
const storeName = 'frames'
const indexDbStorageFrame = 'storage-frame'
const indexDbGetFrame = 'get-frame'
let indexDb
const getIndexDb = async () => {
    if(indexDb) return indexDb
    const videoFramesIndexDbDeleteRequest = new Promise((resolve) => {
        const request = indexedDB.deleteDatabase("video-frames");
        request.onsuccess = resolve
        request.onerror = resolve
    })
    await videoFramesIndexDbDeleteRequest
    const videoFramesIndexDbRequest = indexedDB.open("video-frames", 1);
    const indexDbSuccessPromise = new Promise((resolve) => {
        videoFramesIndexDbRequest.onsuccess = () => {
            console.log('success');
            
            resolve(videoFramesIndexDbRequest.result)
        }
    })
    const indexDbUpgradePromise = new Promise((resolve) => {
        videoFramesIndexDbRequest.onupgradeneeded = () => {
            console.log('uupgrade');
            
            const store = videoFramesIndexDbRequest.result.createObjectStore(storeName, {
                keyPath: 'index',
            })
            store.createIndex('index', 'index', { unique: true })
            resolve(videoFramesIndexDbRequest.result)
        }
    })

    await Promise.all([indexDbSuccessPromise,indexDbUpgradePromise])
    return videoFramesIndexDbRequest.result
}
const addVideoFrameToIndexDb = async (index, value, timestamp) => {
    const request = indexDb.transaction([storeName], 'readwrite').objectStore(storeName).add({ index, value, timestamp })
    request.onsuccess = () => {
        value.close()
        postMessage({type:indexDbStorageFrame,index})
    }
}
const getVideoFrameFromIndexDb = (index) => {
    const request = indexDb.transaction([storeName]).objectStore(storeName).get(index);
    request.onsuccess = async () => {
        if (request.result) {
            const ibmp = request.result.value
            const videoFrame = new VideoFrame(ibmp, { timestamp: request.result.timestamp })
            ibmp.close()
            postMessage({type:indexDbGetFrame,index,value:videoFrame})
        }
    };
}
onmessage = async (e) => {
    indexDb=await getIndexDb()
    if (e.data.type === indexDbStorageFrame) {
        const { index, value, timestamp } = e.data
        addVideoFrameToIndexDb(index, value, timestamp)
    }
    if (e.data.type === indexDbGetFrame) {
        console.log(e);
        
        const { index } = e.data
        getVideoFrameFromIndexDb(index)
    }
}