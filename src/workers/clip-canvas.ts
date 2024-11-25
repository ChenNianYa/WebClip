
const storeName = 'frames'
const getIndexDb = async () => {
    const videoFramesIndexDbDeleteRequest = new Promise((resolve) => {
        const request = window.indexedDB.deleteDatabase("video-frames");
        request.onsuccess = resolve
        request.onerror = resolve
    })
    await videoFramesIndexDbDeleteRequest
    const videoFramesIndexDbRequest = window.indexedDB.open("video-frames", 1);
    const indexDbPromise = new Promise<IDBDatabase>((resolve) => {
        videoFramesIndexDbRequest.onsuccess = () => {
            resolve(videoFramesIndexDbRequest.result)
        }
        videoFramesIndexDbRequest.onupgradeneeded = () => {
            const store = videoFramesIndexDbRequest.result.createObjectStore(storeName, {
                keyPath: 'index',
            })
            store.createIndex('index', 'index', { unique: true })
            resolve(videoFramesIndexDbRequest.result)
        }
    })
    const indexDb = await indexDbPromise
    return indexDb
}
const addVideoFrameToIndexDb = async (index: number, value: ImageBitmap, timestamp: number) => {
    const indexDb = await getIndexDb()
    const request = indexDb.transaction([storeName], 'readwrite').objectStore(storeName).add({ index, value, timestamp })
    request.onsuccess = () => {
        console.log(index);
        value.close()
        postMessage({ type: 'storage', index })
    }
}
onmessage = async (e) => {
    console.log(e);

    if (e.data.type === 'storage') {
        const { index, value, timestamp } = e.data
        addVideoFrameToIndexDb(index, value, timestamp)
    }

}