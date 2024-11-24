// const storageFrameImage = async (canvas: OffscreenCanvas, indexDb: IDBDatabase, storeName: string, index: number, timestamp: number) => {
//     const blob = await canvas.convertToBlob()
//     await new Promise((resolve) => {
//         const request = indexDb.transaction([storeName], 'readwrite').objectStore(storeName).add({ index, value: blob, timestamp })
//         request.onsuccess = (e) => { resolve(e) }
//     })
// }
onmessage = (e) => {
    console.log(e);
}