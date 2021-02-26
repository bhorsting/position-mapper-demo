const getImageBase64 = async (imageBitmap: ImageBitmap, w: number, h: number) => {
  const canvas = new OffscreenCanvas(0, 0);
  const ctx = canvas.getContext('2d');
  canvas.width = w;
  canvas.height = h;
  ctx.drawImage(imageBitmap, 0, 0);
  return URL.createObjectURL(await canvas.convertToBlob());
};

onmessage = async (e) => {
  const { data } = e;
  const imageBase64Url = await getImageBase64(data.imageBitmap, data.w, data.h);
  (<any>postMessage)({ id: data.id, img: imageBase64Url });
};
