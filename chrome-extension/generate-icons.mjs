// Generate simple PNG icons for the Chrome extension
import { writeFileSync } from "fs";
import { deflateSync } from "zlib";

function createPNG(size) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr.writeUInt8(8, 8);   // bit depth
  ihdr.writeUInt8(6, 9);   // RGBA
  ihdr.writeUInt8(0, 10);
  ihdr.writeUInt8(0, 11);
  ihdr.writeUInt8(0, 12);
  const ihdrChunk = makeChunk("IHDR", ihdr);

  // Generate pixel data
  const radius = Math.round(size * 0.22);
  const rawData = Buffer.alloc((size * 4 + 1) * size);

  for (let y = 0; y < size; y++) {
    rawData[y * (size * 4 + 1)] = 0; // filter: none
    for (let x = 0; x < size; x++) {
      const offset = y * (size * 4 + 1) + 1 + x * 4;
      const inside = isInsideRoundedRect(x, y, size, size, radius);
      const icon = isUsbIcon(x, y, size);

      if (inside) {
        if (icon) {
          rawData[offset] = 255; rawData[offset+1] = 255;
          rawData[offset+2] = 255; rawData[offset+3] = 255;
        } else {
          rawData[offset] = 17; rawData[offset+1] = 17;
          rawData[offset+2] = 17; rawData[offset+3] = 255;
        }
      }
      // else: stays 0 (transparent)
    }
  }

  const compressed = deflateSync(rawData);
  const idatChunk = makeChunk("IDAT", compressed);
  const iendChunk = makeChunk("IEND", Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function isInsideRoundedRect(x, y, w, h, r) {
  if (x < r && y < r) return dist(x, y, r, r) <= r;
  if (x >= w-r && y < r) return dist(x, y, w-r-1, r) <= r;
  if (x < r && y >= h-r) return dist(x, y, r, h-r-1) <= r;
  if (x >= w-r && y >= h-r) return dist(x, y, w-r-1, h-r-1) <= r;
  return true;
}

function dist(x1, y1, x2, y2) {
  return Math.sqrt((x1-x2)**2 + (y1-y2)**2);
}

function isUsbIcon(x, y, size) {
  const cx = size / 2;
  const lw = Math.max(1, Math.round(size / 10));
  const hlw = lw / 2;
  const top = size * 0.2;
  const bot = size * 0.8;

  // Vertical line
  if (Math.abs(x-cx) < hlw && y >= top && y <= bot) return true;
  // Top circle
  if (dist(x, y, cx, top) <= lw * 0.8) return true;
  // Bottom bar
  if (Math.abs(y-bot) < hlw && Math.abs(x-cx) < size*0.15) return true;
  // Left branch
  const by = size*0.45, bl = cx-size*0.2;
  if (Math.abs(x-bl) < hlw && y >= by && y <= bot*0.85) return true;
  if (dist(x, y, bl, by) <= lw*0.8) return true;
  // Right branch
  const br = cx+size*0.2;
  if (Math.abs(x-br) < hlw && y >= by && y <= bot*0.85) return true;
  if (dist(x, y, br, by) <= lw*0.8) return true;

  return false;
}

function makeChunk(type, data) {
  const tb = Buffer.from(type, "ascii");
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const crcData = Buffer.concat([tb, data]);
  const c = crc32(crcData);
  const cb = Buffer.alloc(4);
  cb.writeUInt32BE(c, 0);
  return Buffer.concat([len, tb, data, cb]);
}

function crc32(data) {
  let c = 0xffffffff;
  for (let i = 0; i < data.length; i++) c = (c>>>8) ^ crcTable[(c^data[i])&0xff];
  return (c^0xffffffff)>>>0;
}

const crcTable = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let j = 0; j < 8; j++) c = c&1 ? 0xedb88320^(c>>>1) : c>>>1;
  crcTable[i] = c;
}

for (const size of [16, 48, 128]) {
  const png = createPNG(size);
  writeFileSync(`icons/icon-${size}.png`, png);
  console.log(`Created icons/icon-${size}.png (${png.length} bytes)`);
}
