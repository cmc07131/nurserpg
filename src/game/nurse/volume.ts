/**
 * One procedural voxel volume per picture.
 * Y is up, so a horizontal slice is every voxel at one Y.
 * The camera is a fixed orthographic view looking along +Z from the near end.
 * Shading uses the 26-neighbour occupancy gradient and ambient occlusion.
 * Pictures are that projection. They are not a stack of unrelated drawings.
 */

export const MAT = {
  air: 0,
  skin: 1,
  hair: 2,
  scalp: 3,
  mucosa: 4,
  perineum: 5,
  anus: 6,
  baby: 7,
  glove: 8,
  gown: 9,
  cord: 10,
  umbilicus: 11,
  fluid: 12,
  blood: 13,
  metal: 14,
  drape: 15,
  paper: 16,
  glass: 17,
  wood: 18,
  cloth: 19,
  hat: 20,
  ink: 21,
  clock: 22,
  ampoule: 23,
  phone: 24,
  occiput: 25,
  cap: 26,
} as const

export type Mat = (typeof MAT)[keyof typeof MAT]

const BASE: Record<number, [number, number, number]> = {
  [MAT.skin]: [240, 194, 164],
  [MAT.hair]: [61, 44, 34],
  [MAT.scalp]: [224, 176, 160],
  [MAT.mucosa]: [196, 88, 104],
  [MAT.perineum]: [246, 220, 206],
  [MAT.anus]: [92, 56, 44],
  [MAT.baby]: [243, 196, 180],
  [MAT.glove]: [244, 236, 212],
  [MAT.gown]: [42, 98, 168],
  [MAT.cord]: [228, 233, 242],
  [MAT.umbilicus]: [138, 48, 64],
  [MAT.fluid]: [185, 226, 244],
  [MAT.blood]: [154, 16, 32],
  [MAT.metal]: [154, 164, 176],
  [MAT.drape]: [185, 205, 216],
  [MAT.paper]: [255, 250, 243],
  [MAT.glass]: [247, 247, 251],
  [MAT.wood]: [239, 230, 218],
  [MAT.cloth]: [106, 170, 136],
  [MAT.hat]: [224, 144, 168],
  [MAT.ink]: [26, 20, 16],
  [MAT.clock]: [232, 246, 228],
  [MAT.ampoule]: [230, 200, 74],
  [MAT.phone]: [32, 50, 74],
  [MAT.occiput]: [90, 62, 48],
  [MAT.cap]: [106, 61, 138],
}

export type Grid = {
  nx: number
  ny: number
  nz: number
  /** x + nx * (z + nz * y). One y is one horizontal slice. */
  vox: Uint8Array
}

export type View = {
  w: number
  h: number
  pix: number
  /** Screen x of the left edge of voxel x = 0. Screen y grows downward. */
  ox: number
  /** Screen y of the bottom edge of voxel y = 0. Voxel y grows up. */
  oy: number
}

export type Frame = {
  w: number
  h: number
  rgba: Uint8ClampedArray
  mat: Uint8Array
}

const CREAM: [number, number, number] = [255, 246, 234]

export function grid(nx: number, ny: number, nz: number): Grid {
  return { nx, ny, nz, vox: new Uint8Array(nx * ny * nz) }
}

function inside(g: Grid, x: number, y: number, z: number) {
  return x >= 0 && y >= 0 && z >= 0 && x < g.nx && y < g.ny && z < g.nz
}

export function at(g: Grid, x: number, y: number, z: number): number {
  x = Math.round(x)
  y = Math.round(y)
  z = Math.round(z)
  if (!inside(g, x, y, z)) return 0
  return g.vox[x + g.nx * (z + g.nz * y)] ?? 0
}

export function put(g: Grid, x: number, y: number, z: number, m: number) {
  x = Math.round(x)
  y = Math.round(y)
  z = Math.round(z)
  if (!inside(g, x, y, z) || m === MAT.air) return
  g.vox[x + g.nx * (z + g.nz * y)] = m
}

/** The horizontal slice at y, stored as x + nx * z. */
export function horizontalSlice(g: Grid, y: number): Uint8Array {
  const plane = new Uint8Array(g.nx * g.nz)
  y = Math.round(y)
  if (y < 0 || y >= g.ny) return plane
  for (let z = 0; z < g.nz; z++) {
    const src = g.nx * (z + g.nz * y)
    plane.set(g.vox.subarray(src, src + g.nx), z * g.nx)
  }
  return plane
}

export function ball(
  g: Grid,
  cx: number,
  cy: number,
  cz: number,
  rx: number,
  ry: number,
  rz: number,
  m: number,
  where?: (x: number, y: number, z: number) => boolean,
) {
  if (rx <= 0 || ry <= 0 || rz <= 0) return
  const x0 = Math.max(0, Math.floor(cx - rx))
  const x1 = Math.min(g.nx - 1, Math.ceil(cx + rx))
  const y0 = Math.max(0, Math.floor(cy - ry))
  const y1 = Math.min(g.ny - 1, Math.ceil(cy + ry))
  const z0 = Math.max(0, Math.floor(cz - rz))
  const z1 = Math.min(g.nz - 1, Math.ceil(cz + rz))
  for (let y = y0; y <= y1; y++) {
    const ny = (y - cy) / ry
    for (let z = z0; z <= z1; z++) {
      const nz = (z - cz) / rz
      for (let x = x0; x <= x1; x++) {
        const nx = (x - cx) / rx
        if (nx * nx + ny * ny + nz * nz > 1) continue
        if (where && !where(x, y, z)) continue
        g.vox[x + g.nx * (z + g.nz * y)] = m
      }
    }
  }
}

export function capsule(g: Grid, ax: number, ay: number, az: number, bx: number, by: number, bz: number, r: number, m: number) {
  const dx = bx - ax
  const dy = by - ay
  const dz = bz - az
  const len = Math.hypot(dx, dy, dz)
  const n = Math.max(1, Math.ceil(len))
  for (let i = 0; i <= n; i++) {
    const t = i / n
    ball(g, ax + dx * t, ay + dy * t, az + dz * t, r, r, r, m)
  }
}

export function box(g: Grid, x: number, y: number, z: number, w: number, h: number, d: number, m: number) {
  const x0 = Math.max(0, Math.floor(x))
  const y0 = Math.max(0, Math.floor(y))
  const z0 = Math.max(0, Math.floor(z))
  const x1 = Math.min(g.nx, Math.ceil(x + w))
  const y1 = Math.min(g.ny, Math.ceil(y + h))
  const z1 = Math.min(g.nz, Math.ceil(z + d))
  for (let yy = y0; yy < y1; yy++) for (let zz = z0; zz < z1; zz++) for (let xx = x0; xx < x1; xx++) g.vox[xx + g.nx * (zz + g.nz * yy)] = m
}

/** Screen point of a voxel-space point. */
export function project(view: View, x: number, y: number) {
  return {
    x: view.ox + (x + 0.5) * view.pix,
    y: view.oy - (y + 0.5) * view.pix,
  }
}

function shade(g: Grid, x: number, y: number, z: number, m: number, edge: boolean): [number, number, number] {
  let gx = 0
  let gy = 0
  let gz = 0
  let occ = 0
  for (let dz = -1; dz <= 1; dz++) {
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0 && dz === 0) continue
        if (at(g, x + dx, y + dy, z + dz)) {
          occ++
          gx += dx
          gy += dy
          gz += dz
        }
      }
    }
  }
  gx = -gx
  gy = -gy
  gz = -gz
  const len = Math.hypot(gx, gy, gz) || 1
  const lx = -0.45
  const ly = 0.78
  const lz = -0.45
  const ll = Math.hypot(lx, ly, lz)
  const nd = Math.max(0, (gx * lx + gy * ly + gz * lz) / (len * ll))
  const ao = occ / 26
  let light = (0.48 + 0.62 * nd) * (1 - ao * 0.5)
  if (edge) light *= 0.55
  const bands = [0.58, 0.74, 0.9, 1.05]
  let q = bands[0]
  let best = Infinity
  for (const band of bands) {
    const d = Math.abs(band - light)
    if (d < best) {
      best = d
      q = band
    }
  }
  const base = BASE[m] ?? CREAM
  return [
    Math.max(0, Math.min(255, Math.round((base[0] * q) / 8) * 8)),
    Math.max(0, Math.min(255, Math.round((base[1] * q) / 8) * 8)),
    Math.max(0, Math.min(255, Math.round((base[2] * q) / 8) * 8)),
  ]
}

/** Project true horizontal slices. Nearer Z wins. Each hit voxel becomes a pix-sized block. */
export function render(g: Grid, view: View): Frame {
  const { w, h, pix } = view
  const rgba = new Uint8ClampedArray(w * h * 4)
  const mat = new Uint8Array(w * h)
  for (let i = 0; i < w * h; i++) {
    rgba[i * 4] = CREAM[0]
    rgba[i * 4 + 1] = CREAM[1]
    rgba[i * 4 + 2] = CREAM[2]
    rgba[i * 4 + 3] = 255
  }
  const slices = Array.from({ length: g.ny }, (_, y) => horizontalSlice(g, y))
  const surfZ = new Int16Array(g.nx * g.ny)
  const surfM = new Uint8Array(g.nx * g.ny)
  surfZ.fill(-1)
  for (let y = 0; y < g.ny; y++) {
    const plane = slices[y] ?? new Uint8Array()
    for (let z = 0; z < g.nz; z++) {
      for (let x = 0; x < g.nx; x++) {
        const s = x + g.nx * y
        if (surfZ[s] !== -1) continue
        const m = plane[x + g.nx * z] ?? 0
        if (!m) continue
        surfZ[s] = z
        surfM[s] = m
      }
    }
  }
  for (let y = 0; y < g.ny; y++) {
    for (let x = 0; x < g.nx; x++) {
      const s = x + g.nx * y
      const m = surfM[s] ?? 0
      if (!m) continue
      const z = surfZ[s] ?? 0
      const left = x === 0 || (surfM[s - 1] ?? 0) === 0
      const up = y + 1 >= g.ny || (surfM[x + g.nx * (y + 1)] ?? 0) === 0
      const rgb = shade(g, x, y, z, m, left || up)
      const leftPx = view.ox + x * pix
      const top = view.oy - (y + 1) * pix
      const x0 = Math.max(0, Math.floor(leftPx))
      const y0 = Math.max(0, Math.floor(top))
      const x1 = Math.min(w, Math.ceil(leftPx + pix))
      const y1 = Math.min(h, Math.ceil(top + pix))
      for (let yy = y0; yy < y1; yy++) {
        for (let xx = x0; xx < x1; xx++) {
          const i = yy * w + xx
          rgba[i * 4] = rgb[0]
          rgba[i * 4 + 1] = rgb[1]
          rgba[i * 4 + 2] = rgb[2]
          rgba[i * 4 + 3] = 255
          mat[i] = m
        }
      }
    }
  }
  return { w, h, rgba, mat }
}

export function centroid(frame: Frame, materials: number[]) {
  const want = new Set(materials)
  let sx = 0
  let sy = 0
  let n = 0
  for (let i = 0; i < frame.mat.length; i++) {
    if (!want.has(frame.mat[i] ?? 0)) continue
    sx += i % frame.w
    sy += (i / frame.w) | 0
    n++
  }
  if (!n) return null
  return { x: sx / n, y: sy / n, n }
}

const pngCache = new Map<string, string>()
const frameCache = new Map<string, Frame>()

function crc32(buf: Uint8Array) {
  let c = 0xffffffff
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i] ?? 0
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1))
  }
  return (~c) >>> 0
}

function chunk(type: string, data: Uint8Array) {
  const out = new Uint8Array(12 + data.length)
  const view = new DataView(out.buffer)
  view.setUint32(0, data.length)
  out[4] = type.charCodeAt(0)
  out[5] = type.charCodeAt(1)
  out[6] = type.charCodeAt(2)
  out[7] = type.charCodeAt(3)
  out.set(data, 8)
  const crcBuf = out.subarray(4, 8 + data.length)
  view.setUint32(8 + data.length, crc32(crcBuf))
  return out
}

function zlibStore(raw: Uint8Array) {
  const parts: Uint8Array[] = [new Uint8Array([0x78, 0x01])]
  let i = 0
  while (i < raw.length) {
    const n = Math.min(65535, raw.length - i)
    const last = i + n >= raw.length
    const head = new Uint8Array(5)
    head[0] = last ? 1 : 0
    head[1] = n & 255
    head[2] = (n >> 8) & 255
    head[3] = ~n & 255
    head[4] = (~n >> 8) & 255
    parts.push(head, raw.subarray(i, i + n))
    i += n
  }
  let a = 1
  let b = 0
  for (let k = 0; k < raw.length; k++) {
    a = (a + (raw[k] ?? 0)) % 65521
    b = (b + a) % 65521
  }
  const ad = ((b << 16) | a) >>> 0
  parts.push(new Uint8Array([(ad >>> 24) & 255, (ad >>> 16) & 255, (ad >>> 8) & 255, ad & 255]))
  const len = parts.reduce((s, p) => s + p.length, 0)
  const out = new Uint8Array(len)
  let o = 0
  for (const p of parts) {
    out.set(p, o)
    o += p.length
  }
  return out
}

export function pngDataUrl(frame: Frame) {
  const { w, h, rgba } = frame
  const raw = new Uint8Array((w * 4 + 1) * h)
  for (let y = 0; y < h; y++) {
    const row = y * (w * 4 + 1)
    raw[row] = 0
    raw.set(rgba.subarray(y * w * 4, (y + 1) * w * 4), row + 1)
  }
  const ihdr = new Uint8Array(13)
  const dv = new DataView(ihdr.buffer)
  dv.setUint32(0, w)
  dv.setUint32(4, h)
  ihdr[8] = 8
  ihdr[9] = 6
  const sig = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10])
  const idat = zlibStore(raw)
  const parts = [sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', new Uint8Array())]
  const len = parts.reduce((s, p) => s + p.length, 0)
  const png = new Uint8Array(len)
  let o = 0
  for (const p of parts) {
    png.set(p, o)
    o += p.length
  }
  let bin = ''
  const step = 0x8000
  for (let i = 0; i < png.length; i += step) bin += String.fromCharCode(...png.subarray(i, i + step))
  const b64 = typeof Buffer !== 'undefined' ? Buffer.from(png).toString('base64') : btoa(bin)
  return `data:image/png;base64,${b64}`
}

function head(g: Grid, cx: number, cy: number, cz: number, r: number, skin: number = MAT.skin) {
  ball(g, cx, cy, cz, r, r * 1.08, r * 0.92, skin)
  ball(g, cx, cy + r * 0.35, cz + r * 0.05, r * 1.02, r * 0.62, r * 0.9, MAT.hair, (_x, y, z) => y >= cy + r * 0.05 && z >= cz - r * 0.15)
  const ez = Math.max(0, cz - r * 0.92)
  const er = Math.max(0.8, r * 0.16)
  ball(g, cx - r * 0.32, cy + r * 0.08, ez, er, er * 1.05, 0.45, MAT.ink)
  ball(g, cx + r * 0.32, cy + r * 0.08, ez, er, er * 1.05, 0.45, MAT.ink)
  ball(g, cx - r * 0.36, cy + r * 0.16, ez, 0.4, 0.4, 0.35, MAT.glass)
  ball(g, cx + r * 0.28, cy + r * 0.16, ez, 0.4, 0.4, 0.35, MAT.glass)
  ball(g, cx, cy - r * 0.02, ez, r * 0.09, r * 0.16, 0.4, skin)
  ball(g, cx, cy - r * 0.38, ez, r * 0.28, Math.max(0.45, r * 0.08), 0.4, MAT.mucosa)
}

function glove(g: Grid, x: number, y: number, z: number, s = 1) {
  ball(g, x, y, z, 3.2 * s, 2.3 * s, 1.4 * s, MAT.glove)
  const fingers = [-3.1, -1.05, 1.05, 3.1]
  const lens = [3.8, 4.8, 4.4, 3.2]
  for (let i = 0; i < fingers.length; i++) {
    const dx = fingers[i] ?? 0
    const len = lens[i] ?? 3
    capsule(g, x + dx * s, y + s, z, x + dx * s, y + (1 + len) * s, z - 0.2, 0.95 * s, MAT.glove)
  }
  capsule(g, x - 2.6 * s, y - 0.2 * s, z - 0.2, x - 5 * s, y + 2.2 * s, z - 0.4, 1.05 * s, MAT.glove)
}

function baby(g: Grid, x: number, y: number, z: number, hat = false, back = false) {
  ball(g, x, y + 6, z, 7.2, 6.4, 5.5, MAT.baby)
  if (hat) ball(g, x, y + 10, z, 6.4, 3.2, 5, MAT.hat, (_x, yy) => yy >= y + 8)
  else ball(g, x, y + 10, z, 6.2, 3, 5, MAT.hair, (_x, yy) => yy >= y + 8)
  ball(g, x, y - 2, z, 5.2, 4.6, 4, MAT.baby)
  capsule(g, x - 4, y + 4, z, x - 9, y + 1, z + 1, 1.7, MAT.baby)
  capsule(g, x + 4, y + 4, z, x + 9, y + 1, z + 1, 1.7, MAT.baby)
  capsule(g, x - 2, y - 5, z, x - 7, y - 9, z, 1.8, MAT.baby)
  capsule(g, x + 2, y - 5, z, x + 7, y - 9, z, 1.8, MAT.baby)
  ball(g, x - 8, y - 9, z, 2.2, 1.5, 1.2, MAT.baby)
  ball(g, x + 8, y - 9, z, 2.2, 1.5, 1.2, MAT.baby)
  if (!back) {
    const ez = Math.max(0, z - 5.2)
    ball(g, x - 2.4, y + 6.6, ez, 1.15, 1.25, 0.5, MAT.ink)
    ball(g, x + 2.4, y + 6.6, ez, 1.15, 1.25, 0.5, MAT.ink)
    ball(g, x - 2.8, y + 7.1, ez, 0.4, 0.4, 0.3, MAT.glass)
    ball(g, x + 2, y + 7.1, ez, 0.4, 0.4, 0.3, MAT.glass)
    ball(g, x, y + 5.2, ez, 0.55, 0.8, 0.4, MAT.baby)
    ball(g, x, y + 3.6, ez, 1.5, 0.45, 0.4, MAT.mucosa)
  }
}

function clock(g: Grid, x: number, y: number, z: number) {
  ball(g, x, y, z, 6, 6, 1.2, MAT.ink)
  ball(g, x, y, z - 0.8, 4.6, 4.6, 1, MAT.clock)
  box(g, x - 0.4, y, z - 1.4, 0.8, 3.2, 0.6, MAT.ink)
  box(g, x, y - 0.4, z - 1.4, 2.6, 0.8, 0.6, MAT.ink)
}

function bottle(g: Grid, x: number, y: number, z: number, cap: number) {
  ball(g, x, y, z, 2.4, 4.2, 2.2, MAT.glass)
  box(g, x - 1.2, y + 3.2, z - 1, 2.4, 2.2, 2, cap)
}

function adult(g: Grid, x: number, footY: number, z: number, tall: number, gown: boolean) {
  const cloth = gown ? MAT.gown : MAT.cloth
  const hip = footY + tall * 0.42
  const shoulder = footY + tall * 0.72
  const hr = tall * 0.14
  capsule(g, x - tall * 0.08, footY, z, x - tall * 0.06, hip, z, tall * 0.05, cloth)
  capsule(g, x + tall * 0.08, footY, z, x + tall * 0.06, hip, z, tall * 0.05, cloth)
  ball(g, x, (hip + shoulder) / 2, z, tall * 0.16, tall * 0.18, tall * 0.09, cloth)
  capsule(g, x, shoulder - tall * 0.02, z, x, shoulder + tall * 0.06, z, tall * 0.045, MAT.skin)
  head(g, x, shoulder + tall * 0.16, z, hr)
  capsule(g, x - tall * 0.12, shoulder, z, x - tall * 0.24, hip + tall * 0.02, z + 0.4, tall * 0.045, cloth)
  capsule(g, x + tall * 0.12, shoulder, z, x + tall * 0.24, hip + tall * 0.02, z + 0.4, tall * 0.045, cloth)
  if (gown) {
    glove(g, x - tall * 0.24, hip, z, 0.7)
    glove(g, x + tall * 0.24, hip, z, 0.7)
  }
}

export const LOOK_VIEW: View = { w: 240, h: 206, pix: 2, ox: 0, oy: 169 }

export function buildLook(): Grid {
  const g = grid(120, 88, 36)
  box(g, 2, 8, 16, 116, 70, 18, MAT.drape)
  ball(g, 22, 38, 20, 16, 26, 12, MAT.skin)
  ball(g, 97, 38, 20, 16, 26, 12, MAT.skin)
  ball(g, 14, 62, 18, 6, 4, 5, MAT.skin)
  ball(g, 105, 62, 18, 6, 4, 5, MAT.skin)
  ball(g, 59.5, 58, 22, 14, 8, 8, MAT.skin)
  ball(g, 48, 36, 8, 3.2, 7, 3, MAT.mucosa)
  ball(g, 71, 36, 8, 3.2, 7, 3, MAT.mucosa)
  ball(g, 59.5, 45, 5, 9, 9, 8, MAT.occiput)
  ball(g, 59.5, 40, 3.2, 5, 3.2, 3, MAT.scalp)
  ball(g, 59.5, 22, 4, 16, 6, 4, MAT.perineum)
  ball(g, 59.5, 16, 6, 6, 3, 3, MAT.skin)
  ball(g, 59.5, 6, 3, 4.2, 4, 3, MAT.anus)
  glove(g, 30, 34, 2, 1.1)
  capsule(g, 28, 32, 3, 8, 48, 4, 2.6, MAT.gown)
  glove(g, 90, 30, 2, 1.1)
  capsule(g, 92, 28, 3, 114, 16, 4, 2.6, MAT.gown)
  ball(g, 108, 20, 4, 5, 3, 2.2, MAT.paper)
  return g
}

export const ASK_VIEW: View = { w: 240, h: 196, pix: 2, ox: 0, oy: 180 }

export function buildAsk(): Grid {
  const g = grid(124, 90, 28)
  box(g, 0, 10, 14, 124, 62, 12, MAT.drape)
  ball(g, 14, 62, 8, 8, 4, 3, MAT.paper)
  head(g, 22, 57, 4, 7.5)
  capsule(g, 28, 52, 5, 38, 50, 5, 2.6, MAT.skin)
  ball(g, 46, 50, 6, 8, 6, 5, MAT.skin)
  ball(g, 62, 48, 5, 13, 10, 7, MAT.skin)
  ball(g, 62, 48, 2.2, 1.3, 1.3, 0.8, MAT.mucosa)
  ball(g, 80, 46, 8, 7, 5, 4, MAT.drape)
  capsule(g, 50, 54, 4, 94, 54, 3, 2.4, MAT.skin)
  glove(g, 100, 55, 2, 1)
  ball(g, 40, 27, 3, 10, 3.2, 2.2, MAT.fluid)
  ball(g, 59.5, 26.5, 3, 14, 3.4, 2.2, MAT.fluid)
  ball(g, 76, 25, 3, 8, 2.6, 2, MAT.fluid)
  return g
}

export const PREPARE_VIEW: View = { w: 240, h: 250, pix: 2, ox: 0, oy: 246 }

export function buildPrepare(dressed: boolean, openSet: boolean): Grid {
  const g = grid(124, 126, 24)
  box(g, 42, 78, 8, 72, 52, 8, MAT.wood)
  adult(g, 20, 68, 6, 52, dressed)
  if (openSet) {
    ball(g, 60, 100, 4, 10, 5, 2, MAT.metal)
    capsule(g, 54, 96, 3, 54, 108, 3, 0.7, MAT.metal)
    capsule(g, 66, 96, 3, 66, 108, 3, 0.7, MAT.metal)
    capsule(g, 60, 94, 3, 60, 104, 3, 0.5, MAT.metal)
  } else {
    ball(g, 60, 100, 4, 8, 4, 2.2, MAT.cloth)
  }
  ball(g, 98, 98, 3, 3, 6, 2.2, MAT.ampoule)
  ball(g, 50, 69, 3, 2.4, 6, 2.2, MAT.fluid)
  ball(g, 64, 68, 3, 8, 4, 1.8, MAT.paper)
  bottle(g, 86, 69, 3, MAT.cap)
  bottle(g, 98, 69, 3, MAT.blood)
  box(g, 12, 40, 3, 16, 18, 2.4, MAT.paper)
  head(g, 66, 45, 3, 5.2)
  capsule(g, 66, 40, 4, 80, 36, 4, 3.2, MAT.gown)
  ball(g, 80, 36, 4, 10, 6, 4, MAT.gown)
  glove(g, 96, 40, 2.5, 0.75)
  capsule(g, 40, 6, 3, 40, 20, 3, 0.8, MAT.metal)
  capsule(g, 50, 6, 3, 50, 20, 3, 0.8, MAT.metal)
  head(g, 59, 12, 3, 4.4)
  return g
}

export const BIRTH_VIEW: View = { w: 240, h: 176, pix: 2, ox: 0, oy: 168 }

export function buildBirth(step: number): Grid {
  const g = grid(120, 80, 28)
  if (step <= 0) {
    box(g, 2, 8, 8, 112, 60, 10, MAT.drape)
    clock(g, 16, 48, 3)
    ball(g, 86, 40, 8, 8, 12, 6, MAT.skin)
    ball(g, 86, 28, 4, 8, 8, 6, MAT.occiput)
    glove(g, 68, 34, 2, 1.15)
    glove(g, 104, 32, 2, 1.15)
    return g
  }
  if (step === 1) {
    ball(g, 60, 28, 10, 36, 14, 8, MAT.skin)
    ball(g, 60, 40, 5, 6, 5, 4, MAT.baby)
    ball(g, 60, 48, 4, 8, 10, 6, MAT.baby)
    ball(g, 60, 58, 3, 8, 6, 5, MAT.hair, (_x, y) => y >= 54)
    ball(g, 54, 50, 1.4, 1.2, 1.3, 0.6, MAT.ink)
    ball(g, 66, 50, 1.4, 1.2, 1.3, 0.6, MAT.ink)
    ball(g, 60, 46, 1.2, 1.6, 0.5, 0.4, MAT.mucosa)
    capsule(g, 52, 26.5, 2, 96, 26.5, 2, 2.4, MAT.cord)
    ball(g, 54, 26.5, 1.6, 2.4, 2.4, 1.2, MAT.mucosa)
    return g
  }
  if (step === 2) {
    ball(g, 18, 40, 10, 12, 18, 8, MAT.skin)
    ball(g, 100, 40, 10, 12, 18, 8, MAT.skin)
    ball(g, 60, 48, 6, 8, 6, 4, MAT.mucosa)
    ball(g, 60, 24, 3, 16, 4, 2.2, MAT.paper)
    ball(g, 60, 16.5, 2, 14, 3.4, 2.2, MAT.fluid)
    return g
  }
  if (step === 3) {
    ball(g, 60, 24, 12, 46, 18, 8, MAT.skin)
    head(g, 86, 46, 5, 5.5)
    baby(g, 59, 32, 4)
    glove(g, 26, 40, 2, 1.1)
    glove(g, 80, 30, 2, 1.05)
    return g
  }
  if (step === 4) {
    box(g, 8, 16, 6, 100, 52, 6, MAT.skin)
    baby(g, 60, 36, 3, false, true)
    return g
  }
  ball(g, 68, 24, 12, 42, 16, 8, MAT.skin)
  head(g, 20, 46, 4, 6)
  capsule(g, 24, 40, 5, 44, 30, 6, 4, MAT.skin)
  baby(g, 74, 34, 3, true)
  return g
}

export const CLAMP_VIEW: View = { w: 240, h: 120, pix: 1, ox: 0, oy: 82.5 }

export function buildClamp(gap: { from: number; to: number } | null): Grid {
  const g = grid(240, 70, 16)
  ball(g, 18, 24, 5, 10, 12, 6, MAT.baby)
  head(g, 16, 46, 2, 10, MAT.baby)
  const end = 214
  if (!gap) capsule(g, 52, 20, 2, end, 20, 2, 5, MAT.cord)
  else {
    const from = Math.max(56, Math.min(end - 8, Math.round(gap.from)))
    const to = Math.max(from + 4, Math.min(end, Math.round(gap.to)))
    capsule(g, 52, 20, 2, from, 20, 2, 5, MAT.cord)
    capsule(g, to, 20, 2, end, 20, 2, 5, MAT.cord)
    ball(g, (from + to) / 2, 20, 1, 2.2, 2.2, 1.2, MAT.blood)
  }
  ball(g, 47.5, 20, 1, 4.2, 4.2, 2.4, MAT.umbilicus)
  ball(g, 224, 22, 5, 14, 18, 8, MAT.skin)
  ball(g, 226, 22, 2, 5, 8, 4, MAT.mucosa)
  return g
}

export const DRUG_VIEW: View = { w: 240, h: 200, pix: 2, ox: 0, oy: 196 }

export function buildDrug(palpated: boolean, early: boolean): Grid {
  const g = grid(124, 100, 24)
  ball(g, 78, 62, 8, 28, 20, 10, MAT.skin)
  ball(g, 78, 64, 5, palpated ? 12 : 16, palpated ? 8 : 10, 6, palpated ? MAT.mucosa : MAT.skin)
  ball(g, 84, 82, 4, 6, 5, 4, MAT.baby)
  ball(g, 84, 86, 3, 4, 2.2, 3, MAT.hat)
  if (palpated) {
    glove(g, 56, 66, 2, 1.05)
    glove(g, 100, 66, 2, 1.05)
  }
  ball(g, 20, 52, 6, 12, 16, 8, early ? MAT.blood : MAT.skin)
  capsule(g, 8, 48, 3, 32, 48, 3, 1.5, MAT.glass)
  clock(g, 16, 14, 3)
  bottle(g, 52, 14, 3, MAT.cap)
  bottle(g, 96, 14, 3, MAT.blood)
  return g
}

export const MOTHER_VIEW: View = { w: 240, h: 268, pix: 2, ox: 0, oy: 264 }

export function buildMother(gush: boolean, longer: boolean, firm: boolean): Grid {
  const g = grid(124, 132, 24)
  box(g, 2, 48, 10, 70, 70, 8, MAT.drape)
  ball(g, 14, 78, 8, 8, 18, 6, MAT.skin)
  ball(g, 66, 78, 8, 6, 18, 6, MAT.skin)
  ball(g, 50, 86, 5, 6, 6, 4, MAT.mucosa)
  const cordEnd = longer ? 52 : 62
  capsule(g, 54, 82, 3, 54, cordEnd, 3, 1.8, MAT.cord)
  ball(g, 58, 84, 2.2, gush ? 3.4 : 2, gush ? 4 : 2, 1.6, MAT.blood)
  ball(g, 96, 100, 6, 12, 8, 5, MAT.skin)
  ball(g, 96, firm ? 108 : 104, 3, firm ? 6 : 8, firm ? 5 : 6, 4, firm ? MAT.mucosa : MAT.skin)
  ball(g, 96, 74, 6, 9, 8, 2.2, MAT.cord)
  ball(g, 90, 76, 2.4, 1.8, 1.8, 1.2, MAT.blood)
  ball(g, 102, 76, 2.4, 1.8, 1.8, 1.2, MAT.blood)
  ball(g, 96, 70, 2.4, 2.4, 2.4, 1.2, MAT.mucosa)
  ball(g, 20, 36, 4, 8, 6, 4, MAT.drape)
  ball(g, 20, 34, 2.5, 4, 3, 2.4, MAT.blood)
  ball(g, 58, 36, 4, 10, 4, 2.2, MAT.paper)
  ball(g, 96, 36, 4, 12, 5, 3, MAT.cloth)
  ball(g, 20, 12, 3, 6, 5, 3, MAT.glass)
  ball(g, 20, 8, 2.2, 4, 2.2, 2.2, MAT.blood)
  capsule(g, 52, 14, 3, 88, 14, 3, 3, MAT.skin)
  glove(g, 96, 16, 2, 1)
  return g
}

export const HANDOVER_VIEW: View = { w: 240, h: 220, pix: 2, ox: 0, oy: 216 }

export function buildHandover(): Grid {
  const g = grid(124, 110, 24)
  box(g, 6, 78, 6, 64, 14, 6, MAT.drape)
  head(g, 18, 94, 3, 5.5)
  capsule(g, 24, 88, 5, 50, 84, 6, 4.2, MAT.skin)
  baby(g, 44, 88, 3, true)
  box(g, 86, 78, 3, 14, 24, 3, MAT.phone)
  box(g, 6, 34, 4, 48, 16, 4, MAT.wood)
  bottle(g, 14, 38, 3, MAT.cap)
  bottle(g, 26, 38, 3, MAT.blood)
  ball(g, 42, 38, 3, 4.2, 3.2, 2.2, MAT.drape)
  box(g, 62, 34, 3, 20, 16, 2.4, MAT.paper)
  box(g, 88, 34, 3, 18, 16, 2.4, MAT.paper)
  head(g, 16, 18, 3, 4.6)
  ball(g, 22, 10, 4, 8, 3.4, 3, MAT.gown)
  box(g, 40, 8, 3, 7, 12, 2.2, MAT.phone)
  return g
}

export type Scene =
  | { kind: 'look' }
  | { kind: 'ask' }
  | { kind: 'prepare'; dressed: boolean; openSet: boolean }
  | { kind: 'birth'; step: number }
  | { kind: 'clamp'; from: number | null; to: number | null }
  | { kind: 'drug'; palpated: boolean; early: boolean }
  | { kind: 'mother'; gush: boolean; longer: boolean; firm: boolean }
  | { kind: 'handover' }

export function sceneFrame(scene: Scene): Frame {
  switch (scene.kind) {
    case 'look':
      return render(buildLook(), LOOK_VIEW)
    case 'ask':
      return render(buildAsk(), ASK_VIEW)
    case 'prepare':
      return render(buildPrepare(scene.dressed, scene.openSet), PREPARE_VIEW)
    case 'birth':
      return render(buildBirth(scene.step), BIRTH_VIEW)
    case 'clamp':
      return render(buildClamp(scene.from === null || scene.to === null ? null : { from: scene.from, to: scene.to }), CLAMP_VIEW)
    case 'drug':
      return render(buildDrug(scene.palpated, scene.early), DRUG_VIEW)
    case 'mother':
      return render(buildMother(scene.gush, scene.longer, scene.firm), MOTHER_VIEW)
    case 'handover':
      return render(buildHandover(), HANDOVER_VIEW)
  }
}

export function sceneKey(scene: Scene) {
  switch (scene.kind) {
    case 'look':
    case 'ask':
    case 'handover':
      return scene.kind
    case 'prepare':
      return `prepare:${scene.dressed ? 1 : 0}${scene.openSet ? 1 : 0}`
    case 'birth':
      return `birth:${scene.step}`
    case 'clamp':
      return `clamp:${scene.from ?? 'x'}:${scene.to ?? 'x'}`
    case 'drug':
      return `drug:${scene.palpated ? 1 : 0}${scene.early ? 1 : 0}`
    case 'mother':
      return `mother:${scene.gush ? 1 : 0}${scene.longer ? 1 : 0}${scene.firm ? 1 : 0}`
  }
}

export function frameFor(scene: Scene) {
  const key = sceneKey(scene)
  const hit = frameCache.get(key)
  if (hit) return hit
  const frame = sceneFrame(scene)
  frameCache.set(key, frame)
  return frame
}

export function picture(scene: Scene) {
  const key = sceneKey(scene)
  const hit = pngCache.get(key)
  if (hit) return hit
  const url = pngDataUrl(frameFor(scene))
  pngCache.set(key, url)
  return url
}
