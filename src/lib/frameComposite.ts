/* Render an order's "what the customer designed" image on a canvas:
   the cropped photo, composited into the chosen frame (frame mode) or on
   its own (print mode). Returns a JPEG data-URL ready for /api/upload-artwork.
   Mirrors the on-screen preview math in ImageCropper / FramePreview. */
import { PhotoSlot, FrameStyle, slotSize, cssFilter } from '../components/customizerData';

const CREAM = '#f3eee3';

const loadImg = (src: string) =>
  new Promise<HTMLImageElement>((res, rej) => {
    const im = new Image();
    im.onload = () => res(im);
    im.onerror = () => rej(new Error('Could not load image for the order preview'));
    im.src = src;
  });

/* draw the slot's photo cropped to its print ratio onto a fresh canvas */
async function renderCrop(slot: PhotoSlot, long = 1000): Promise<HTMLCanvasElement> {
  const img = await loadImg(slot.src);
  const s = slotSize(slot);
  const printAspect = s.w / s.h;
  const imgAspect = img.naturalWidth / img.naturalHeight;
  const W = printAspect >= 1 ? long : Math.round(long * printAspect);
  const H = printAspect >= 1 ? Math.round(long / printAspect) : long;
  const cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  const ctx = cv.getContext('2d')!;
  ctx.imageSmoothingQuality = 'high';
  const c = slot.crop;
  const filter = cssFilter(c);

  if (c.mode === 'free') {
    const { naturalWidth: pw, naturalHeight: ph } = img;
    ctx.filter = filter;
    ctx.drawImage(img, (c.box.x / 100) * pw, (c.box.y / 100) * ph, (c.box.w / 100) * pw, (c.box.h / 100) * ph, 0, 0, W, H);
  } else if (c.mode === 'fit') {
    ctx.fillStyle = CREAM; ctx.fillRect(0, 0, W, H);
    ctx.filter = filter;
    const dw = imgAspect > printAspect ? W : H * imgAspect;
    const dh = imgAspect > printAspect ? W / imgAspect : H;
    ctx.drawImage(img, (W - dw) / 2, (H - dh) / 2, dw, dh);
  } else {
    // fill / center — cover the print box, honouring zoom + pan
    ctx.filter = filter;
    const dh = imgAspect > printAspect ? H * c.zoom : (W * c.zoom) / imgAspect;
    const dw = imgAspect > printAspect ? dh * imgAspect : W * c.zoom;
    ctx.drawImage(img, (W - dw) / 2 + dw * (c.ox / 100), (H - dh) / 2 + dh * (c.oy / 100), dw, dh);
  }
  return cv;
}

const matPadFrac = (border: string) => (border === 'No Border' ? 0 : border === 'White Border' ? 0.05 : 0.09);

/* The order image. With a frame, the cropped photo is composited into the
   frame's opening (cover, clipped) exactly like the live preview; without a
   frame it's just the cropped photo. Returns a JPEG data-URL. */
export async function renderOrderImage(slot: PhotoSlot, frame: FrameStyle | null, border = 'No Border'): Promise<string> {
  const crop = await renderCrop(slot);
  if (!frame?.frameImg || !frame.opening) return crop.toDataURL('image/jpeg', 0.85);

  const fimg = await loadImg(frame.frameImg);
  const FW = Math.min(1000, fimg.naturalWidth);
  const FH = Math.round(fimg.naturalHeight * (FW / fimg.naturalWidth));
  const cv = document.createElement('canvas');
  cv.width = FW; cv.height = FH;
  const ctx = cv.getContext('2d')!;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(fimg, 0, 0, FW, FH);

  const o = frame.opening;
  let ox = (o.x / 100) * FW, oy = (o.y / 100) * FH, ow = (o.w / 100) * FW, oh = (o.h / 100) * FH;
  const pad = matPadFrac(border) * ow;
  ox += pad; oy += pad; ow -= 2 * pad; oh -= 2 * pad;

  ctx.save();
  ctx.beginPath(); ctx.rect(ox, oy, ow, oh); ctx.clip();
  // fill/center/free cover the opening; "fit" contains the whole crop (matted)
  const contain = slot.crop.mode === 'fit';
  const scale = contain ? Math.min(ow / crop.width, oh / crop.height) : Math.max(ow / crop.width, oh / crop.height);
  const dw = crop.width * scale, dh = crop.height * scale;
  ctx.drawImage(crop, ox + (ow - dw) / 2, oy + (oh - dh) / 2, dw, dh);
  ctx.restore();

  return cv.toDataURL('image/jpeg', 0.85);
}
