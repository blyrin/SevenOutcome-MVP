import * as THREE from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader.js'
import { VignetteShader } from 'three/examples/jsm/shaders/VignetteShader.js'
import { G, hasFlag, setFlag } from './state.js'
import { $, clamp, dist2, rand } from './utils.js'

export const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' })
renderer.setSize(innerWidth, innerHeight)
renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap
renderer.outputEncoding = THREE.sRGBEncoding
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.toneMappingExposure = 1.08
$('app').prepend(renderer.domElement)

export const scene = new THREE.Scene()
scene.background = new THREE.Color(0x090e16)
scene.fog = new THREE.Fog(0x090e16, 30, 96)

export const camera = new THREE.PerspectiveCamera(46, innerWidth / innerHeight, .1, 200)

export const composer = new EffectComposer(renderer)
const renderPass = new RenderPass(scene, camera)
composer.addPass(renderPass)

const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(innerWidth, innerHeight),
  0.46,
  0.35,
  0.78,
)
composer.addPass(bloomPass)

const vignettePass = new ShaderPass(VignetteShader)
vignettePass.uniforms.offset.value = 1.02
vignettePass.uniforms.darkness.value = 1.16
composer.addPass(vignettePass)

const fxaaPass = new ShaderPass(FXAAShader)
const pr = renderer.getPixelRatio()
fxaaPass.material.uniforms.resolution.value.set(1 / (innerWidth * pr), 1 / (innerHeight * pr))
composer.addPass(fxaaPass)

addEventListener('resize', () => {
  const w = innerWidth, h = innerHeight
  camera.aspect = w / h
  camera.updateProjectionMatrix()
  renderer.setSize(w, h)
  composer.setSize(w, h)
  const ratio = renderer.getPixelRatio()
  fxaaPass.material.uniforms.resolution.value.set(1 / (w * ratio), 1 / (h * ratio))
})

scene.add(new THREE.HemisphereLight(0x384d72, 0x161310, .54))
scene.add(new THREE.AmbientLight(0x1a2232, 0.28))
const moon = new THREE.DirectionalLight(0xa4bcd8, .86)
moon.position.set(-24, 34, 14)
moon.castShadow = true
moon.shadow.mapSize.set(2048, 2048)
moon.shadow.bias = -0.0003
moon.shadow.normalBias = 0.02
const sc = moon.shadow.camera
sc.left = -46
sc.right = 46
sc.top = 46
sc.bottom = -46
sc.near = 1
sc.far = 120
scene.add(moon)

const rim = new THREE.DirectionalLight(0x3e5276, 0.32)
rim.position.set(26, 18, -22)
scene.add(rim)

export function canvasTex(w, h, fn) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  fn(c.getContext('2d'), w, h)
  const t = new THREE.CanvasTexture(c)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  return t
}

const groundTex = canvasTex(512, 512, (x, w, h) => {
  x.fillStyle = '#14171d'
  x.fillRect(0, 0, w, h)
  const cols = 12, rows = 12
  const cw = w / cols, rh = h / rows
  for (let r = 0; r < rows; r++) {
    const shift = (r % 2) * (cw * 0.45)
    for (let c = -1; c <= cols + 1; c++) {
      const bx = c * cw + shift + rand(-2, 2)
      const by = r * rh + rand(-2, 2)
      const bw = cw - 4 + rand(-2, 2)
      const bh = rh - 4 + rand(-2, 2)
      const tone = 36 + Math.floor(rand(-8, 10))
      const toneB = tone + Math.floor(rand(2, 8))
      x.fillStyle = `rgb(${tone - 4}, ${tone}, ${toneB})`
      x.beginPath()
      x.roundRect ? x.roundRect(bx, by, bw, bh, 3) : x.rect(bx, by, bw, bh)
      x.fill()
      x.fillStyle = 'rgba(255, 255, 255, 0.07)'
      x.fillRect(bx + 1, by + 1, bw - 2, 2)
      x.fillRect(bx + 1, by + 1, 2, bh - 2)
      x.fillStyle = 'rgba(0, 0, 0, 0.28)'
      x.fillRect(bx + 1, by + bh - 2, bw - 2, 2)
      x.fillRect(bx + bw - 2, by + 1, 2, bh - 2)
    }
  }
  for (let i = 0; i < 900; i++) {
    const s = rand(1, 3)
    x.fillStyle = Math.random() < 0.2 ? 'rgba(22, 38, 25, 0.35)' : 'rgba(0, 0, 0, 0.18)'
    x.fillRect(rand(0, w), rand(0, h), s, s)
  }
  for (let i = 0; i < 7; i++) {
    const px = rand(20, w - 20), py = rand(20, h - 20)
    const gr = x.createRadialGradient(px, py, 2, px, py, rand(12, 26))
    gr.addColorStop(0, 'rgba(10, 14, 18, 0.45)')
    gr.addColorStop(1, 'rgba(10, 14, 18, 0)')
    x.fillStyle = gr
    x.beginPath()
    x.arc(px, py, 26, 0, Math.PI * 2)
    x.fill()
  }
})
groundTex.repeat.set(16, 11)

const groundRoughTex = canvasTex(256, 256, (x, w, h) => {
  x.fillStyle = '#d0d0d0'
  x.fillRect(0, 0, w, h)
  for (let i = 0; i < 60; i++) {
    const px = rand(0, w), py = rand(0, h), r = rand(6, 18)
    const gr = x.createRadialGradient(px, py, 1, px, py, r)
    gr.addColorStop(0, '#555555')
    gr.addColorStop(1, '#d0d0d0')
    x.fillStyle = gr
    x.fillRect(px - r, py - r, r * 2, r * 2)
  }
})
groundRoughTex.repeat.set(16, 11)

const ground = new THREE.Mesh(new THREE.PlaneGeometry(90, 64), new THREE.MeshStandardMaterial({
  map: groundTex,
  roughnessMap: groundRoughTex,
  roughness: 0.82,
  metalness: 0.08,
}))
ground.rotation.x = -Math.PI / 2
ground.receiveShadow = true
scene.add(ground)

const roadTex = canvasTex(256, 256, (x, w, h) => {
  x.fillStyle = '#161920'
  x.fillRect(0, 0, w, h)
  const rows = 8, cols = 4
  const rh = h / rows, cw = w / cols
  for (let r = 0; r < rows; r++) {
    const offset = (r % 2) * (cw * 0.5)
    for (let c = -1; c <= cols + 1; c++) {
      const bx = c * cw + offset + 2
      const by = r * rh + 2
      const bw = cw - 4
      const bh = rh - 4
      const t = 26 + Math.floor(rand(-5, 7))
      x.fillStyle = `rgb(${t - 2}, ${t}, ${t + 4})`
      x.fillRect(bx, by, bw, bh)
      x.fillStyle = 'rgba(255, 255, 255, 0.06)'
      x.fillRect(bx, by, bw, 2)
      x.fillStyle = 'rgba(0, 0, 0, 0.32)'
      x.fillRect(bx, by + bh - 2, bw, 2)
    }
  }
  for (let i = 0; i < 400; i++) {
    x.fillStyle = 'rgba(0, 0, 0, 0.22)'
    x.fillRect(rand(0, w), rand(0, h), 2, 2)
  }
})

function road(x, z, w, d) {
  const tex = roadTex.clone()
  tex.repeat.set(w / 3.2, d / 3.2)
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshStandardMaterial({
    map: tex,
    roughness: 0.72,
    metalness: 0.12,
  }))
  m.rotation.x = -Math.PI / 2
  m.position.set(x, .02, z)
  m.receiveShadow = true
  scene.add(m)
}

road(0, 0, 84, 6.4)
road(0, 0, 6.4, 58)

const plazaTex = canvasTex(256, 256, (x, w, h) => {
  x.fillStyle = '#222833'
  x.fillRect(0, 0, w, h)
  const cx = w / 2, cy = h / 2
  for (let r = 110; r > 10; r -= 20) {
    x.strokeStyle = 'rgba(18, 22, 30, 0.9)'
    x.lineWidth = 3
    x.beginPath()
    x.arc(cx, cy, r, 0, Math.PI * 2)
    x.stroke()
  }
  x.strokeStyle = 'rgba(68, 80, 102, 0.35)'
  x.lineWidth = 2
  for (let a = 0; a < 8; a++) {
    const ang = (a * Math.PI) / 4
    x.beginPath()
    x.moveTo(cx, cy)
    x.lineTo(cx + Math.cos(ang) * 115, cy + Math.sin(ang) * 115)
    x.stroke()
  }
  for (let a = 0; a < 8; a++) {
    const ang = (a * Math.PI) / 4
    x.fillStyle = a % 2 ? 'rgba(74, 88, 112, 0.3)' : 'rgba(32, 40, 52, 0.35)'
    x.beginPath()
    x.moveTo(cx, cy)
    x.lineTo(cx + Math.cos(ang) * 90, cy + Math.sin(ang) * 90)
    x.lineTo(cx + Math.cos(ang + Math.PI / 8) * 45, cy + Math.sin(ang + Math.PI / 8) * 45)
    x.closePath()
    x.fill()
  }
})

const plaza = new THREE.Mesh(new THREE.CircleGeometry(8.5, 48), new THREE.MeshStandardMaterial({
  map: plazaTex,
  color: 0x8a97aa,
  roughness: 0.74,
  metalness: 0.12,
}))
plaza.rotation.x = -Math.PI / 2
plaza.position.y = .03
plaza.receiveShadow = true
scene.add(plaza);

/* 星空与月亮 */
(() => {
  const g = new THREE.BufferGeometry(), p = []
  for (let i = 0; i < 420; i++) {
    const r = rand(60, 95), t = rand(0, Math.PI * 2), e = rand(.12, 1.35)
    p.push(Math.cos(t) * r * Math.cos(e), Math.sin(e) * r, Math.sin(t) * r * Math.cos(e))
  }
  g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3))
  scene.add(new THREE.Points(g, new THREE.PointsMaterial({ color: 0xc4d6ee, size: .38, transparent: true, opacity: .88 })))
  const mt = canvasTex(128, 128, (x) => {
    const gr = x.createRadialGradient(64, 64, 6, 64, 64, 64)
    gr.addColorStop(0, '#fffbe6')
    gr.addColorStop(.28, '#faecc2')
    gr.addColorStop(.44, 'rgba(215, 200, 165, 0.32)')
    gr.addColorStop(.7, 'rgba(180, 195, 220, 0.1)')
    gr.addColorStop(1, 'rgba(180, 195, 220, 0)')
    x.fillStyle = gr
    x.fillRect(0, 0, 128, 128)
  })
  const ms = new THREE.Sprite(new THREE.SpriteMaterial({ map: mt, transparent: true, fog: false }))
  ms.scale.set(16, 16, 1)
  ms.position.set(-46, 42, -52)
  scene.add(ms)
})()

/* ── 碰撞与网格 ── */
export const GW = 81, GH = 57
export const blocked = new Uint8Array(GW * GH)
export const toG = (x, z) => [clamp(Math.round(x) + 40, 0, GW - 1), clamp(Math.round(z) + 28, 0, GH - 1)]
export const fromG = (gx, gy) => [gx - 40, gy - 28]

export function blockRect(x1, z1, x2, z2, pad) {
  pad = pad === undefined ? 0 : pad
  const eps = 0.05
  const minGx = Math.max(0, Math.ceil(x1 - pad - 0.5 + eps) + 40)
  const maxGx = Math.min(GW - 1, Math.floor(x2 + pad + 0.5 - eps) + 40)
  const minGy = Math.max(0, Math.ceil(z1 - pad - 0.5 + eps) + 28)
  const maxGy = Math.min(GH - 1, Math.floor(z2 + pad + 0.5 - eps) + 28)
  for (let gx = minGx; gx <= maxGx; gx++) {
    for (let gy = minGy; gy <= maxGy; gy++) {
      blocked[gy * GW + gx] = 1
    }
  }
}

blockRect(-41, -29, 41, -28.4, 0)
blockRect(-41, 28.4, 41, 29, 0)
blockRect(-41, -29, -40.4, 29, 0)
blockRect(40.4, -29, 41, 29, 0)

export function isBlocked(gx, gy) {
  if (gx < 0 || gy < 0 || gx >= GW || gy >= GH) {
    return true
  }
  if (blocked[gy * GW + gx]) {
    return true
  }
  if (!hasFlag('gateOpen') && gx >= 66 && gx <= 70 && gy === 28) {
    return true
  }
  return false
}

export function nearestFree(gx, gy) {
  if (!isBlocked(gx, gy)) {
    return [gx, gy]
  }
  for (let r = 1; r <= 3; r++) {
    for (let dx = -r; dx <= r; dx++) {
      for (let dy = -r; dy <= r; dy++) {
        if (!isBlocked(gx + dx, gy + dy)) {
          return [gx + dx, gy + dy]
        }
      }
    }
  }
  return null
}

export function findPath(sx, sz, tx, tz) {
  const s = toG(sx, sz)
  let t = toG(tx, tz)
  t = nearestFree(t[0], t[1])
  if (!t) {
    return []
  }
  const [sx0, sy0] = s, [tx0, ty0] = t
  if (sx0 === tx0 && sy0 === ty0) {
    return []
  }
  const open = [{ x: sx0, y: sy0, g: 0, f: 0 }], came = {}, gs = {}
  gs[sy0 * GW + sx0] = 0
  const closed = {}
  const h = (x, y) => Math.hypot(x - tx0, y - ty0)
  while (open.length) {
    let bi = 0
    for (let i = 1; i < open.length; i++) {
      if (open[i].f < open[bi].f) {
        bi = i
      }
    }
    const cur = open.splice(bi, 1)[0]
    const ck = cur.y * GW + cur.x
    if (closed[ck]) {
      continue
    }
    closed[ck] = 1
    if (cur.x === tx0 && cur.y === ty0) {
      const path = []
      let k = ck
      while (k !== undefined) {
        const y = (k / GW) | 0, x = k % GW
        path.unshift(fromG(x, y))
        k = came[k]
      }
      return path
    }
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        if (!dx && !dy) {
          continue
        }
        const nx = cur.x + dx, ny = cur.y + dy
        if (isBlocked(nx, ny)) {
          continue
        }
        if (dx && dy && (isBlocked(cur.x + dx, cur.y) || isBlocked(cur.x, cur.y + dy))) {
          continue
        }
        const ng = cur.g + (dx && dy ? 1.414 : 1), nk = ny * GW + nx
        if (gs[nk] === undefined || ng < gs[nk]) {
          gs[nk] = ng
          came[nk] = ck
          open.push({ x: nx, y: ny, g: ng, f: ng + h(nx, ny) })
        }
      }
    }
  }
  return []
}

/* ── 建筑与道具建造 ── */
export const interactMeshes = []
export let gateMesh = null

const woodTex = canvasTex(256, 256, (x, w, h) => {
  x.fillStyle = '#4a3726'
  x.fillRect(0, 0, w, h)
  for (let i = 0; i < 40; i++) {
    const y = rand(0, h)
    x.fillStyle = Math.random() < 0.5 ? 'rgba(40, 26, 16, 0.45)' : 'rgba(92, 70, 50, 0.35)'
    x.fillRect(0, y, w, rand(1, 4))
  }
  for (let i = 0; i < 5; i++) {
    const y = i * (h / 4)
    x.fillStyle = 'rgba(20, 14, 10, 0.65)'
    x.fillRect(0, y, w, 2)
  }
})

const wallPlasterTex = canvasTex(256, 256, (x, w, h) => {
  x.fillStyle = '#4c4542'
  x.fillRect(0, 0, w, h)
  for (let r = 0; r < 8; r++) {
    const y = r * 32
    x.fillStyle = 'rgba(25, 23, 22, 0.4)'
    x.fillRect(0, y, w, 2)
    const shift = (r % 2) * 32
    for (let c = -1; c < 9; c++) {
      x.fillRect(c * 64 + shift, y, 2, 32)
    }
  }
  for (let i = 0; i < 300; i++) {
    x.fillStyle = 'rgba(255, 255, 255, 0.04)'
    x.fillRect(rand(0, w), rand(0, h), 2, 2)
  }
})

const roofTileTex = canvasTex(256, 256, (x, w, h) => {
  x.fillStyle = '#26242c'
  x.fillRect(0, 0, w, h)
  const rows = 12
  const rh = h / rows
  for (let r = 0; r < rows; r++) {
    const y = r * rh
    x.fillStyle = 'rgba(12, 11, 15, 0.8)'
    x.fillRect(0, y, w, 3)
    const shift = (r % 2) * 16
    for (let c = -1; c < 18; c++) {
      x.fillStyle = 'rgba(18, 16, 22, 0.6)'
      x.fillRect(c * 20 + shift, y, 2, rh)
    }
    x.fillStyle = 'rgba(255, 255, 255, 0.06)'
    x.fillRect(0, y + rh - 2, w, 1)
  }
})

export function mat(c, e) {
  return new THREE.MeshStandardMaterial(Object.assign({
    color: c,
    roughness: 0.82,
    metalness: 0.08,
  }, e || {}))
}

export function box(w, h, d, c, x, y, z, shadow) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(c))
  m.position.set(x, y, z)
  if (shadow !== false) {
    m.castShadow = true
    m.receiveShadow = true
  }
  scene.add(m)
  return m
}

export function wallRects(list) {
  list.forEach(r => blockRect(r[0], r[1], r[2], r[3], 0))
}

function quoinCorner(x, z, h, c) {
  const count = Math.floor(h / 0.45)
  for (let i = 0; i < count; i++) {
    const s = (i % 2 === 0) ? 0.38 : 0.26
    const q = new THREE.Mesh(new THREE.BoxGeometry(s, 0.2, s), mat(c, { roughness: 0.9 }))
    q.position.set(x, 0.12 + i * 0.45, z)
    q.castShadow = true
    scene.add(q)
  }
}

export function buildingShell(x1, z1, x2, z2, h, color, door) {
  const t = .45, wr = []
  const wallM = mat(color, { map: wallPlasterTex, roughness: 0.88, metalness: 0.05 })
  const seg = (wx1, wz1, wx2, wz2) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(wx2 - wx1, h, wz2 - wz1), wallM)
    m.position.set((wx1 + wx2) / 2, h / 2, (wz1 + wz2) / 2)
    m.castShadow = true
    m.receiveShadow = true
    scene.add(m)
    wr.push([wx1, wz1, wx2, wz2])
  }
  const d = door || {}
  if (d.side === 'N') {
    seg(x1, z1, d.a, z1 + t)
    seg(d.b, z1, x2, z1 + t)
    box(d.b - d.a, .8, t, color, (d.a + d.b) / 2, h - .4, z1 + t / 2)
    const lint = new THREE.Mesh(new THREE.BoxGeometry(d.b - d.a + 0.3, 0.22, t + 0.16), mat(0x28221c, { map: woodTex }))
    lint.position.set((d.a + d.b) / 2, h - 0.72, z1 + t / 2)
    scene.add(lint)
  } else {
    seg(x1, z1, x2, z1 + t)
  }
  if (d.side === 'S') {
    seg(x1, z2 - t, d.a, z2)
    seg(d.b, z2 - t, x2, z2)
    box(d.b - d.a, .8, t, color, (d.a + d.b) / 2, h - .4, z2 - t / 2)
    const lint = new THREE.Mesh(new THREE.BoxGeometry(d.b - d.a + 0.3, 0.22, t + 0.16), mat(0x28221c, { map: woodTex }))
    lint.position.set((d.a + d.b) / 2, h - 0.72, z2 - t / 2)
    scene.add(lint)
  } else {
    seg(x1, z2 - t, x2, z2)
  }
  if (d.side === 'W') {
    seg(x1, z1, x1 + t, d.a)
    seg(x1, d.b, x1 + t, z2)
    box(t, .8, d.b - d.a, color, x1 + t / 2, h - .4, (d.a + d.b) / 2)
    const lint = new THREE.Mesh(new THREE.BoxGeometry(t + 0.16, 0.22, d.b - d.a + 0.3), mat(0x28221c, { map: woodTex }))
    lint.position.set(x1 + t / 2, h - 0.72, (d.a + d.b) / 2)
    scene.add(lint)
  } else {
    seg(x1, z1, x1 + t, z2)
  }
  if (d.side === 'E') {
    seg(x2 - t, z1, x2, d.a)
    seg(x2 - t, d.b, x2, z2)
    box(t, .8, d.b - d.a, color, x2 - t / 2, h - .4, (d.a + d.b) / 2)
    const lint = new THREE.Mesh(new THREE.BoxGeometry(t + 0.16, 0.22, d.b - d.a + 0.3), mat(0x28221c, { map: woodTex }))
    lint.position.set(x2 - t / 2, h - 0.72, (d.a + d.b) / 2)
    scene.add(lint)
  } else {
    seg(x2 - t, z1, x2, z2)
  }

  box(x2 - x1 + .45, .28, t + .24, 0x1b1f24, (x1 + x2) / 2, h + .12, (z1 + z2) / 2 - .02, false)
  box(x2 - x1 + .45, .28, t + .24, 0x1b1f24, (x1 + x2) / 2, h + .12, (z1 + z2) / 2 + .02, false)

  const qc = 0x272c33
  quoinCorner(x1 + t / 2, z1 + t / 2, h, qc)
  quoinCorner(x2 - t / 2, z1 + t / 2, h, qc)
  quoinCorner(x1 + t / 2, z2 - t / 2, h, qc)
  quoinCorner(x2 - t / 2, z2 - t / 2, h, qc)
  return wr
}

const windowTex = canvasTex(128, 128, (x, w, h) => {
  const g = x.createRadialGradient(64, 64, 8, 64, 64, 64)
  g.addColorStop(0, '#fff4b8')
  g.addColorStop(0.35, '#ffae38')
  g.addColorStop(0.75, '#b85412')
  g.addColorStop(1, '#562106')
  x.fillStyle = g
  x.fillRect(0, 0, w, h)
  x.fillStyle = 'rgba(255, 255, 255, 0.15)'
  x.fillRect(0, 0, w, h)
  x.fillStyle = '#181410'
  x.fillRect(0, 0, w, 10)
  x.fillRect(0, h - 10, w, 10)
  x.fillRect(0, 0, 10, h)
  x.fillRect(w - 10, 0, 10, h)
  x.fillRect(w / 2 - 4, 0, 8, h)
  x.fillRect(0, h / 3 - 3, w, 6)
  x.fillRect(0, (h * 2) / 3 - 3, w, 6)
  x.fillStyle = 'rgba(30, 20, 12, 0.45)'
  x.fillRect(10, 10, 22, h - 20)
  x.fillRect(w - 32, 10, 22, h - 20)
})

const windowMat = new THREE.MeshStandardMaterial({
  map: windowTex,
  emissive: 0xff9c36,
  emissiveMap: windowTex,
  emissiveIntensity: 1.25,
  roughness: 0.28,
})

export function solidHouse(x, z, w, d, h, c, rc) {
  const houseGroup = new THREE.Group()
  const bMat = mat(c, { map: wallPlasterTex, roughness: 0.88, metalness: 0.06 })
  const base = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), bMat)
  base.position.y = h / 2
  base.castShadow = true
  base.receiveShadow = true
  houseGroup.add(base)

  const plinth = new THREE.Mesh(new THREE.BoxGeometry(w + 0.3, 0.45, d + 0.3), mat(0x23272e, { roughness: 0.9 }))
  plinth.position.y = 0.22
  plinth.castShadow = true
  plinth.receiveShadow = true
  houseGroup.add(plinth)

  const roofM = mat(rc, { map: roofTileTex, roughness: 0.78, metalness: 0.1 })
  const rg = new THREE.Mesh(new THREE.CylinderGeometry(0, 1, 1, 4), roofM)
  rg.scale.set((w + 0.7) * .75, 1.75, (d + 0.7) * .75)
  rg.position.set(0, h + .88, 0)
  rg.rotation.y = Math.PI / 4
  rg.castShadow = true
  houseGroup.add(rg)

  const chim = new THREE.Mesh(new THREE.BoxGeometry(0.7, 1.3, 0.7), mat(0x383430, { map: wallPlasterTex }))
  chim.position.set(w * 0.26, h + 1.2, d * 0.2)
  chim.castShadow = true
  houseGroup.add(chim)
  const chimTop = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.16, 0.85), mat(0x1e1c1a))
  chimTop.position.set(w * 0.26, h + 1.88, d * 0.2)
  houseGroup.add(chimTop)

  const win = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 1.25), windowMat)
  win.position.set(0, h * .55, d / 2 + .025)
  houseGroup.add(win)

  const sill = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.12, 0.22), mat(0x1d2128))
  sill.position.set(0, h * 0.55 - 0.68, d / 2 + 0.11)
  houseGroup.add(sill)

  const lShutter = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1.2, 0.08), mat(0x2c221a, { map: woodTex }))
  lShutter.position.set(-0.72, h * 0.55, d / 2 + 0.04)
  houseGroup.add(lShutter)
  const rShutter = lShutter.clone()
  rShutter.position.x = 0.72
  houseGroup.add(rShutter)

  houseGroup.position.set(x, 0, z)
  scene.add(houseGroup)
  blockRect(x - w / 2, z - d / 2, x + w / 2, z + d / 2, 0)
}

const lampGlowTex = canvasTex(128, 128, (x, w, h) => {
  const g = x.createRadialGradient(64, 64, 4, 64, 64, 64)
  g.addColorStop(0, 'rgba(255, 225, 140, 0.98)')
  g.addColorStop(0.24, 'rgba(255, 180, 80, 0.5)')
  g.addColorStop(0.55, 'rgba(255, 140, 40, 0.16)')
  g.addColorStop(1, 'rgba(255, 140, 40, 0)')
  x.fillStyle = g
  x.fillRect(0, 0, w, h)
})

export const lampPositions = []

export function lamp(x, z) {
  lampPositions.push([x, z])
  const g = new THREE.Group()

  const base = new THREE.Mesh(new THREE.CylinderGeometry(.22, .32, .5, 8), mat(0x181c22, { metalness: 0.65, roughness: 0.38 }))
  base.position.y = .25
  base.castShadow = true
  g.add(base)

  const p = new THREE.Mesh(new THREE.CylinderGeometry(.065, .085, 3.2, 8), mat(0x1c2026, { metalness: 0.65, roughness: 0.4 }))
  p.position.y = 1.85
  p.castShadow = true
  g.add(p)

  const ringMid = new THREE.Mesh(new THREE.TorusGeometry(.11, .025, 6, 12), mat(0x282c34, { metalness: 0.7 }))
  ringMid.rotation.x = Math.PI / 2
  ringMid.position.y = 2.4
  g.add(ringMid)

  const bracket = new THREE.Mesh(new THREE.BoxGeometry(.55, .12, .12), mat(0x181b20, { metalness: 0.6 }))
  bracket.position.set(0.18, 3.42, 0)
  g.add(bracket)

  const frame = new THREE.Mesh(new THREE.CylinderGeometry(.26, .18, .52, 6, 1, true), mat(0x181b20, { metalness: 0.7, roughness: 0.3 }))
  frame.position.y = 3.52
  g.add(frame)

  const hd = new THREE.Mesh(new THREE.CylinderGeometry(.19, .14, .45, 6), new THREE.MeshStandardMaterial({
    color: 0xffdfa8,
    emissive: 0xffa03c,
    emissiveIntensity: 2.4,
    roughness: 0.18,
    transparent: true,
    opacity: 0.9,
  }))
  hd.position.y = 3.52
  g.add(hd)

  const cp = new THREE.Mesh(new THREE.ConeGeometry(.36, .34, 6), mat(0x15181e, { metalness: 0.6, roughness: 0.35 }))
  cp.position.y = 3.92
  g.add(cp)

  const finial = new THREE.Mesh(new THREE.SphereGeometry(.05, 8, 8), mat(0x15181e, { metalness: 0.8 }))
  finial.position.y = 4.14
  g.add(finial)

  const pl = new THREE.PointLight(0xffa84a, 1.25, 14.5, 2)
  pl.position.y = 3.45
  g.add(pl)

  const pool = new THREE.Mesh(
    new THREE.PlaneGeometry(5.4, 5.4),
    new THREE.MeshBasicMaterial({
      map: lampGlowTex,
      transparent: true,
      opacity: 0.36,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
  )
  pool.rotation.x = -Math.PI / 2
  pool.position.y = .035
  g.add(pool)

  const halo = new THREE.Sprite(new THREE.SpriteMaterial({
    map: lampGlowTex,
    transparent: true,
    opacity: 0.58,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  }))
  halo.position.y = 3.52
  halo.scale.set(1.9, 1.9, 1)
  g.add(halo)

  g.position.set(x, 0, z)
  scene.add(g)
  blockRect(x - .3, z - .3, x + .3, z + .3, 0)
}

export function barrel(x, z, s) {
  s = s || 1
  const bg = new THREE.Group()
  const bMat = mat(0x523d2b, { map: woodTex, roughness: 0.85, metalness: 0.08 })
  const hoopMat = mat(0x22262d, { roughness: 0.5, metalness: 0.75 })

  const bMid = new THREE.Mesh(new THREE.CylinderGeometry(.5 * s, .5 * s, .38 * s, 12), bMat)
  bMid.position.y = .48 * s
  bMid.castShadow = true
  bMid.receiveShadow = true
  bg.add(bMid)

  const bTop = new THREE.Mesh(new THREE.CylinderGeometry(.42 * s, .5 * s, .3 * s, 12), bMat)
  bTop.position.y = .82 * s
  bTop.castShadow = true
  bTop.receiveShadow = true
  bg.add(bTop)

  const bBot = new THREE.Mesh(new THREE.CylinderGeometry(.5 * s, .42 * s, .3 * s, 12), bMat)
  bBot.position.y = .15 * s
  bBot.castShadow = true
  bBot.receiveShadow = true
  bg.add(bBot)

  const r1 = new THREE.Mesh(new THREE.TorusGeometry(.44 * s, .03 * s, 4, 16), hoopMat)
  r1.rotation.x = Math.PI / 2
  r1.position.y = .85 * s
  bg.add(r1)

  const r2 = new THREE.Mesh(new THREE.TorusGeometry(.49 * s, .03 * s, 4, 16), hoopMat)
  r2.rotation.x = Math.PI / 2
  r2.position.y = .58 * s
  bg.add(r2)

  const r3 = new THREE.Mesh(new THREE.TorusGeometry(.49 * s, .03 * s, 4, 16), hoopMat)
  r3.rotation.x = Math.PI / 2
  r3.position.y = .38 * s
  bg.add(r3)

  const r4 = new THREE.Mesh(new THREE.TorusGeometry(.44 * s, .03 * s, 4, 16), hoopMat)
  r4.rotation.x = Math.PI / 2
  r4.position.y = .11 * s
  bg.add(r4)

  const cap = new THREE.Mesh(new THREE.CircleGeometry(.41 * s, 12), mat(0x3a2c20, { map: woodTex }))
  cap.rotation.x = -Math.PI / 2
  cap.position.y = .96 * s
  bg.add(cap)

  bg.position.set(x, 0, z)
  scene.add(bg)
  blockRect(x - .45 * s, z - .45 * s, x + .45 * s, z + .45 * s, 0)
}

export function crate(x, z, s) {
  s = s || 1
  const cg = new THREE.Group()
  const cMat = mat(0x4a3a2a, { map: woodTex, roughness: 0.86, metalness: 0.05 })
  const frameMat = mat(0x36281b, { roughness: 0.88 })
  const metalCornerMat = mat(0x23272e, { roughness: 0.45, metalness: 0.6 })

  const core = new THREE.Mesh(new THREE.BoxGeometry(.76 * s, .76 * s, .76 * s), cMat)
  core.position.y = .4 * s
  core.castShadow = true
  core.receiveShadow = true
  cg.add(core)

  const t = 0.05 * s
  const w = 0.8 * s
  const f1 = new THREE.Mesh(new THREE.BoxGeometry(w, t, t), frameMat)
  f1.position.set(0, .78 * s, .39 * s)
  cg.add(f1)
  const f2 = f1.clone()
  f2.position.set(0, .78 * s, -.39 * s)
  cg.add(f2)
  const f3 = f1.clone()
  f3.position.set(0, .03 * s, .39 * s)
  cg.add(f3)
  const f4 = f1.clone()
  f4.position.set(0, .03 * s, -.39 * s)
  cg.add(f4)

  const cross = new THREE.Mesh(new THREE.BoxGeometry(0.06 * s, 1.05 * s, 0.03 * s), frameMat)
  cross.position.set(0, 0.4 * s, 0.39 * s)
  cross.rotation.z = Math.PI / 4
  cg.add(cross)
  const cross2 = cross.clone()
  cross2.rotation.z = -Math.PI / 4
  cg.add(cross2)

  const cCorner = new THREE.Mesh(new THREE.BoxGeometry(0.12 * s, 0.12 * s, 0.12 * s), metalCornerMat)
  cCorner.position.set(0.38 * s, 0.76 * s, 0.38 * s)
  cg.add(cCorner)
  const cCorner2 = cCorner.clone()
  cCorner2.position.x = -0.38 * s
  cg.add(cCorner2)

  cg.position.set(x, 0, z)
  scene.add(cg)
  blockRect(x - .4 * s, z - .4 * s, x + .4 * s, z + .4 * s, 0)
}

export function tree(x, z, s) {
  s = s || 1
  const tg = new THREE.Group()

  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(.13 * s, .23 * s, 1.7 * s, 7), mat(0x2c2217, { roughness: 0.92 }))
  trunk.position.set(0, .85 * s, 0)
  trunk.rotation.z = 0.04
  trunk.castShadow = true
  tg.add(trunk)

  for (let i = 0; i < 3; i++) {
    const root = new THREE.Mesh(new THREE.CylinderGeometry(.06 * s, .12 * s, .55 * s, 4), mat(0x281f14))
    const ang = (i * Math.PI * 2) / 3
    root.position.set(Math.cos(ang) * 0.22 * s, 0.18 * s, Math.sin(ang) * 0.22 * s)
    root.rotation.x = Math.sin(ang) * 0.45
    root.rotation.z = Math.cos(ang) * 0.45
    tg.add(root)
  }

  const folColors = [0x172b20, 0x1d3527, 0x223e2e, 0x1a3023]
  for (let i = 0; i < 4; i++) {
    const fMat = mat(folColors[i % folColors.length], { roughness: 0.85 })
    const rad = (1.25 - i * .24) * s
    const f = new THREE.Mesh(new THREE.ConeGeometry(rad, 1.15 * s, 7), fMat)
    f.position.set(0, (1.65 + i * .68) * s, 0)
    f.rotation.y = (i * 0.75)
    f.castShadow = true
    f.receiveShadow = true
    tg.add(f)
  }

  tg.position.set(x, 0, z)
  scene.add(tg)
  blockRect(x - .35 * s, z - .35 * s, x + .35 * s, z + .35 * s, 0)
}

export function table(x, z) {
  const tg = new THREE.Group()
  const tMat = mat(0x483827, { map: woodTex, roughness: 0.82 })
  const legMat = mat(0x322619, { roughness: 0.9 })

  const top = new THREE.Mesh(new THREE.BoxGeometry(1.55, .1, .95), tMat)
  top.position.y = .82
  top.castShadow = true
  top.receiveShadow = true
  tg.add(top)

  const bevel = new THREE.Mesh(new THREE.BoxGeometry(1.4, .06, .8), legMat)
  bevel.position.y = .75
  tg.add(bevel)

  const legCoords = [[-.62, -.32], [.62, -.32], [-.62, .32], [.62, .32]]
  legCoords.forEach(([lx, lz]) => {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(.11, .78, .11), legMat)
    leg.position.set(lx, .39, lz)
    leg.castShadow = true
    tg.add(leg)
  })

  tg.position.set(x, 0, z)
  scene.add(tg)
  blockRect(x - .78, z - .48, x + .78, z + .48, 0)
}

export function stool(x, z) {
  const sg = new THREE.Group()
  const sMat = mat(0x3a2c1f, { map: woodTex, roughness: 0.85 })
  const seat = new THREE.Mesh(new THREE.CylinderGeometry(.27, .27, .07, 10), sMat)
  seat.position.y = .52
  seat.castShadow = true
  sg.add(seat)
  for (let i = 0; i < 3; i++) {
    const ang = (i * Math.PI * 2) / 3
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(.04, .05, .5, 5), sMat)
    leg.position.set(Math.cos(ang) * 0.16, .25, Math.sin(ang) * 0.16)
    leg.rotation.z = Math.cos(ang) * 0.12
    leg.rotation.x = Math.sin(ang) * 0.12
    leg.castShadow = true
    sg.add(leg)
  }
  sg.position.set(x, 0, z)
  scene.add(sg)
}

export function tagInteractive(mesh, id, name, kind) {
  mesh.userData.iid = id
  interactMeshes.push(mesh)
  ITAB[id] = ITAB[id] || {}
  ITAB[id].name = name
  ITAB[id].kind = kind
  ITAB[id].mesh = mesh
}

const bloodTex = canvasTex(256, 256, (x, w, h) => {
  x.clearRect(0, 0, w, h)
  const cx = w / 2, cy = h / 2
  const gr = x.createRadialGradient(cx, cy, 10, cx, cy, 110)
  gr.addColorStop(0, 'rgba(56, 8, 12, 0.98)')
  gr.addColorStop(0.45, 'rgba(48, 6, 10, 0.9)')
  gr.addColorStop(0.8, 'rgba(38, 4, 8, 0.65)')
  gr.addColorStop(1, 'rgba(30, 4, 6, 0)')
  x.fillStyle = gr
  x.beginPath()
  x.ellipse(cx, cy, 100, 80, 0.2, 0, Math.PI * 2)
  x.fill()

  x.fillStyle = 'rgba(50, 7, 11, 0.95)'
  for (let i = 0; i < 32; i++) {
    const a = Math.random() * Math.PI * 2
    const d = rand(30, 115)
    const r = rand(2, 6)
    x.beginPath()
    x.arc(cx + Math.cos(a) * d, cy + Math.sin(a) * d, r, 0, Math.PI * 2)
    x.fill()
  }
})

export function chalkOutline(x, z) {
  const pts = []
  const s = .34
  const P = (a, b) => pts.push(new THREE.Vector3(x + a * s, .04, z + b * s))
  P(0, -3)
  P(.9, -2.6)
  P(1, -1.2)
  P(2.4, -1.6)
  P(2.6, -.9)
  P(1.2, -.2)
  P(1.3, 1.4)
  P(2, 3)
  P(1.2, 3.2)
  P(.4, 1.8)
  P(0, 2.2)
  P(-.4, 1.8)
  P(-1.2, 3.2)
  P(-2, 3)
  P(-1.3, 1.4)
  P(-1.2, -.2)
  P(-2.6, -.9)
  P(-2.4, -1.6)
  P(-1, -1.2)
  P(-.9, -2.6)
  pts.push(pts[0].clone())
  const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),
    new THREE.LineBasicMaterial({ color: 0xd8d8d0, transparent: true, opacity: .75 }))
  scene.add(line)

  const blood = new THREE.Mesh(
    new THREE.PlaneGeometry(2.4, 1.8),
    new THREE.MeshStandardMaterial({
      map: bloodTex,
      transparent: true,
      roughness: 0.25,
      metalness: 0.1,
      depthWrite: false,
    }),
  )
  blood.rotation.x = -Math.PI / 2
  blood.position.set(x + .45, .035, z - .35)
  scene.add(blood)
  tagInteractive(blood, 'body', '死者遗体痕迹', 'clue')
}

/* ── 世界搭建 ── */
export const ITAB = {}

// 铁匠铺（案发现场）
wallRects(buildingShell(-26, -20, -14, -10, 3.2, 0x4a3f38, { side: 'S', a: -22.0, b: -18.0 }))
box(11.5, .12, 9.5, 0x2b2622, -20, .06, -15, false)

function createDetailedAnvil() {
  const g = new THREE.Group()
  const ironM = mat(0x343942, { roughness: 0.38, metalness: 0.72 })

  const baseB = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.28, 0.62), ironM)
  baseB.position.y = 0.14
  baseB.castShadow = true
  g.add(baseB)

  const waist = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.38, 0.42), ironM)
  waist.position.y = 0.44
  waist.castShadow = true
  g.add(waist)

  const topFace = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.22, 0.54), ironM)
  topFace.position.set(-0.06, 0.72, 0)
  topFace.castShadow = true
  g.add(topFace)

  const horn = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.58, 8), ironM)
  horn.rotation.z = -Math.PI / 2
  horn.position.set(0.62, 0.72, 0)
  horn.castShadow = true
  g.add(horn)

  const step = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.14, 0.5), ironM)
  step.position.set(-0.54, 0.68, 0)
  g.add(step)

  return g
}

const anvil = createDetailedAnvil()
anvil.position.set(-22.5, 0, -14)
scene.add(anvil)

const forgeGroup = new THREE.Group()
const stoneMat = mat(0x342e27, { map: wallPlasterTex, roughness: 0.9 })
const fBase = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.35, 1.8), stoneMat)
fBase.position.set(0, 0.68, 0)
fBase.castShadow = true
fBase.receiveShadow = true
forgeGroup.add(fBase)

const hood = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 1.05, 1.4, 4), stoneMat)
hood.position.set(0, 2.05, 0)
hood.rotation.y = Math.PI / 4
hood.castShadow = true
forgeGroup.add(hood)

const fChimney = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.38, 1.2, 6), stoneMat)
fChimney.position.set(0, 3.2, 0)
forgeGroup.add(fChimney)

const hearthHole = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.55, 0.85), mat(0x181412))
hearthHole.position.set(0, 1.05, 0.52)
forgeGroup.add(hearthHole)

const bellows = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.3, 0.85), mat(0x423020, { map: woodTex }))
bellows.position.set(1.15, 0.8, -0.2)
forgeGroup.add(bellows)

const coalGroup = new THREE.Group()
const coalM = mat(0x1c1716, { roughness: 0.95 })
for (let i = 0; i < 9; i++) {
  const cl = new THREE.Mesh(new THREE.DodecahedronGeometry(rand(0.08, 0.15), 0), coalM)
  cl.position.set(rand(-0.45, 0.45), 1.08 + rand(0, 0.08), 0.45 + rand(-0.2, 0.2))
  coalGroup.add(cl)
}
forgeGroup.add(coalGroup)

forgeGroup.position.set(-24.6, 0, -18.6)
scene.add(forgeGroup)

const emberTex = canvasTex(128, 128, (x, w, h) => {
  x.fillStyle = '#ff2800'
  x.fillRect(0, 0, w, h)
  for (let i = 0; i < 40; i++) {
    const px = rand(0, w), py = rand(0, h), r = rand(6, 18)
    const gr = x.createRadialGradient(px, py, 1, px, py, r)
    gr.addColorStop(0, '#fff4a0')
    gr.addColorStop(0.35, '#ff6e14')
    gr.addColorStop(1, 'rgba(160, 20, 0, 0)')
    x.fillStyle = gr
    x.beginPath()
    x.arc(px, py, r, 0, Math.PI * 2)
    x.fill()
  }
  for (let i = 0; i < 28; i++) {
    x.fillStyle = '#1c100c'
    x.beginPath()
    x.arc(rand(0, w), rand(0, h), rand(4, 10), 0, Math.PI * 2)
    x.fill()
  }
})

export const embers = new THREE.Mesh(new THREE.PlaneGeometry(1.3, .75), new THREE.MeshStandardMaterial({
  map: emberTex,
  color: 0xff480c,
  emissive: 0xff3b00,
  emissiveMap: emberTex,
  emissiveIntensity: 2.6,
  roughness: 0.45,
}))
embers.rotation.x = -Math.PI / 2
embers.position.set(-24.6, 1.38, -18.15)
scene.add(embers)

export const forgeLight = new THREE.PointLight(0xff7733, 1.15, 10.5, 2)
forgeLight.position.set(-24.6, 2.2, -18.1)
scene.add(forgeLight)
tagInteractive(anvil, 'anvil', '铁砧', 'env')
tagInteractive(embers, 'forge', '锻炉余烬', 'env')
chalkOutline(-19, -15)
blockRect(-22.5 - .65, -14 - .35, -22.5 + .65, -14 + .35, 0)
blockRect(-24.6 - 1.15, -18.6 - .95, -24.6 + 1.15, -18.6 + .95, 0)

export const hammerM = new THREE.Group()
const hammerHandle = new THREE.Mesh(new THREE.CylinderGeometry(.035, .04, .68, 8), mat(0x56422d, { map: woodTex }))
hammerHandle.rotation.x = Math.PI / 2
hammerHandle.castShadow = true
hammerM.add(hammerHandle)

const hammerGrip = new THREE.Mesh(new THREE.CylinderGeometry(.045, .045, .28, 8), mat(0x281e16))
hammerGrip.rotation.x = Math.PI / 2
hammerGrip.position.z = -.18
hammerM.add(hammerGrip)

const hammerHead = new THREE.Mesh(new THREE.BoxGeometry(.18, .18, .26), mat(0x424852, { roughness: 0.35, metalness: 0.8 }))
hammerHead.position.z = .32
hammerHead.castShadow = true
hammerM.add(hammerHead)

const hammerPeen = new THREE.Mesh(new THREE.ConeGeometry(.09, .14, 4), mat(0x3a404a, { roughness: 0.4, metalness: 0.75 }))
hammerPeen.rotation.x = -Math.PI / 2
hammerPeen.position.z = .48
hammerM.add(hammerPeen)

const hammerBlood = new THREE.Mesh(new THREE.BoxGeometry(.19, .19, .16), mat(0x6e1b1b, { roughness: 0.3 }))
hammerBlood.position.z = .26
hammerM.add(hammerBlood)

hammerM.position.set(-18.1, .12, -14.2)
hammerM.rotation.y = .8
scene.add(hammerM)

export const hamRing = new THREE.Mesh(new THREE.RingGeometry(.5, .64, 32),
  new THREE.MeshBasicMaterial({ color: 0xd9a441, transparent: true, opacity: .5, side: THREE.DoubleSide }))
hamRing.rotation.x = -Math.PI / 2
hamRing.position.set(-18.1, .05, -14.2)
scene.add(hamRing)
tagInteractive(hammerM, 'hammer', '染血的铁锤', 'clue')

box(1.8, .9, .9, 0x4a3a2c, -15.6, .45, -18.6)
blockRect(-15.6 - .9, -18.6 - .45, -15.6 + .9, -18.6 + .45, 0)

const letterTex = canvasTex(64, 64, (x) => {
  x.fillStyle = '#f0e6ce'
  x.fillRect(0, 0, 64, 64)
  x.fillStyle = '#2b231c'
  for (let i = 0; i < 5; i++) {
    x.fillRect(8, 12 + i * 8, 48, 2)
  }
  x.fillStyle = '#8a2424'
  x.beginPath()
  x.arc(50, 48, 5, 0, Math.PI * 2)
  x.fill()
})

export const letterM = new THREE.Mesh(new THREE.PlaneGeometry(.42, .32), new THREE.MeshStandardMaterial({
  map: letterTex,
  roughness: 0.75,
}))
letterM.rotation.x = -Math.PI / 2
letterM.rotation.z = .4
letterM.position.set(-15.5, .96, -18.5)
scene.add(letterM)
tagInteractive(letterM, 'letter', '桌上的信件', 'clue')

barrel(-25, -11.2)
barrel(-24.2, -11.6, .9)
barrel(-25.2, -12.1, .85)

export const apronM = new THREE.Mesh(new THREE.PlaneGeometry(.58, .7),
  new THREE.MeshLambertMaterial({ color: 0x6e3434, side: THREE.DoubleSide }))
apronM.rotation.x = -Math.PI / 2
apronM.rotation.z = 1
apronM.position.set(-24.6, .06, -11.4)
scene.add(apronM)
tagInteractive(apronM, 'barrels', '成堆的木桶', 'env')

box(1.9, .55, 1.2, 0x3a3128, -15.4, .28, -11.4)
blockRect(-15.4 - .95, -11.4 - .6, -15.4 + .95, -11.4 + .6, 0)
const mbox = box(.5, .35, .4, 0x5a4a2e, -15.2, .1, -11.1)
tagInteractive(mbox, 'moneybox', '床底的钱匣', 'env')

// 玛莎家
wallRects(buildingShell(-24, 8, -16, 16, 3, 0x44404e, { side: 'N', a: -21.5, b: -18.5 }))
box(7.5, .12, 7.5, 0x2b2730, -20, .06, 12, false)
table(-18.2, 13.6)
const dresser = box(1.2, 1.3, .7, 0x4e3c2e, -22.6, .65, 13.8)
box(1.3, .1, .8, 0x5e4a38, -22.6, 1.34, 13.8)
blockRect(-22.6 - .6, 13.8 - .35, -22.6 + .6, 13.8 + .35, 0)
tagInteractive(dresser, 'dresser', '梳妆台', 'env')

// 酒馆「野猪头」
wallRects(buildingShell(10, -18, 24, -8, 3.4, 0x4e4034, { side: 'S', a: 15.0, b: 19.0 }))
box(13.5, .12, 9.5, 0x2e2620, 17, .06, -13, false)
box(1.2, 1.1, 7, 0x3c3024, 22.6, .55, -13)
box(1.4, .12, 7.4, 0x4e3e2e, 22.6, 1.16, -13)
blockRect(22.6 - .6, -13 - 3.5, 22.6 + .6, -13 + 3.5, 0)
table(13, -12)
table(15, -15.5)
table(19.5, -14.5)
stool(12.3, -12.6)
stool(13.8, -11.4)
stool(19, -13.6)
box(2.2, .7, .12, 0x2a2018, 17, 3.9, -7.9, false)

const barrelSign = new THREE.Mesh(new THREE.CylinderGeometry(.28, .28, .52, 12), mat(0x5a4230, { map: woodTex }))
barrelSign.rotation.z = Math.PI / 2
barrelSign.position.set(17, 3.9, -7.75)
scene.add(barrelSign)

// 当铺
wallRects(buildingShell(14, 8, 24, 16, 3.2, 0x3e4448, { side: 'N', a: 17.0, b: 21.0 }))
box(9.5, .12, 7.5, 0x272c30, 19, .06, 12, false)
table(21.5, 12)
box(1.6, 1.9, .5, 0x30363c, 15, 1, 14.6)
blockRect(15 - .8, 14.6 - .25, 15 + .8, 14.6 + .25, 0)

// 暗巷与栅栏门
blockRect(25.4, -16, 26, -2, 0)
blockRect(25.4, 2, 26, 14, 0)
blockRect(30.5, -16, 31.2, -2, 0)
blockRect(30.5, 2, 31.2, 14, 0)
crate(29.5, 6.5)
crate(26.8, -6, .8)
barrel(27.2, -9, .8)

export const walletM = new THREE.Mesh(new THREE.BoxGeometry(.32, .09, .24), mat(0x5a3a24, { map: woodTex, roughness: 0.7 }))
walletM.position.set(28.6, .08, 5.2)
walletM.rotation.y = .6
scene.add(walletM)
tagInteractive(walletM, 'wallet', '破旧的钱包', 'item')

gateMesh = new THREE.Group()
for (let i = 0; i < 6; i++) {
  const b = new THREE.Mesh(new THREE.BoxGeometry(.1, 1.5, .1), mat(0x2c2f36, { metalness: 0.6 }))
  b.position.set(26 + i * .85, .75, 0)
  gateMesh.add(b)
  const tip = new THREE.Mesh(new THREE.ConeGeometry(.07, .2, 4), mat(0x2c2f36, { metalness: 0.7 }))
  tip.position.set(26 + i * .85, 1.6, 0)
  gateMesh.add(tip)
}
const gb = new THREE.Mesh(new THREE.BoxGeometry(5.2, .12, .12), mat(0x3a3e46, { metalness: 0.65 }))
gb.position.set(28.2, 1.2, 0)
gateMesh.add(gb)
const gb2 = gb.clone()
gb2.position.y = .4
gateMesh.add(gb2)
scene.add(gateMesh)
tagInteractive(gb, 'gate', '暗巷栅栏门', 'env')

export function openGate() {
  if (hasFlag('gateOpen')) {
    return
  }
  setFlag('gateOpen')
  scene.remove(gateMesh)
}

// 告示板
const boardProp = new THREE.Group()
const corkTex = canvasTex(128, 128, (x, w, h) => {
  x.fillStyle = '#826244'
  x.fillRect(0, 0, w, h)
  for (let i = 0; i < 300; i++) {
    x.fillStyle = Math.random() < 0.5 ? 'rgba(80, 50, 25, 0.4)' : 'rgba(165, 130, 95, 0.35)'
    x.fillRect(rand(0, w), rand(0, h), rand(2, 4), rand(2, 4))
  }
})
box(.16, 2.2, .16, 0x3a2e22, -1.4, 1.1, 7.2)
box(.16, 2.2, .16, 0x3a2e22, .6, 1.1, 7.2)
const cork = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.5, .1), mat(0x8a6844, { map: corkTex, roughness: 0.9 }))
cork.position.set(-.4, 1.55, 7.2)
cork.castShadow = true
boardProp.add(cork)

const frameT = new THREE.Mesh(new THREE.BoxGeometry(2.52, .1, .14), mat(0x322418, { map: woodTex }))
frameT.position.set(-.4, 2.32, 7.2)
boardProp.add(frameT)
const frameB = frameT.clone()
frameB.position.y = .78
boardProp.add(frameB)

scene.add(boardProp)
blockRect(-1.5, 7.0, .7, 7.4, 0)
for (let i = 0; i < 4; i++) {
  const p = new THREE.Mesh(new THREE.PlaneGeometry(.4, .5), new THREE.MeshBasicMaterial({ color: i % 2 ? 0xe0d4b8 : 0xcfd4da }))
  p.position.set(-1.1 + i * .45, 1.55 + rand(-.2, .2), 7.26)
  p.rotation.z = rand(-.2, .2)
  boardProp.add(p)
}
tagInteractive(cork, 'board', '调查告示板', 'board')

// 喷泉
const fountainGroup = new THREE.Group()
const fbase = new THREE.Mesh(new THREE.CylinderGeometry(2.1, 2.35, .75, 24), mat(0x363f4a, { roughness: 0.65, metalness: 0.18 }))
fbase.position.y = .375
fbase.castShadow = true
fbase.receiveShadow = true
fountainGroup.add(fbase)

const fRim = new THREE.Mesh(new THREE.TorusGeometry(2.15, 0.12, 8, 24), mat(0x28303a, { roughness: 0.6 }))
fRim.rotation.x = Math.PI / 2
fRim.position.y = .74
fountainGroup.add(fRim)

const fwaterTex = canvasTex(256, 256, (x, w, h) => {
  x.fillStyle = '#1b3f56'
  x.fillRect(0, 0, w, h)
  const cx = w / 2, cy = h / 2
  for (let r = 10; r < 120; r += 16) {
    x.strokeStyle = 'rgba(120, 200, 240, 0.28)'
    x.lineWidth = 3
    x.beginPath()
    x.arc(cx, cy, r, 0, Math.PI * 2)
    x.stroke()
  }
})

export const fwater = new THREE.Mesh(new THREE.CircleGeometry(1.9, 32), new THREE.MeshStandardMaterial({
  map: fwaterTex,
  color: 0x1f506e,
  roughness: 0.15,
  metalness: 0.4,
  transparent: true,
  opacity: 0.88,
}))
fwater.rotation.x = -Math.PI / 2
fwater.position.y = .72
fountainGroup.add(fwater)

const fpil = new THREE.Mesh(new THREE.CylinderGeometry(.22, .34, 1.6, 12), mat(0x404854, { roughness: 0.6, metalness: 0.2 }))
fpil.position.y = 1.35
fpil.castShadow = true
fountainGroup.add(fpil)

const fBowl = new THREE.Mesh(new THREE.CylinderGeometry(.68, .42, .24, 16), mat(0x353d48, { roughness: 0.6, metalness: 0.2 }))
fBowl.position.y = 1.85
fBowl.castShadow = true
fountainGroup.add(fBowl)

const fSpout = new THREE.Mesh(new THREE.SphereGeometry(.14, 10, 10), mat(0x525c68, { metalness: 0.4 }))
fSpout.position.y = 2.05
fountainGroup.add(fSpout)

fountainGroup.position.set(0, 0, 0)
scene.add(fountainGroup)

for (let gx = -2; gx <= 2; gx++) {
  for (let gz = -2; gz <= 2; gz++) {
    if (gx * gx + gz * gz <= 5.3) {
      const gX = gx + 40, gZ = gz + 28
      blocked[gZ * GW + gX] = 1
    }
  }
}
tagInteractive(fbase, 'fountain', '广场喷泉', 'env')

/* ── 粒子系统 ── */
const mistTex = canvasTex(128, 128, (x, w, h) => {
  const g = x.createRadialGradient(64, 64, 4, 64, 64, 64)
  g.addColorStop(0, 'rgba(190, 215, 245, 0.95)')
  g.addColorStop(0.3, 'rgba(150, 180, 220, 0.45)')
  g.addColorStop(0.65, 'rgba(110, 140, 185, 0.12)')
  g.addColorStop(1, 'rgba(70, 100, 150, 0)')
  x.fillStyle = g
  x.fillRect(0, 0, w, h)
})

const mistCount = 140
const mistGeo = new THREE.BufferGeometry()
const mistPos = new Float32Array(mistCount * 3)
const mistVel = []
for (let i = 0; i < mistCount; i++) {
  mistPos[i * 3] = rand(-38, 38)
  mistPos[i * 3 + 1] = rand(0.3, 1.8)
  mistPos[i * 3 + 2] = rand(-26, 26)
  mistVel.push({
    vx: rand(-0.45, -0.18),
    vz: rand(-0.12, 0.12),
    baseY: rand(0.5, 1.4),
    phase: Math.random() * Math.PI * 2,
  })
}
mistGeo.setAttribute('position', new THREE.BufferAttribute(mistPos, 3))
const mistPoints = new THREE.Points(
  mistGeo,
  new THREE.PointsMaterial({
    map: mistTex,
    size: 7.6,
    transparent: true,
    opacity: 0.17,
    depthWrite: false,
    blending: THREE.NormalBlending,
  }),
)
scene.add(mistPoints)

const sparkTex = canvasTex(64, 64, (x, w, h) => {
  const g = x.createRadialGradient(32, 32, 2, 32, 32, 32)
  g.addColorStop(0, '#ffffff')
  g.addColorStop(0.2, '#ffea78')
  g.addColorStop(0.55, 'rgba(255, 110, 20, 0.75)')
  g.addColorStop(1, 'rgba(255, 60, 0, 0)')
  x.fillStyle = g
  x.fillRect(0, 0, w, h)
})

const sparkCount = 60
const sparkGeo = new THREE.BufferGeometry()
const sparkPos = new Float32Array(sparkCount * 3)
const sparkColors = new Float32Array(sparkCount * 3)
const sparkData = []
for (let i = 0; i < sparkCount; i++) {
  sparkPos[i * 3] = -24.6 + rand(-0.45, 0.45)
  sparkPos[i * 3 + 1] = 1.4 + rand(0, 1.8)
  sparkPos[i * 3 + 2] = -18.15 + rand(-0.35, 0.35)
  sparkColors[i * 3] = 1.0
  sparkColors[i * 3 + 1] = 0.75
  sparkColors[i * 3 + 2] = 0.2
  sparkData.push({
    vy: rand(0.65, 1.45),
    vx: rand(-0.15, 0.15),
    vz: rand(-0.15, 0.15),
    life: rand(0.6, 2.2),
    age: Math.random() * 2.0,
    sway: rand(1.5, 3.5),
    seed: Math.random() * 20,
  })
}
sparkGeo.setAttribute('position', new THREE.BufferAttribute(sparkPos, 3))
sparkGeo.setAttribute('color', new THREE.BufferAttribute(sparkColors, 3))
const sparkPoints = new THREE.Points(
  sparkGeo,
  new THREE.PointsMaterial({
    map: sparkTex,
    vertexColors: true,
    size: 0.32,
    transparent: true,
    opacity: 0.95,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  }),
)
scene.add(sparkPoints)

const smokeCount = 18
const smokeGeo = new THREE.BufferGeometry()
const smokePos = new Float32Array(smokeCount * 3)
const smokeData = []
for (let i = 0; i < smokeCount; i++) {
  smokePos[i * 3] = -24.6 + rand(-0.25, 0.25)
  smokePos[i * 3 + 1] = 1.6 + rand(0, 2.0)
  smokePos[i * 3 + 2] = -18.15 + rand(-0.2, 0.2)
  smokeData.push({
    vy: rand(0.4, 0.8),
    age: Math.random() * 3.0,
    life: rand(2.2, 3.8),
    seed: Math.random() * 10,
  })
}
smokeGeo.setAttribute('position', new THREE.BufferAttribute(smokePos, 3))
const smokePoints = new THREE.Points(
  smokeGeo,
  new THREE.PointsMaterial({
    map: mistTex,
    size: 2.2,
    color: 0x38302a,
    transparent: true,
    opacity: 0.22,
    depthWrite: false,
  }),
)
scene.add(smokePoints)

const rainStreakTex = canvasTex(32, 128, (x, w, h) => {
  const gr = x.createLinearGradient(0, 0, 0, h)
  gr.addColorStop(0, 'rgba(160, 195, 230, 0)')
  gr.addColorStop(0.4, 'rgba(175, 210, 245, 0.55)')
  gr.addColorStop(1, 'rgba(215, 235, 255, 0.9)')
  x.fillStyle = gr
  x.fillRect(w / 2 - 2, 0, 4, h)
})

const rainCount = 320
const rainGeo = new THREE.BufferGeometry()
const rainPos = new Float32Array(rainCount * 3)
const rainVel = []
for (let i = 0; i < rainCount; i++) {
  rainPos[i * 3] = rand(-40, 40)
  rainPos[i * 3 + 1] = rand(0.5, 24)
  rainPos[i * 3 + 2] = rand(-28, 28)
  rainVel.push(rand(14.0, 22.0))
}
rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPos, 3))
const rainPoints = new THREE.Points(
  rainGeo,
  new THREE.PointsMaterial({
    map: rainStreakTex,
    color: 0x9ec0e2,
    size: 0.28,
    transparent: true,
    opacity: 0.48,
    depthWrite: false,
  }),
)
scene.add(rainPoints)

const splashTex = canvasTex(64, 64, (x, w, h) => {
  const cx = w / 2, cy = h / 2
  x.strokeStyle = 'rgba(190, 220, 255, 0.85)'
  x.lineWidth = 3
  x.beginPath()
  x.arc(cx, cy, 24, 0, Math.PI * 2)
  x.stroke()
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI) / 3
    x.fillStyle = 'rgba(215, 235, 255, 0.9)'
    x.fillRect(cx + Math.cos(a) * 26 - 1, cy + Math.sin(a) * 26 - 1, 3, 3)
  }
})

const splashCount = 36
const splashGeo = new THREE.BufferGeometry()
const splashPos = new Float32Array(splashCount * 3)
const splashData = []
for (let i = 0; i < splashCount; i++) {
  splashPos[i * 3] = rand(-38, 38)
  splashPos[i * 3 + 1] = 0.05
  splashPos[i * 3 + 2] = rand(-26, 26)
  splashData.push({
    life: rand(0.2, 0.45),
    age: Math.random() * 0.4,
  })
}
splashGeo.setAttribute('position', new THREE.BufferAttribute(splashPos, 3))
const splashPoints = new THREE.Points(
  splashGeo,
  new THREE.PointsMaterial({
    map: splashTex,
    size: 0.65,
    transparent: true,
    opacity: 0.38,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  }),
)
scene.add(splashPoints)

const fDropletCount = 42
const fDropGeo = new THREE.BufferGeometry()
const fDropPos = new Float32Array(fDropletCount * 3)
const fDropVel = []
for (let i = 0; i < fDropletCount; i++) {
  const ang = (i / fDropletCount) * Math.PI * 2
  const spd = rand(0.5, 1.1)
  fDropPos[i * 3] = 0
  fDropPos[i * 3 + 1] = 2.05
  fDropPos[i * 3 + 2] = 0
  fDropVel.push({
    vx: Math.cos(ang) * spd,
    vy: rand(1.2, 2.2),
    vz: Math.sin(ang) * spd,
    age: Math.random() * 1.5,
  })
}
fDropGeo.setAttribute('position', new THREE.BufferAttribute(fDropPos, 3))
const fDropPoints = new THREE.Points(
  fDropGeo,
  new THREE.PointsMaterial({
    color: 0x98d4f8,
    size: 0.16,
    transparent: true,
    opacity: 0.75,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  }),
)
scene.add(fDropPoints)

const moteCount = 36
const moteGeo = new THREE.BufferGeometry()
const motePos = new Float32Array(moteCount * 3)
const moteData = []
for (let i = 0; i < moteCount; i++) {
  const lampIdx = i % 6
  const lpos = [[-10, -4.4], [10, -4.4], [-4.4, 12], [4.4, -13], [5.5, 5.5], [26.2, -1]][lampIdx]
  motePos[i * 3] = lpos[0] + rand(-0.6, 0.6)
  motePos[i * 3 + 1] = 3.5 + rand(-0.4, 0.4)
  motePos[i * 3 + 2] = lpos[1] + rand(-0.6, 0.6)
  moteData.push({
    lx: lpos[0],
    lz: lpos[1],
    ang: Math.random() * Math.PI * 2,
    rad: rand(0.3, 0.85),
    spd: rand(1.2, 2.5),
    bob: rand(1.5, 4.0),
  })
}
moteGeo.setAttribute('position', new THREE.BufferAttribute(motePos, 3))
const motePoints = new THREE.Points(
  moteGeo,
  new THREE.PointsMaterial({
    map: sparkTex,
    color: 0xffd27a,
    size: 0.22,
    transparent: true,
    opacity: 0.85,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  }),
)
scene.add(motePoints)

export function updateAtmosphere(dt, now) {
  const mPos = mistGeo.attributes.position.array
  for (let i = 0; i < mistCount; i++) {
    const idx = i * 3
    const v = mistVel[i]
    mPos[idx] += v.vx * dt
    mPos[idx + 2] += v.vz * dt
    mPos[idx + 1] = v.baseY + Math.sin(now / 1400 + v.phase) * 0.35
    if (mPos[idx] < -42) {
      mPos[idx] = 42
    }
  }
  mistGeo.attributes.position.needsUpdate = true

  const sPos = sparkGeo.attributes.position.array
  const sCol = sparkGeo.attributes.color.array
  for (let i = 0; i < sparkCount; i++) {
    const idx = i * 3
    const d = sparkData[i]
    d.age += dt
    sPos[idx + 1] += d.vy * dt
    sPos[idx] += Math.sin(now / 350 + d.seed) * 0.015 + d.vx * dt
    sPos[idx + 2] += Math.cos(now / 350 + d.seed) * 0.015 + d.vz * dt
    const progress = d.age / d.life
    if (progress < 0.4) {
      sCol[idx] = 1.0
      sCol[idx + 1] = 0.85 - progress * 0.6
      sCol[idx + 2] = 0.35
    } else {
      sCol[idx] = 1.0 - (progress - 0.4) * 0.7
      sCol[idx + 1] = 0.3 * (1.0 - progress)
      sCol[idx + 2] = 0.05
    }
    if (d.age >= d.life || sPos[idx + 1] > 3.6) {
      d.age = 0
      d.life = rand(0.8, 2.2)
      sPos[idx] = -24.6 + rand(-0.4, 0.4)
      sPos[idx + 1] = 1.4
      sPos[idx + 2] = -18.15 + rand(-0.3, 0.3)
      d.vy = rand(0.7, 1.5)
      d.vx = rand(-0.18, 0.18)
      d.vz = rand(-0.18, 0.18)
    }
  }
  sparkGeo.attributes.position.needsUpdate = true
  sparkGeo.attributes.color.needsUpdate = true

  const smPos = smokeGeo.attributes.position.array
  for (let i = 0; i < smokeCount; i++) {
    const idx = i * 3
    const d = smokeData[i]
    d.age += dt
    smPos[idx + 1] += d.vy * dt
    smPos[idx] += Math.sin(now / 600 + d.seed) * 0.008
    if (d.age >= d.life || smPos[idx + 1] > 3.8) {
      d.age = 0
      smPos[idx] = -24.6 + rand(-0.25, 0.25)
      smPos[idx + 1] = 1.6
      smPos[idx + 2] = -18.15 + rand(-0.2, 0.2)
    }
  }
  smokeGeo.attributes.position.needsUpdate = true

  const rPos = rainGeo.attributes.position.array
  for (let i = 0; i < rainCount; i++) {
    const idx = i * 3
    rPos[idx + 1] -= rainVel[i] * dt
    rPos[idx] -= dt * 2.8
    if (rPos[idx + 1] < 0.08) {
      rPos[idx] = rand(-40, 40)
      rPos[idx + 1] = rand(16, 24)
      rPos[idx + 2] = rand(-28, 28)
    }
  }
  rainGeo.attributes.position.needsUpdate = true

  const spPos = splashGeo.attributes.position.array
  for (let i = 0; i < splashCount; i++) {
    const idx = i * 3
    const d = splashData[i]
    d.age += dt
    if (d.age >= d.life) {
      d.age = 0
      d.life = rand(0.2, 0.45)
      spPos[idx] = rand(-38, 38)
      spPos[idx + 2] = rand(-26, 26)
    }
  }
  splashGeo.attributes.position.needsUpdate = true

  const fdPos = fDropGeo.attributes.position.array
  for (let i = 0; i < fDropletCount; i++) {
    const idx = i * 3
    const v = fDropVel[i]
    v.age += dt
    fdPos[idx] += v.vx * dt
    fdPos[idx + 1] += v.vy * dt
    fdPos[idx + 2] += v.vz * dt
    v.vy -= 4.2 * dt
    if (fdPos[idx + 1] <= 0.72 || v.age > 1.2) {
      v.age = 0
      const ang = (i / fDropletCount) * Math.PI * 2 + Math.random() * 0.2
      const spd = rand(0.4, 0.95)
      fdPos[idx] = 0
      fdPos[idx + 1] = 2.05
      fdPos[idx + 2] = 0
      v.vx = Math.cos(ang) * spd
      v.vy = rand(1.4, 2.2)
      v.vz = Math.sin(ang) * spd
    }
  }
  fDropGeo.attributes.position.needsUpdate = true

  const mtPos = moteGeo.attributes.position.array
  for (let i = 0; i < moteCount; i++) {
    const idx = i * 3
    const d = moteData[i]
    d.ang += d.spd * dt
    mtPos[idx] = d.lx + Math.cos(d.ang) * d.rad
    mtPos[idx + 1] = 3.52 + Math.sin(now / 500 + d.bob) * 0.35
    mtPos[idx + 2] = d.lz + Math.sin(d.ang) * d.rad
  }
  moteGeo.attributes.position.needsUpdate = true
}

// 背景房屋与树木
solidHouse(-33, 10, 7, 6, 3.4, 0x3e3a44, 0x26222c)
solidHouse(-33, -8, 7, 6, 3.2, 0x443e38, 0x2a2622)
solidHouse(34, -9, 7, 6, 3.4, 0x3c4046, 0x24282e)
solidHouse(9, 20, 7, 5.5, 3, 0x464038, 0x2a2620)
solidHouse(-9, 21, 7, 5.5, 3.2, 0x40383e, 0x282228)
solidHouse(34.5, 12, 6.5, 6, 3.2, 0x3e4448, 0x24282c)

tree(-30, 2, 1.2)
tree(-12, -23, 1)
tree(6, -22, 1.15)
tree(28, -20, 1)
tree(35, 4, 1.2)
tree(-36, -16, 1.1)
tree(-36, 18, 1)
tree(12, 24, 1.1)
tree(-12, 24, 1)

lamp(-10, -4.4)
lamp(10, -4.4)
lamp(-4.4, 12)
lamp(4.4, -13)
lamp(5.5, 5.5)
lamp(26.2, -1)

// 世界标签（区域）
export const ZONES = [
  { id: 'plaza', n: '集市广场', x: [-8, 8], z: [-8, 8] },
  { id: 'smith', n: '铁匠铺 · 案发现场', x: [-27, -13], z: [-21, -9] },
  { id: 'tavern', n: '「野猪头」酒馆', x: [9, 25], z: [-19, -7] },
  { id: 'alley', n: '暗巷', x: [25, 32], z: [-17, 15] },
  { id: 'home', n: '玛莎的家', x: [-25, -15], z: [7, 17] },
  { id: 'pawn', n: '巴罗当铺', x: [13, 25], z: [7, 17] },
]

export function zoneAt(x, z) {
  for (const zn of ZONES) {
    if (x >= zn.x[0] && x <= zn.x[1] && z >= zn.z[0] && z <= zn.z[1]) {
      return zn
    }
  }
  return null
}

/* ── 角色 ── */
export function makeChar(coat, hatC, opts) {
  opts = opts || {}
  const role = opts.role || 'detective'
  const g = new THREE.Group()

  const torsoGroup = new THREE.Group()
  torsoGroup.position.y = 0.9
  g.add(torsoGroup)

  const skinColor = role === 'martha' ? 0xe2c7b2 : (role === 'pete' ? 0xd4a08c : (role === 'coroner' ? 0xc8b6a4 : 0xd5b99f))
  const skinM = mat(skinColor, { roughness: 0.62, metalness: 0.02 })
  const eyeM = mat(0x18202c, { roughness: 0.25, metalness: 0.1 })
  const hairC = opts.hair || (role === 'coroner' ? 0x72767d : (role === 'greta' ? 0x8a847e : (role === 'luke' ? 0x5a3e24 : 0x221a16)))
  const hairM = mat(hairC, { roughness: 0.9 })
  const goldM = mat(0xd4af37, { metalness: 0.88, roughness: 0.22 })
  const silverM = mat(0xa8b0bc, { metalness: 0.8, roughness: 0.28 })
  const blackLeatherM = mat(0x1a1818, { roughness: 0.52, metalness: 0.08 })
  const brownLeatherM = mat(0x382416, { roughness: 0.58, metalness: 0.05 })
  const shirtM = mat(0xe2ded6, { roughness: 0.8 })
  const pantColor = role === 'sheriff' ? 0x1a283c : (role === 'luke' ? 0x4a341e : (role === 'barrow' ? 0x1a141c : 0x1f2229))
  const pantM = mat(pantColor, { roughness: 0.85 })
  const coatM = mat(coat, { roughness: 0.82, metalness: 0.06 })

  const headGroup = new THREE.Group()
  headGroup.position.y = 0.68
  torsoGroup.add(headGroup)
  g.userData.headGroup = headGroup

  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.09, 0.14, 8), skinM)
  neck.position.y = -0.16
  neck.castShadow = true
  headGroup.add(neck)

  const head = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.28, 0.26), skinM)
  head.castShadow = true
  headGroup.add(head)

  const chin = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.09, 0.22), skinM)
  chin.position.set(0, -0.13, 0.02)
  chin.castShadow = true
  headGroup.add(chin)

  const noseColor = role === 'pete' ? 0xc86a5a : skinColor
  const noseM = role === 'pete' ? mat(noseColor, { roughness: 0.55 }) : skinM
  const nose = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.07, 0.05), noseM)
  nose.position.set(0, -0.01, 0.15)
  headGroup.add(nose)

  const browM = mat(hairC, { roughness: 0.9 })
  for (const side of [-1, 1]) {
    const brow = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.022, 0.03), browM)
    brow.position.set(side * 0.065, 0.05, 0.135)
    brow.rotation.z = side * (role === 'martha' ? 0.08 : (role === 'pete' ? -0.12 : -0.08))
    headGroup.add(brow)

    const eye = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.03, 0.02), eyeM)
    eye.position.set(side * 0.065, 0.015, 0.135)
    headGroup.add(eye)

    const ear = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.08, 0.05), skinM)
    ear.position.set(side * 0.14, 0, -0.02)
    headGroup.add(ear)
  }

  if (role === 'sheriff') {
    const st = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.035, 0.04), browM)
    st.position.set(0, -0.06, 0.14)
    headGroup.add(st)
  } else if (role === 'barrow') {
    const musL = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.028, 0.03), browM)
    musL.position.set(-0.045, -0.055, 0.145)
    musL.rotation.z = -0.22
    headGroup.add(musL)
    const musR = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.028, 0.03), browM)
    musR.position.set(0.045, -0.055, 0.145)
    musR.rotation.z = 0.22
    headGroup.add(musR)
  } else if (role === 'pete') {
    const stubble = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.09, 0.05), mat(0x423832, { roughness: 0.95 }))
    stubble.position.set(0, -0.09, 0.125)
    headGroup.add(stubble)
  }

  if (!opts.hat || role === 'martha') {
    if (role === 'martha') {
      const hairBase = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.22, 0.28), hairM)
      hairBase.position.set(0, 0.08, -0.02)
      headGroup.add(hairBase)
      const bun = new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 8), hairM)
      bun.position.set(0, 0.06, -0.17)
      headGroup.add(bun)
      const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.22, 6), silverM)
      pin.rotation.z = 0.7
      pin.position.set(0, 0.09, -0.17)
      headGroup.add(pin)
      for (const side of [-1, 1]) {
        const strand = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.18, 0.04), hairM)
        strand.position.set(side * 0.14, -0.04, 0.06)
        headGroup.add(strand)
      }
    } else {
      const hBack = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.26, 0.27), hairM)
      hBack.position.set(0, 0.06, -0.02)
      headGroup.add(hBack)
    }
  }

  if (opts.hat !== false && role !== 'martha') {
    const hatColor = hatC || 0x20242c
    const hatM = mat(hatColor, { roughness: 0.76, metalness: 0.06 })
    const ribbonM = mat(role === 'barrow' ? 0x4a121d : 0x15161a, { roughness: 0.5, metalness: 0.2 })

    if (role === 'barrow') {
      const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.27, 0.03, 14), hatM)
      brim.position.y = 0.16
      headGroup.add(brim)
      const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.185, 0.18, 0.32, 14), hatM)
      crown.position.y = 0.32
      headGroup.add(crown)
      const rib = new THREE.Mesh(new THREE.CylinderGeometry(0.188, 0.183, 0.05, 14), ribbonM)
      rib.position.y = 0.19
      headGroup.add(rib)
    } else if (role === 'sheriff') {
      const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.03, 14), hatM)
      brim.position.y = 0.15
      headGroup.add(brim)
      const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.21, 0.17, 12), hatM)
      crown.position.y = 0.24
      headGroup.add(crown)
      const star = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.02), goldM)
      star.position.set(0, 0.24, 0.21)
      star.rotation.z = 0.78
      headGroup.add(star)
    } else if (role === 'luke') {
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.23, 0.19, 0.11, 10), hatM)
      cap.position.set(0, 0.19, 0.02)
      cap.rotation.x = 0.12
      headGroup.add(cap)
      const visor = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.025, 0.09), hatM)
      visor.position.set(0, 0.14, 0.16)
      visor.rotation.x = 0.18
      headGroup.add(visor)
      const fringe = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.05, 0.04), hairM)
      fringe.position.set(0, 0.11, 0.13)
      headGroup.add(fringe)
    } else if (role === 'greta') {
      const kerchief = new THREE.Mesh(new THREE.SphereGeometry(0.23, 10, 8), mat(hatColor, { roughness: 0.9 }))
      kerchief.position.set(0, 0.08, -0.02)
      headGroup.add(kerchief)
      const knot = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.06, 0.05), mat(hatColor, { roughness: 0.9 }))
      knot.position.set(0, -0.15, 0.13)
      headGroup.add(knot)
    } else if (role === 'pete') {
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.21, 0.09, 10), hatM)
      cap.position.set(0.03, 0.18, -0.01)
      cap.rotation.z = -0.22
      cap.rotation.x = -0.1
      headGroup.add(cap)
      const messyH = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.06, 0.08), hairM)
      messyH.position.set(-0.11, 0.12, 0.08)
      headGroup.add(messyH)
    } else {
      const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.31, 0.32, 0.025, 14), hatM)
      brim.position.y = 0.15
      headGroup.add(brim)
      const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.20, 0.17, 12), hatM)
      crown.position.y = 0.24
      crown.scale.set(0.92, 1, 1.1)
      headGroup.add(crown)
      const pinch = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.06, 0.16), hatM)
      pinch.position.set(0, 0.31, 0.04)
      headGroup.add(pinch)
      const rib = new THREE.Mesh(new THREE.CylinderGeometry(0.195, 0.202, 0.04, 12), ribbonM)
      rib.position.y = 0.18
      headGroup.add(rib)

      if (role === 'coroner') {
        const monocle = new THREE.Mesh(new THREE.TorusGeometry(0.028, 0.005, 6, 12), goldM)
        monocle.position.set(0.065, 0.015, 0.15)
        headGroup.add(monocle)
        const chain = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.003, 0.22, 4), goldM)
        chain.position.set(0.09, -0.08, 0.13)
        chain.rotation.z = -0.3
        headGroup.add(chain)
      }
    }
  }

  const chest = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.40, 0.28), coatM)
  chest.position.y = 0.24
  chest.castShadow = true
  torsoGroup.add(chest)

  const belly = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.22, 0.25), coatM)
  belly.position.y = -0.03
  belly.castShadow = true
  torsoGroup.add(belly)

  const shirt = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.30, 0.04), shirtM)
  shirt.position.set(0, 0.26, 0.13)
  torsoGroup.add(shirt)

  const lapelMat = role === 'barrow' ? mat(0x241818, { roughness: 0.95 }) : mat(opts.lapel || coat, { roughness: 0.82 })
  for (const side of [-1, 1]) {
    const lapel = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.32, 0.04), lapelMat)
    lapel.position.set(side * 0.12, 0.26, 0.145)
    lapel.rotation.z = side * -0.2
    torsoGroup.add(lapel)
  }

  if (role === 'coroner' || role === 'barrow') {
    const tie = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.04, 0.03), mat(0x5a1a24, { roughness: 0.6 }))
    tie.position.set(0, 0.38, 0.15)
    torsoGroup.add(tie)
  } else if (role !== 'martha' && role !== 'greta' && !opts.scarf) {
    const tie = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.22, 0.02), mat(0x22262e, { roughness: 0.7 }))
    tie.position.set(0, 0.26, 0.15)
    torsoGroup.add(tie)
  }

  for (let r = 0; r < 3; r++) {
    const btnY = 0.14 + r * 0.09
    const btnM = role === 'sheriff' || role === 'barrow' ? goldM : mat(0x202428, { metalness: 0.7, roughness: 0.3 })
    for (const side of [-1, 1]) {
      const btn = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.015, 6), btnM)
      btn.rotation.x = Math.PI / 2
      btn.position.set(side * 0.065, btnY, 0.14)
      torsoGroup.add(btn)
    }
  }

  if (opts.badge || role === 'sheriff') {
    const star = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.02), goldM)
    star.position.set(-0.13, 0.34, 0.15)
    star.rotation.z = 0.78
    torsoGroup.add(star)
  }

  if (role === 'barrow') {
    const chain = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.007, 4, 10, Math.PI), goldM)
    chain.position.set(0, 0.12, 0.14)
    chain.rotation.x = Math.PI
    torsoGroup.add(chain)
  }

  if (opts.scarf) {
    const sMat = mat(opts.scarf, { roughness: 0.88 })
    const sNeck = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.20, 0.14, 10), sMat)
    sNeck.position.y = 0.47
    torsoGroup.add(sNeck)
    const sTail = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.38, 0.04), sMat)
    sTail.position.set(-0.09, 0.27, 0.16)
    sTail.rotation.z = 0.14
    torsoGroup.add(sTail)
  }

  if (role === 'martha') {
    const shawlM = mat(0x50425a, { roughness: 0.9 })
    const shawl = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.22, 0.30), shawlM)
    shawl.position.set(0, 0.32, -0.01)
    torsoGroup.add(shawl)
    const brooch = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 8), silverM)
    brooch.position.set(0, 0.34, 0.15)
    torsoGroup.add(brooch)
  }

  const belt = new THREE.Mesh(new THREE.BoxGeometry(0.40, 0.07, 0.26), blackLeatherM)
  belt.position.y = -0.14
  torsoGroup.add(belt)
  const buckle = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.08, 0.03), goldM)
  buckle.position.set(0, -0.14, 0.14)
  torsoGroup.add(buckle)

  if (role === 'sheriff') {
    const holster = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.20, 0.10), brownLeatherM)
    holster.position.set(0.22, -0.24, 0.04)
    holster.rotation.z = -0.15
    torsoGroup.add(holster)
    const grip = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.08, 0.05), brownLeatherM)
    grip.position.set(0.23, -0.13, 0.06)
    grip.rotation.x = -0.3
    torsoGroup.add(grip)
  } else if (role === 'pete') {
    const flask = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.10, 0.04), silverM)
    flask.position.set(0.21, -0.20, 0.05)
    flask.rotation.z = -0.2
    torsoGroup.add(flask)
  } else if (role === 'luke') {
    const pouch = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.12, 0.06), brownLeatherM)
    pouch.position.set(-0.21, -0.20, 0.04)
    torsoGroup.add(pouch)
  }

  if (role === 'martha' || role === 'greta') {
    const skirtM = role === 'martha' ? coatM : mat(coat, { roughness: 0.88 })
    const skirt = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.40, 0.68, 12), skirtM)
    skirt.position.y = -0.50
    skirt.castShadow = true
    torsoGroup.add(skirt)

    const apronM = mat(0xdad5c8, { roughness: 0.9 })
    const apron = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.50, 0.02), apronM)
    apron.position.set(0, -0.44, 0.22)
    torsoGroup.add(apron)

    for (const side of [-1, 1]) {
      const bootToe = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.05, 0.10), blackLeatherM)
      bootToe.position.set(side * 0.10, -0.87, 0.18)
      torsoGroup.add(bootToe)
    }
  } else {
    const skirtGroup = new THREE.Group()
    skirtGroup.position.y = -0.18
    torsoGroup.add(skirtGroup)

    const flapL = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.36, 0.24), coatM)
    flapL.position.set(-0.20, -0.16, 0)
    flapL.rotation.z = -0.08
    flapL.castShadow = true
    skirtGroup.add(flapL)

    const flapR = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.36, 0.24), coatM)
    flapR.position.set(0.20, -0.16, 0)
    flapR.rotation.z = 0.08
    flapR.castShadow = true
    skirtGroup.add(flapR)

    for (const side of [-1, 1]) {
      const flapBack = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.36, 0.03), coatM)
      flapBack.position.set(side * 0.10, -0.16, -0.13)
      flapBack.rotation.x = -0.06
      flapBack.castShadow = true
      skirtGroup.add(flapBack)
    }
  }

  const leftLeg = new THREE.Group()
  leftLeg.position.set(-0.12, -0.18, 0)
  torsoGroup.add(leftLeg)
  g.userData.leftLeg = leftLeg

  const rightLeg = new THREE.Group()
  rightLeg.position.set(0.12, -0.18, 0)
  torsoGroup.add(rightLeg)
  g.userData.rightLeg = rightLeg

  for (const leg of [leftLeg, rightLeg]) {
    const thigh = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.32, 0.14), pantM)
    thigh.position.y = -0.16
    thigh.castShadow = true
    leg.add(thigh)

    const calf = new THREE.Mesh(new THREE.BoxGeometry(0.115, 0.22, 0.125), pantM)
    calf.position.y = -0.38
    calf.castShadow = true
    leg.add(calf)

    const bootShaft = new THREE.Mesh(new THREE.BoxGeometry(0.125, 0.18, 0.135), blackLeatherM)
    bootShaft.position.y = -0.52
    bootShaft.castShadow = true
    leg.add(bootShaft)

    const bootFoot = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.085, 0.22), blackLeatherM)
    bootFoot.position.set(0, -0.66, 0.05)
    bootFoot.castShadow = true
    leg.add(bootFoot)

    const bootSole = new THREE.Mesh(new THREE.BoxGeometry(0.126, 0.03, 0.23), mat(0x0e0e10, { roughness: 0.9 }))
    bootSole.position.set(0, -0.705, 0.05)
    leg.add(bootSole)
  }

  const armMat = role === 'luke' ? mat(0xdedad2, { roughness: 0.85 }) : coatM

  const leftArm = new THREE.Group()
  leftArm.position.set(-0.27, 0.36, 0)
  torsoGroup.add(leftArm)
  g.userData.leftArm = leftArm

  const lShoulder = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), coatM)
  leftArm.add(lShoulder)

  const lBicep = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.065, 0.24, 8), armMat)
  lBicep.position.set(0, -0.13, 0)
  lBicep.castShadow = true
  leftArm.add(lBicep)

  const lForearm = new THREE.Mesh(new THREE.CylinderGeometry(0.062, 0.055, 0.22, 8), role === 'luke' ? skinM : armMat)
  lForearm.position.set(0, -0.34, 0.03)
  lForearm.rotation.x = 0.14
  lForearm.castShadow = true
  leftArm.add(lForearm)

  const lHand = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.09, 0.06), role === 'player' ? blackLeatherM : skinM)
  lHand.position.set(0, -0.48, 0.05)
  leftArm.add(lHand)

  const rightArm = new THREE.Group()
  rightArm.position.set(0.27, 0.36, 0)
  torsoGroup.add(rightArm)
  g.userData.rightArm = rightArm

  const rShoulder = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), coatM)
  rightArm.add(rShoulder)

  const rBicep = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.065, 0.24, 8), armMat)
  rBicep.position.set(0, -0.13, 0)
  rBicep.castShadow = true
  rightArm.add(rBicep)

  const rForearm = new THREE.Mesh(new THREE.CylinderGeometry(0.062, 0.055, 0.22, 8), role === 'luke' ? skinM : armMat)
  rForearm.position.set(0, -0.34, 0.03)
  rForearm.rotation.x = 0.14
  rForearm.castShadow = true
  rightArm.add(rForearm)

  const rHand = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.09, 0.06), role === 'player' ? blackLeatherM : skinM)
  rHand.position.set(0, -0.48, 0.05)
  rightArm.add(rHand)

  if (role === 'coroner') {
    const bag = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.20, 0.28), blackLeatherM)
    bag.position.set(0, -0.62, 0.06)
    bag.castShadow = true
    leftArm.add(bag)
    const bagHandle = new THREE.Mesh(new THREE.TorusGeometry(0.04, 0.012, 4, 8, Math.PI), goldM)
    bagHandle.position.set(0, -0.50, 0.06)
    bagHandle.rotation.z = Math.PI
    leftArm.add(bagHandle)
  }

  if (role === 'barrow') {
    const cane = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.012, 0.46, 8), blackLeatherM)
    cane.position.set(0.04, -0.68, 0.08)
    cane.castShadow = true
    rightArm.add(cane)
    const caneHead = new THREE.Mesh(new THREE.SphereGeometry(0.038, 10, 8), goldM)
    caneHead.position.set(0.04, -0.45, 0.08)
    rightArm.add(caneHead)
  }

  if (role === 'greta') {
    const basket = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.14, 0.22), mat(0x8a623c, { roughness: 0.9 }))
    basket.position.set(0, -0.40, 0.10)
    basket.castShadow = true
    leftArm.add(basket)
  }

  const sh = new THREE.Mesh(new THREE.CircleGeometry(.46, 16), new THREE.MeshBasicMaterial({ color: 0, transparent: true, opacity: .36 }))
  sh.rotation.x = -Math.PI / 2
  sh.position.y = .02
  g.add(sh)

  g.userData.bob = Math.random() * 6
  scene.add(g)
  return g
}

export const player = makeChar(0x2e333d, 0x1e222a, { scarf: 0xd9a441, role: 'player' })
player.position.set(0, 0, 10)

export const NPCS = {
  sheriff: { n: '警长 雷诺', pos: [-2.5, 5.2], coat: 0x2e4a6e, hat: 0x1e2c40, badge: true },
  coroner: { n: '验尸官 贝尔', pos: [-17.8, -13.4], coat: 0x565e66, hat: 0x3c434b },
  martha: { n: '玛莎 · 贝克', pos: [-20.5, 11.6], coat: 0x3e3549, hat: false, hair: 0x241d18 },
  luke: { n: '学徒 卢克', pos: [-22.0, -12.4], coat: 0x6e5638, hat: 0x4e3c26 },
  pete: { n: '醉汉 皮特', pos: [13.8, -10.4], coat: 0x4a5a3a, hat: 0x39462c },
  barrow: { n: '债主 巴罗', pos: [19.2, 12.0], coat: 0x5e2e3a, hat: 0x3c1e26 },
  greta: { n: '街坊 格蕾塔', pos: [3.2, -2.8], coat: 0x8a5e38, hat: 0x6e4a2c },
}

for (const k in NPCS) {
  const d = NPCS[k]
  d.mesh = makeChar(d.coat, d.hat, { hat: d.hat !== false, hair: d.hair, badge: d.badge, role: k })
  d.mesh.position.set(d.pos[0], 0, d.pos[1])
  const ring = new THREE.Mesh(new THREE.RingGeometry(.5, .62, 28),
    new THREE.MeshBasicMaterial({ color: 0xd9a441, transparent: true, opacity: 0, side: THREE.DoubleSide }))
  ring.rotation.x = -Math.PI / 2
  ring.position.y = .04
  d.mesh.add(ring)
  d.ring = ring
  tagInteractive(d.mesh, k, d.n, 'npc')
}

/* 标签层 */
export const labels = []

export function addLabel(getPos, html, cls, cond) {
  const el = document.createElement('div')
  el.className = 'wlabel' + (cls ? ' ' + cls : '')
  el.innerHTML = html
  $('labels').appendChild(el)
  labels.push({ el, getPos, cond })
  return el
}

for (const k in NPCS) {
  const d = NPCS[k]
  addLabel(
    () => d.mesh.position.clone().add(new THREE.Vector3(0, 2.15, 0)),
    `<span class="dot" style="background:#d9a441"></span>${d.n}`,
    '',
    () => dist2(player.position.x, player.position.z, d.pos[0], d.pos[1]) < 16,
  )
}

export const scanLabels = {}

export function ensureScanLabel(id) {
  if (scanLabels[id]) {
    return scanLabels[id]
  }
  const it = ITAB[id]
  const col = it.kind === 'npc' ? '#d9a441' : it.kind === 'clue' ? '#e05a5a' : it.kind === 'item' ? '#7fd0c4' : '#9aa4b4'
  const el = addLabel(
    () => it.mesh.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(0, it.kind === 'npc' ? 0 : 1.1, 0)),
    `<span class="dot" style="background:${col}"></span>${it.name}`,
    'scan',
    () => false,
  )
  el.style.opacity = 0
  scanLabels[id] = el
  return el
}

export function applyWorldFromFlags() {
  if (hasFlag('clue_hammer')) {
    ITAB.hammer.hidden = true
    hammerM.visible = false
    hamRing.visible = false
  }
  if (hasFlag('gateOpen')) {
    scene.remove(gateMesh)
  }
  ['clue_letter'].forEach(() => {})
  if (G.clues.includes('clue_letter')) {
    ITAB.letter.hidden = true
    letterM.visible = false
  }
  if (G.clues.includes('clue_apron')) {
    ITAB.barrels.hidden = true
    apronM.visible = true
  }
  if (!G.clues.includes('clue_apron')) {
    apronM.visible = false
  }
  if (G.inventory.includes('wallet') || hasFlag('walletReturned')) {
    if (ITAB.wallet) {
      ITAB.wallet.hidden = true
    }
    walletM.visible = false
  }
}
