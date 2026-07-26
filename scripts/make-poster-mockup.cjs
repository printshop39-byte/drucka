/* Generates public/mockups/poster-front-white.png — a blank poster mockup.

   Drawn rather than photographed: there is no poster photo from Qikink, and
   the editor was falling back to an unrelated lifestyle shot with a print box
   over it. A clean drawn mockup is honest about what it is and, unlike the
   stock photo, has a poster face we can state exactly.

   Sized 924x1100 = exactly 42:50, the crop every Drucka mockup is displayed
   at, so no object-cover crop shifts the print area. Palette sampled from the
   existing frame / canvas / mug mockups so it sits with them.

   Poster face: left 22%, top 15%, width 56%, height 66.5% (1:root2, A2). */

const zlib = require("zlib");
const fs = require("fs");
const path = require("path");

const W = 924, H = 1100;

/* face, in fractions of the image */
const FACE = { x: 0.22, y: 0.15, w: 0.56 };
const A2 = 1 / Math.SQRT2;                       // 0.7071 w:h
const faceX0 = Math.round(FACE.x * W);
const faceW = Math.round(FACE.w * W);
const faceH = Math.round(faceW / A2);
const faceY0 = Math.round(FACE.y * H);

const lerp = (a, b, t) => a + (b - a) * t;
const clamp255 = (v) => Math.max(0, Math.min(255, Math.round(v)));

/* wall: warm taupe at the top easing to cream, matching the other mockups */
const TOP = [191, 178, 155];
const BOT = [239, 235, 223];

const px = Buffer.alloc(W * H * 4);
const put = (x, y, r, g, b) => {
  const i = (y * W + x) * 4;
  px[i] = clamp255(r); px[i + 1] = clamp255(g); px[i + 2] = clamp255(b); px[i + 3] = 255;
};

const cx = W / 2, cy = H * 0.42;
const maxD = Math.hypot(W, H) / 2;

for (let y = 0; y < H; y++) {
  const t = y / (H - 1);
  for (let x = 0; x < W; x++) {
    /* vertical gradient + a soft light behind the poster + gentle vignette */
    const d = Math.hypot(x - cx, y - cy) / maxD;
    const light = 10 * (1 - Math.min(1, d * 1.25));
    const vign = -14 * Math.pow(Math.min(1, d), 2.2);
    put(x, y, lerp(TOP[0], BOT[0], t) + light + vign,
      lerp(TOP[1], BOT[1], t) + light + vign,
      lerp(TOP[2], BOT[2], t) + light + vign);
  }
}

/* drop shadow — offset down/right, falls off with distance from the face */
const SH_DX = 10, SH_DY = 16, SH_BLUR = 34;
for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    const sx = x - SH_DX, sy = y - SH_DY;
    const dx = Math.max(faceX0 - sx, sx - (faceX0 + faceW), 0);
    const dy = Math.max(faceY0 - sy, sy - (faceY0 + faceH), 0);
    const dist = Math.hypot(dx, dy);
    if (dist >= SH_BLUR) continue;
    const a = 0.30 * Math.pow(1 - dist / SH_BLUR, 2);
    const i = (y * W + x) * 4;
    px[i] = clamp255(px[i] * (1 - a));
    px[i + 1] = clamp255(px[i + 1] * (1 - a));
    px[i + 2] = clamp255(px[i + 2] * (1 - a));
  }
}

/* the poster itself — near-white paper, very slightly shaded top to bottom so
   it reads as paper rather than a flat rectangle */
/* A 6-level shade over 700-odd rows quantises into visible bands, so the
   ramp is gentle and dithered by a fraction of a level to break them up. */
const BAYER = [[0, 2], [3, 1]];
for (let y = faceY0; y < faceY0 + faceH; y++) {
  const t = (y - faceY0) / faceH;
  for (let x = faceX0; x < faceX0 + faceW; x++) {
    const edge = Math.min(x - faceX0, faceX0 + faceW - 1 - x) < 1 ? -6 : 0;
    const dither = BAYER[y & 1][x & 1] / 4 - 0.375;
    const v = lerp(252, 248, t) + edge + dither;
    put(x, y, v, v, v - 1);
  }
}

/* ── minimal PNG encoder (filter 2 "Up" — a gradient compresses to almost
   nothing when each row is stored as its difference from the row above) ── */
const raw = Buffer.alloc(H * (1 + W * 3));
for (let y = 0; y < H; y++) {
  const o = y * (1 + W * 3);
  raw[o] = 2;
  for (let x = 0; x < W; x++) {
    const s = (y * W + x) * 4, u = ((y - 1) * W + x) * 4, d = o + 1 + x * 3;
    for (let ch = 0; ch < 3; ch++) {
      const up = y === 0 ? 0 : px[u + ch];
      raw[d + ch] = (px[s + ch] - up) & 0xff;
    }
  }
}

const CRC = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return (buf) => {
    let c = -1;
    for (let i = 0; i < buf.length; i++) c = t[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
    return (c ^ -1) >>> 0;
  };
})();

const chunk = (type, data) => {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(CRC(td));
  return Buffer.concat([len, td, crc]);
};

const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4);
ihdr[8] = 8; ihdr[9] = 2; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;

const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  chunk("IHDR", ihdr),
  chunk("IDAT", zlib.deflateSync(raw, { level: 9 })),
  chunk("IEND", Buffer.alloc(0)),
]);

const out = path.resolve(process.argv[2]);
fs.writeFileSync(out, png);
console.log(JSON.stringify({
  file: out,
  size: `${W}x${H}`,
  aspect: +(W / H).toFixed(4),
  kb: Math.round(png.length / 1024),
  facePct: {
    left: +((faceX0 / W) * 100).toFixed(2),
    top: +((faceY0 / H) * 100).toFixed(2),
    width: +((faceW / W) * 100).toFixed(2),
    height: +((faceH / H) * 100).toFixed(2),
  },
  faceAspect: +(faceW / faceH).toFixed(4),
}, null, 1));
