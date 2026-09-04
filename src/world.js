import * as THREE from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader.js'
import { VignetteShader } from 'three/examples/jsm/shaders/VignetteShader.js'
import { $, clamp, rand } from './utils.js'
import { G, setFlag } from './state.js'
import { getCurrentCase } from './cases/caseManager.js'

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
camera.position.set(0, 28, 26)

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

;(() => {
  const g = new THREE.BufferGeometry(), p = []
  for (let i = 0; i < 420; i++) {
    const r = rand(60, 95), t = rand(0, Math.PI * 2), e = rand(.12, 1.35)
    p.push(Math.cos(t) * r * Math.cos(e), Math.sin(e) * r, Math.sin(t) * r * Math.cos(e))
  }
  g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3))
  scene.add(
    new THREE.Points(g, new THREE.PointsMaterial({ color: 0xc4d6ee, size: .38, transparent: true, opacity: .88 })))
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

export const GW = 81, GH = 57
export const blocked = new Uint8Array(GW * GH)
export const toG = (x, z) => [clamp(Math.round(x) + 40, 0, GW - 1), clamp(Math.round(z) + 28, 0, GH - 1)]
export const fromG = (gx, gy) => [gx - 40, gy - 28]

export function resetGrid() {
  blocked.fill(0)
}

export function blockRect(x1, z1, x2, z2, pad) {
  pad = pad === undefined ? 0 : pad
  const eps = 0.05
  const minGx = Math.max(0, Math.ceil(x1 - pad - 0.5 + eps) + 40)
  const maxGx = Math.min(GW - 1, Math.floor(x2 + pad + 0.5 - eps) + 40)
  const minGz = Math.max(0, Math.ceil(z1 - pad - 0.5 + eps) + 28)
  const maxGz = Math.min(GH - 1, Math.floor(z2 + pad + 0.5 - eps) + 28)
  for (let gz = minGz; gz <= maxGz; gz++) {
    for (let gx = minGx; gx <= maxGx; gx++) {
      blocked[gz * GW + gx] = 1
    }
  }
}

export function isBlocked(gx, gy) {
  if (gx < 0 || gx >= GW || gy < 0 || gy >= GH) {
    return true
  }
  return blocked[gy * GW + gx] === 1
}

export function nearestFree(gx, gy) {
  if (!isBlocked(gx, gy)) {
    return [gx, gy]
  }
  for (let r = 1; r < 20; r++) {
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (Math.abs(dx) === r || Math.abs(dy) === r) {
          const nx = gx + dx, ny = gy + dy
          if (!isBlocked(nx, ny)) {
            return [nx, ny]
          }
        }
      }
    }
  }
  return [gx, gy]
}

export function findPath(sx, sz, tx, tz) {
  const start = toG(sx, sz)
  let target = toG(tx, tz)
  if (isBlocked(target[0], target[1])) {
    target = nearestFree(target[0], target[1])
  }
  if (start[0] === target[0] && start[1] === target[1]) {
    return []
  }

  const startIdx = start[1] * GW + start[0]
  const targetIdx = target[1] * GW + target[0]

  const openSet = [startIdx]
  const inOpen = new Uint8Array(GW * GH)
  inOpen[startIdx] = 1

  const closed = new Uint8Array(GW * GH)
  const cameFrom = new Int32Array(GW * GH).fill(-1)
  const gScore = new Float32Array(GW * GH).fill(1e9)
  const fScore = new Float32Array(GW * GH).fill(1e9)

  gScore[startIdx] = 0
  const h = (gx, gy) => Math.hypot(gx - target[0], gy - target[1])
  fScore[startIdx] = h(start[0], start[1])

  const dirs = [
    [1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1],
    [1, 1, 1.414], [-1, 1, 1.414], [1, -1, 1.414], [-1, -1, 1.414],
  ]

  let iters = 0
  while (openSet.length > 0 && iters < 1200) {
    iters++
    let bestIdx = 0
    let bestF = fScore[openSet[0]]
    for (let i = 1; i < openSet.length; i++) {
      if (fScore[openSet[i]] < bestF) {
        bestF = fScore[openSet[i]]
        bestIdx = i
      }
    }
    const current = openSet.splice(bestIdx, 1)[0]
    inOpen[current] = 0
    closed[current] = 1

    if (current === targetIdx) {
      const path = []
      let curr = current
      while (curr !== -1) {
        const cx = curr % GW
        const cy = Math.floor(curr / GW)
        path.unshift(fromG(cx, cy))
        curr = cameFrom[curr]
      }
      path.shift()
      return path
    }

    const cx = current % GW
    const cy = Math.floor(current / GW)

    for (const [dx, dy, cost] of dirs) {
      const nx = cx + dx
      const ny = cy + dy
      if (nx < 0 || nx >= GW || ny < 0 || ny >= GH) {
        continue
      }
      const nIdx = ny * GW + nx
      if (closed[nIdx] || blocked[nIdx]) {
        continue
      }

      if (dx !== 0 && dy !== 0) {
        if (blocked[cy * GW + nx] && blocked[ny * GW + cx]) {
          continue
        }
      }

      const tentativeG = gScore[current] + cost
      if (tentativeG < gScore[nIdx]) {
        cameFrom[nIdx] = current
        gScore[nIdx] = tentativeG
        fScore[nIdx] = tentativeG + h(nx, ny)
        if (!inOpen[nIdx]) {
          openSet.push(nIdx)
          inOpen[nIdx] = 1
        }
      }
    }
  }
  return []
}

export const woodTex = canvasTex(256, 256, (x, w, h) => {
  x.fillStyle = '#3a2a1d'
  x.fillRect(0, 0, w, h)
  for (let i = 0; i < 40; i++) {
    const y = i * 6.4
    x.fillStyle = i % 2 ? 'rgba(40, 26, 16, 0.4)' : 'rgba(74, 52, 34, 0.35)'
    x.fillRect(0, y, w, 6.4)
    x.fillStyle = 'rgba(18, 12, 8, 0.35)'
    x.fillRect(0, y, w, 1)
  }
  for (let i = 0; i < 200; i++) {
    x.fillStyle = 'rgba(0, 0, 0, 0.15)'
    x.fillRect(rand(0, w), rand(0, h), rand(4, 18), 1)
  }
})

export const fabricTex = canvasTex(256, 256, (x, w, h) => {
  x.fillStyle = '#808080'
  x.fillRect(0, 0, w, h)
  const step = 8
  for (let i = -w; i < w * 2; i += step) {
    x.strokeStyle = 'rgba(255, 255, 255, 0.08)'
    x.lineWidth = 1.5
    x.beginPath()
    x.moveTo(i, 0)
    x.lineTo(i + h, h)
    x.stroke()
    x.strokeStyle = 'rgba(0, 0, 0, 0.12)'
    x.beginPath()
    x.moveTo(i + step / 2, 0)
    x.lineTo(i + step / 2 + h, h)
    x.stroke()
  }
  for (let j = -w; j < w * 2; j += step) {
    x.strokeStyle = 'rgba(255, 255, 255, 0.05)'
    x.lineWidth = 1
    x.beginPath()
    x.moveTo(j + h, 0)
    x.lineTo(j, h)
    x.stroke()
  }
  for (let k = 0; k < 600; k++) {
    x.fillStyle = Math.random() < 0.5 ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.08)'
    x.fillRect(rand(0, w), rand(0, h), 1.5, 1.5)
  }
})

export const leatherTex = canvasTex(256, 256, (x, w, h) => {
  x.fillStyle = '#7a6a5d'
  x.fillRect(0, 0, w, h)
  for (let i = 0; i < 900; i++) {
    const px = rand(0, w), py = rand(0, h), r = rand(1, 3.5)
    x.fillStyle = Math.random() < 0.4 ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.12)'
    x.beginPath()
    x.arc(px, py, r, 0, Math.PI * 2)
    x.fill()
  }
  for (let i = 0; i < 30; i++) {
    x.strokeStyle = 'rgba(0, 0, 0, 0.1)'
    x.lineWidth = 1
    x.beginPath()
    const sx = rand(0, w), sy = rand(0, h)
    x.moveTo(sx, sy)
    x.lineTo(sx + rand(-15, 15), sy + rand(-15, 15))
    x.stroke()
  }
})

export const linenTex = canvasTex(128, 128, (x, w, h) => {
  x.fillStyle = '#dcd6ca'
  x.fillRect(0, 0, w, h)
  for (let i = 0; i < w; i += 4) {
    x.fillStyle = i % 8 === 0 ? 'rgba(0, 0, 0, 0.07)' : 'rgba(255, 255, 255, 0.06)'
    x.fillRect(i, 0, 2, h)
  }
  for (let j = 0; j < h; j += 4) {
    x.fillStyle = 'rgba(0, 0, 0, 0.04)'
    x.fillRect(0, j, w, 1)
  }
})

export const wallPlasterTex = canvasTex(256, 256, (x, w, h) => {
  x.fillStyle = '#6a6058'
  x.fillRect(0, 0, w, h)
  for (let i = 0; i < 400; i++) {
    const s = rand(1, 4)
    x.fillStyle = Math.random() < 0.5 ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.18)'
    x.fillRect(rand(0, w), rand(0, h), s, s)
  }
  for (let i = 0; i < 60; i++) {
    x.fillStyle = 'rgba(42, 34, 28, 0.25)'
    const px = rand(0, w), py = rand(0, h), sz = rand(6, 18)
    x.beginPath()
    x.arc(px, py, sz, 0, Math.PI * 2)
    x.fill()
  }
})

export const roofTileTex = canvasTex(256, 256, (x, w, h) => {
  x.fillStyle = '#2d2220'
  x.fillRect(0, 0, w, h)
  const rows = 16, cols = 8
  const rh = h / rows, cw = w / cols
  for (let r = 0; r < rows; r++) {
    const off = (r % 2) * (cw * 0.5)
    for (let c = -1; c <= cols + 1; c++) {
      const bx = c * cw + off
      const by = r * rh
      const v = 38 + Math.floor(rand(-6, 8))
      x.fillStyle = `rgb(${ v + 6 }, ${ v }, ${ v - 2 })`
      x.beginPath()
      x.roundRect ? x.roundRect(bx + 1, by + 1, cw - 2, rh - 1, [0, 0, 3, 3]) : x.rect(bx + 1, by + 1, cw - 2, rh - 1)
      x.fill()
      x.fillStyle = 'rgba(0, 0, 0, 0.45)'
      x.fillRect(bx + 1, by + rh - 1, cw - 2, 1)
    }
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

export function quoinCorner(x, z, h, c) {
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

export const windowTex = canvasTex(128, 128, (x, w, h) => {
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

export const windowMat = new THREE.MeshStandardMaterial({
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

export const lampGlowTex = canvasTex(128, 128, (x, w, h) => {
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

  const base = new THREE.Mesh(new THREE.CylinderGeometry(.22, .32, .5, 8),
    mat(0x181c22, { metalness: 0.65, roughness: 0.38 }))
  base.position.y = .25
  base.castShadow = true
  g.add(base)

  const p = new THREE.Mesh(new THREE.CylinderGeometry(.065, .085, 3.2, 8),
    mat(0x1c2026, { metalness: 0.65, roughness: 0.4 }))
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

  const frame = new THREE.Mesh(new THREE.CylinderGeometry(.26, .18, .52, 6, 1, true),
    mat(0x181b20, { metalness: 0.7, roughness: 0.3 }))
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

  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(.13 * s, .23 * s, 1.7 * s, 7),
    mat(0x2c2217, { roughness: 0.92 }))
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

export const interactMeshes = []
export const ITAB = {}

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

const chalkTex = canvasTex(512, 512, (x, w, h) => {
  x.clearRect(0, 0, w, h)
  x.strokeStyle = '#f4f4f0'
  x.lineWidth = 7
  x.lineCap = 'round'
  x.lineJoin = 'round'

  x.beginPath()
  x.arc(256, 75, 36, 0, Math.PI * 2)
  x.stroke()

  x.beginPath()
  x.moveTo(236, 110)
  x.lineTo(170, 135)
  x.lineTo(110, 190)
  x.lineTo(75, 265)
  x.lineTo(95, 275)
  x.lineTo(130, 205)
  x.lineTo(185, 160)
  x.lineTo(195, 275)
  x.lineTo(160, 375)
  x.lineTo(145, 470)
  x.lineTo(175, 475)
  x.lineTo(195, 385)
  x.lineTo(256, 295)
  x.lineTo(315, 385)
  x.lineTo(335, 475)
  x.lineTo(365, 470)
  x.lineTo(350, 375)
  x.lineTo(315, 275)
  x.lineTo(325, 160)
  x.lineTo(380, 205)
  x.lineTo(415, 275)
  x.lineTo(435, 265)
  x.lineTo(400, 190)
  x.lineTo(340, 135)
  x.lineTo(276, 110)
  x.stroke()

  for (let i = 0; i < 400; i++) {
    const rx = rand(50, 460)
    const ry = rand(30, 485)
    x.fillStyle = 'rgba(255, 255, 255, ' + rand(0.15, 0.6) + ')'
    x.fillRect(rx, ry, rand(1.5, 3.5), rand(1.5, 3.5))
  }
})

export function chalkOutline(x, z, y = 0.128) {
  const blood = new THREE.Mesh(
    new THREE.PlaneGeometry(2.6, 2.0),
    new THREE.MeshStandardMaterial({
      map: bloodTex,
      transparent: true,
      roughness: 0.25,
      metalness: 0.1,
      depthWrite: false,
    }),
  )
  blood.rotation.x = -Math.PI / 2
  blood.position.set(x + .35, y - 0.003, z - .25)
  scene.add(blood)

  const chalkMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(2.4, 3.2),
    new THREE.MeshBasicMaterial({
      map: chalkTex,
      transparent: true,
      opacity: 0.94,
      depthWrite: false,
    }),
  )
  chalkMesh.rotation.x = -Math.PI / 2
  chalkMesh.position.set(x, y, z)
  scene.add(chalkMesh)

  tagInteractive(chalkMesh, 'body', '死者遗体痕迹', 'clue')
  tagInteractive(blood, 'body', '死者遗体痕迹', 'clue')
}

export function makeChar(coat, hatC, opts) {
  opts = opts || {}
  const role = opts.role || 'detective'
  const g = new THREE.Group()

  const baseTorsoY = 0.82
  g.userData.baseTorsoY = baseTorsoY

  const torsoGroup = new THREE.Group()
  torsoGroup.position.y = baseTorsoY
  g.add(torsoGroup)
  g.userData.torsoGroup = torsoGroup

  const skinColor = role === 'martha' ? 0xe4ccba : (role === 'pete' ? 0xd6a48e : (role === 'coroner'
    ? 0xc8b8a8
    : 0xd8bca2))
  const skinM = mat(skinColor, { roughness: 0.65, metalness: 0.02 })
  const eyeWhiteM = mat(0xf0ece2, { roughness: 0.35 })
  const eyeM = mat(0x1a2230, { roughness: 0.25, metalness: 0.1 })
  const hairC = opts.hair ||
    (role === 'coroner' ? 0x767a82 : (role === 'greta' ? 0x8e8882 : (role === 'luke' ? 0x5a3c22 : 0x241c18)))
  const hairM = mat(hairC, { roughness: 0.88 })
  const goldM = mat(0xd4af37, { metalness: 0.88, roughness: 0.22 })
  const silverM = mat(0xb4bcc8, { metalness: 0.82, roughness: 0.26 })
  const blackLeatherM = mat(0x1a1818, { map: leatherTex, roughness: 0.46, metalness: 0.1 })
  const brownLeatherM = mat(0x3e2819, { map: leatherTex, roughness: 0.52, metalness: 0.08 })
  const shirtM = mat(0xe4ded4, { map: linenTex, roughness: 0.78 })
  const pantColor = role === 'sheriff' ? 0x182436 : (role === 'luke' ? 0x48321c : (role === 'barrow'
    ? 0x18141a
    : 0x1e2228))
  const pantM = mat(pantColor, { map: fabricTex, roughness: 0.82, metalness: 0.04 })
  const coatM = mat(coat, { map: fabricTex, roughness: 0.78, metalness: 0.05 })

  const headGroup = new THREE.Group()
  headGroup.position.y = 0.62
  torsoGroup.add(headGroup)
  g.userData.headGroup = headGroup

  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.085, 0.14, 8), skinM)
  neck.position.y = -0.13
  neck.castShadow = true
  headGroup.add(neck)

  const head = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.27, 0.25), skinM)
  head.castShadow = true
  headGroup.add(head)

  const chin = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.08, 0.20), skinM)
  chin.position.set(0, -0.12, 0.02)
  chin.castShadow = true
  headGroup.add(chin)

  const noseColor = role === 'pete' ? 0xc46252 : skinColor
  const noseM = role === 'pete' ? mat(noseColor, { roughness: 0.55 }) : skinM
  const nose = new THREE.Mesh(new THREE.BoxGeometry(role === 'pete' ? 0.052 : 0.042, 0.068, 0.05), noseM)
  nose.position.set(0, -0.005, 0.145)
  headGroup.add(nose)

  const lEar = new THREE.Mesh(new THREE.BoxGeometry(0.026, 0.065, 0.045), skinM)
  lEar.position.set(-0.135, 0.005, -0.01)
  headGroup.add(lEar)
  const rEar = new THREE.Mesh(new THREE.BoxGeometry(0.026, 0.065, 0.045), skinM)
  rEar.position.set(0.135, 0.005, -0.01)
  headGroup.add(rEar)

  const lSclera = new THREE.Mesh(new THREE.BoxGeometry(0.050, 0.034, 0.012), eyeWhiteM)
  lSclera.position.set(-0.062, 0.025, 0.130)
  headGroup.add(lSclera)
  const rSclera = new THREE.Mesh(new THREE.BoxGeometry(0.050, 0.034, 0.012), eyeWhiteM)
  rSclera.position.set(0.062, 0.025, 0.130)
  headGroup.add(rSclera)

  const lPupil = new THREE.Mesh(new THREE.BoxGeometry(0.028, 0.030, 0.014), eyeM)
  lPupil.position.set(-0.062, 0.024, 0.132)
  headGroup.add(lPupil)
  const rPupil = new THREE.Mesh(new THREE.BoxGeometry(0.028, 0.030, 0.014), eyeM)
  rPupil.position.set(0.062, 0.024, 0.132)
  headGroup.add(rPupil)

  const lBrow = new THREE.Mesh(new THREE.BoxGeometry(0.072, 0.022, 0.018), hairM)
  lBrow.position.set(-0.062, 0.058, 0.133)
  lBrow.rotation.z = role === 'martha' ? -0.15 : (role === 'barrow' ? 0.2 : (role === 'pete' ? -0.08 : 0))
  headGroup.add(lBrow)
  const rBrow = new THREE.Mesh(new THREE.BoxGeometry(0.072, 0.022, 0.018), hairM)
  rBrow.position.set(0.062, 0.058, 0.133)
  rBrow.rotation.z = role === 'martha' ? 0.15 : (role === 'barrow' ? -0.2 : (role === 'pete' ? 0.08 : 0))
  headGroup.add(rBrow)

  if (role === 'coroner') {
    const specM = silverM
    const lRim = new THREE.Mesh(new THREE.TorusGeometry(0.032, 0.005, 6, 12), specM)
    lRim.position.set(-0.062, 0.025, 0.138)
    headGroup.add(lRim)
    const rRim = new THREE.Mesh(new THREE.TorusGeometry(0.032, 0.005, 6, 12), specM)
    rRim.position.set(0.062, 0.025, 0.138)
    headGroup.add(rRim)
    const bridge = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.038, 4), specM)
    bridge.rotation.z = Math.PI / 2
    bridge.position.set(0, 0.028, 0.138)
    headGroup.add(bridge)
  }

  if (role === 'sheriff') {
    const stache = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.045, 0.035), hairM)
    stache.position.set(0, -0.06, 0.145)
    headGroup.add(stache)
  } else if (role === 'barrow') {
    const stache = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.022, 0.03), hairM)
    stache.position.set(0, -0.055, 0.145)
    headGroup.add(stache)
  } else if (role === 'pete') {
    const stache = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.04, 0.035), mat(0x443a32, { roughness: 0.95 }))
    stache.position.set(0, -0.065, 0.145)
    headGroup.add(stache)
    const stubble = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.10, 0.03), mat(0x443a32, { roughness: 0.95 }))
    stubble.position.set(0, -0.10, 0.135)
    headGroup.add(stubble)
  }

  const hasHat = opts.hat !== false && (hatC !== false && hatC !== undefined) && role !== 'martha' && role !== 'greta'

  if (hasHat) {
    const hairBack = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.18, 0.06), hairM)
    hairBack.position.set(0, 0.00, -0.11)
    headGroup.add(hairBack)
    const hairL = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.14, 0.12), hairM)
    hairL.position.set(-0.128, 0.02, -0.03)
    headGroup.add(hairL)
    const hairR = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.14, 0.12), hairM)
    hairR.position.set(0.128, 0.02, -0.03)
    headGroup.add(hairR)

    const hatColor = hatC || coat
    const hatM = mat(hatColor, { map: fabricTex, roughness: 0.72, metalness: 0.06 })
    const hatGroup = new THREE.Group()
    hatGroup.position.set(0, 0.15, 0)

    if (role === 'barrow') {
      const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.165, 0.30, 16), hatM)
      crown.position.y = 0.15
      crown.castShadow = true
      hatGroup.add(crown)
      const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.23, 0.23, 0.025, 16), hatM)
      brim.position.y = 0.01
      brim.castShadow = true
      hatGroup.add(brim)
      const ribbon = new THREE.Mesh(new THREE.CylinderGeometry(0.168, 0.168, 0.045, 16), mat(0x7a1822))
      ribbon.position.y = 0.04
      hatGroup.add(ribbon)
    } else if (role === 'sheriff') {
      const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.27, 0.27, 0.025, 16), hatM)
      brim.position.y = 0.01
      brim.castShadow = true
      hatGroup.add(brim)
      const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.175, 0.15, 16), hatM)
      crown.position.y = 0.085
      crown.castShadow = true
      hatGroup.add(crown)
      const band = new THREE.Mesh(new THREE.CylinderGeometry(0.177, 0.177, 0.03, 16), mat(0x181818))
      band.position.y = 0.03
      hatGroup.add(band)
      const badge = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.05, 0.02), goldM)
      badge.position.set(0, 0.085, 0.175)
      hatGroup.add(badge)
    } else if (role === 'luke' || role === 'pete') {
      const capCrown = new THREE.Mesh(new THREE.SphereGeometry(0.21, 10, 8, 0, Math.PI * 2, 0, Math.PI / 2), hatM)
      capCrown.scale.set(1.08, 0.58, 1.16)
      capCrown.position.set(0, 0.02, 0.02)
      capCrown.castShadow = true
      hatGroup.add(capCrown)
      const capBrim = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.022, 0.13), hatM)
      capBrim.position.set(0, 0.01, 0.15)
      capBrim.rotation.x = 0.14
      hatGroup.add(capBrim)
      if (role === 'pete') {
        hatGroup.rotation.z = -0.12
        hatGroup.rotation.x = 0.05
      }
    } else {
      const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.025, 16), hatM)
      brim.position.y = 0.01
      brim.scale.set(1, 1, 1.08)
      brim.castShadow = true
      hatGroup.add(brim)
      const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.17, 0.14, 16), hatM)
      crown.position.y = 0.075
      crown.scale.set(0.92, 1, 1.10)
      crown.castShadow = true
      hatGroup.add(crown)
      const band = new THREE.Mesh(new THREE.CylinderGeometry(0.172, 0.172, 0.03, 16), mat(0x181818))
      band.position.y = 0.03
      hatGroup.add(band)
    }
    headGroup.add(hatGroup)
  } else {
    const hairTop = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.07, 0.26), hairM)
    hairTop.position.set(0, 0.14, 0)
    headGroup.add(hairTop)
    const hairBack = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.22, 0.07), hairM)
    hairBack.position.set(0, 0.02, -0.11)
    headGroup.add(hairBack)
    const hairL = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.18, 0.16), hairM)
    hairL.position.set(-0.128, 0.03, -0.01)
    headGroup.add(hairL)
    const hairR = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.18, 0.16), hairM)
    hairR.position.set(0.128, 0.03, -0.01)
    headGroup.add(hairR)

    if (role === 'martha') {
      const bun = new THREE.Mesh(new THREE.SphereGeometry(0.10, 10, 8), hairM)
      bun.position.set(0, 0.05, -0.17)
      headGroup.add(bun)
    }
    if (role === 'greta') {
      const bun = new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 8), hairM)
      bun.position.set(0, 0.16, -0.11)
      headGroup.add(bun)
    }
  }

  const beltM = role === 'player' ? blackLeatherM : brownLeatherM
  const belt = new THREE.Mesh(new THREE.BoxGeometry(0.445, 0.07, 0.265), beltM)
  belt.position.y = 0.01
  torsoGroup.add(belt)
  const buckleM = (role === 'coroner' || role === 'sheriff') ? silverM : goldM
  const buckle = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.03), buckleM)
  buckle.position.set(0, 0.01, 0.135)
  torsoGroup.add(buckle)

  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.52, 0.26), coatM)
  torso.position.y = 0.27
  torso.castShadow = true
  torso.receiveShadow = true
  torsoGroup.add(torso)

  const buttonM = (role === 'sheriff' || role === 'barrow' || role === 'player') ? goldM : mat(0x282420)
  for (let i = 0; i < 3; i++) {
    const btn = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.01, 8), buttonM)
    btn.rotation.x = Math.PI / 2
    btn.position.set(0, 0.12 + i * 0.10, 0.133)
    torsoGroup.add(btn)
  }

  const collar = new THREE.Mesh(new THREE.BoxGeometry(0.30, 0.10, 0.22), coatM)
  collar.position.set(0, 0.52, 0.02)
  torsoGroup.add(collar)

  const lLapel = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.22, 0.02), coatM)
  lLapel.position.set(-0.09, 0.38, 0.132)
  lLapel.rotation.z = -0.15
  torsoGroup.add(lLapel)
  const rLapel = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.22, 0.02), coatM)
  rLapel.position.set(0.09, 0.38, 0.132)
  rLapel.rotation.z = 0.15
  torsoGroup.add(rLapel)

  const innerShirt = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.28, 0.03), shirtM)
  innerShirt.position.set(0, 0.38, 0.125)
  torsoGroup.add(innerShirt)

  if (role === 'detective' || role === 'player' || role === 'barrow' || role === 'sheriff') {
    const tieM = role === 'barrow' ? mat(0x6e1b24) : (role === 'player' ? mat(0x8a2424) : mat(0x182230))
    const tie = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.24, 0.02), tieM)
    tie.position.set(0, 0.33, 0.136)
    torsoGroup.add(tie)
    if (role === 'barrow') {
      const pin = new THREE.Mesh(new THREE.SphereGeometry(0.012, 6, 6), goldM)
      pin.position.set(0, 0.40, 0.147)
      torsoGroup.add(pin)
    }
  }

  if (role === 'barrow') {
    const watchChain = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.008, 4, 10, Math.PI), goldM)
    watchChain.rotation.z = Math.PI
    watchChain.position.set(0.06, 0.16, 0.134)
    torsoGroup.add(watchChain)
  }

  if (role === 'sheriff' || opts.badge) {
    const star = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.02), goldM)
    star.position.set(0.12, 0.38, 0.135)
    star.rotation.z = Math.PI / 4
    torsoGroup.add(star)
    const holster = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.16, 0.09), brownLeatherM)
    holster.position.set(0.23, 0.00, 0.02)
    holster.castShadow = true
    torsoGroup.add(holster)
  }

  if (opts.scarf) {
    const scM = mat(opts.scarf, { roughness: 0.82 })
    const scRing = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.045, 6, 14), scM)
    scRing.rotation.x = Math.PI / 2
    scRing.position.set(0, 0.53, 0)
    torsoGroup.add(scRing)
    const scTail = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.24, 0.03), scM)
    scTail.position.set(0.08, 0.34, 0.14)
    scTail.rotation.z = -0.1
    torsoGroup.add(scTail)
  }

  if (role === 'greta') {
    const shawl = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.44, 0.24, 10),
      mat(0x5a3e30, { map: fabricTex, roughness: 0.9 }))
    shawl.position.set(0, 0.40, 0)
    torsoGroup.add(shawl)
  }

  if (role === 'martha') {
    const bib = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.26, 0.02), mat(0xd8d2c4, { map: linenTex }))
    bib.position.set(0, 0.30, 0.134)
    torsoGroup.add(bib)
    const strapL = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.22, 0.02), mat(0xd8d2c4, { map: linenTex }))
    strapL.position.set(-0.10, 0.40, 0.125)
    torsoGroup.add(strapL)
    const strapR = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.22, 0.02), mat(0xd8d2c4, { map: linenTex }))
    strapR.position.set(0.10, 0.40, 0.125)
    torsoGroup.add(strapR)
    const apronSkirt = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.52, 0.02), mat(0xd8d2c4, { map: linenTex }))
    apronSkirt.position.set(0, -0.26, 0.16)
    torsoGroup.add(apronSkirt)
    const apronPocket = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.12, 0.025), mat(0xc8c2b4, { map: linenTex }))
    apronPocket.position.set(0, -0.22, 0.17)
    torsoGroup.add(apronPocket)
  }

  if (role === 'luke') {
    const bib = new THREE.Mesh(new THREE.BoxGeometry(0.30, 0.28, 0.02), mat(0x563820, { map: leatherTex }))
    bib.position.set(0, 0.28, 0.134)
    torsoGroup.add(bib)
    const apronSkirt = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.42, 0.02), mat(0x563820, { map: leatherTex }))
    apronSkirt.position.set(0, -0.16, 0.145)
    torsoGroup.add(apronSkirt)
  }

  if (role === 'martha' || role === 'greta') {
    const skirt = new THREE.Mesh(new THREE.CylinderGeometry(0.23, 0.35, 0.70, 10), coatM)
    skirt.position.set(0, -0.35, 0)
    skirt.castShadow = true
    torsoGroup.add(skirt)
  } else {
    const coatSkirt = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.26, 0.27), coatM)
    coatSkirt.position.set(0, -0.12, 0)
    coatSkirt.castShadow = true
    torsoGroup.add(coatSkirt)
  }

  const leftLeg = new THREE.Group()
  leftLeg.position.set(-0.11, baseTorsoY, 0)
  g.add(leftLeg)
  g.userData.leftLeg = leftLeg

  const lThigh = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.38, 0.17), pantM)
  lThigh.position.y = -0.19
  lThigh.castShadow = true
  leftLeg.add(lThigh)

  const lKnee = new THREE.Mesh(new THREE.SphereGeometry(0.068, 6, 6), pantM)
  lKnee.position.y = -0.38
  leftLeg.add(lKnee)

  const bootM = role === 'player' ? blackLeatherM : (role === 'luke' || role === 'pete' ? brownLeatherM : blackLeatherM)
  const lBoot = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.34, 0.16), bootM)
  lBoot.position.set(0, -0.54, 0.01)
  lBoot.castShadow = true
  leftLeg.add(lBoot)
  const lBootCuff = new THREE.Mesh(new THREE.BoxGeometry(0.148, 0.05, 0.168), bootM)
  lBootCuff.position.set(0, -0.40, 0.01)
  leftLeg.add(lBootCuff)
  const lToe = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.10, 0.22), bootM)
  lToe.position.set(0, -0.765, 0.04)
  leftLeg.add(lToe)

  const rightLeg = new THREE.Group()
  rightLeg.position.set(0.11, baseTorsoY, 0)
  g.add(rightLeg)
  g.userData.rightLeg = rightLeg

  const rThigh = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.38, 0.17), pantM)
  rThigh.position.y = -0.19
  rThigh.castShadow = true
  rightLeg.add(rThigh)

  const rKnee = new THREE.Mesh(new THREE.SphereGeometry(0.068, 6, 6), pantM)
  rKnee.position.y = -0.38
  rightLeg.add(rKnee)

  const rBoot = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.34, 0.16), bootM)
  rBoot.position.set(0, -0.54, 0.01)
  rBoot.castShadow = true
  rightLeg.add(rBoot)
  const rBootCuff = new THREE.Mesh(new THREE.BoxGeometry(0.148, 0.05, 0.168), bootM)
  rBootCuff.position.set(0, -0.40, 0.01)
  rightLeg.add(rBootCuff)
  const rToe = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.10, 0.22), bootM)
  rToe.position.set(0, -0.765, 0.04)
  rightLeg.add(rToe)

  const armMat = role === 'luke' ? shirtM : coatM

  const leftArm = new THREE.Group()
  leftArm.position.set(-0.26, 0.44, 0)
  torsoGroup.add(leftArm)
  g.userData.leftArm = leftArm

  const lShoulder = new THREE.Mesh(new THREE.SphereGeometry(0.075, 8, 8), coatM)
  leftArm.add(lShoulder)

  const lBicep = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.058, 0.24, 8), armMat)
  lBicep.position.set(0, -0.12, 0)
  lBicep.castShadow = true
  leftArm.add(lBicep)

  const lForearm = new THREE.Mesh(new THREE.CylinderGeometry(0.058, 0.050, 0.22, 8), role === 'luke' ? skinM : armMat)
  lForearm.position.set(0, -0.32, 0.02)
  lForearm.rotation.x = 0.08
  lForearm.castShadow = true
  leftArm.add(lForearm)

  const lCuff = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.04, 8), role === 'luke' ? mat(0x503822) : coatM)
  lCuff.position.set(0, -0.40, 0.02)
  leftArm.add(lCuff)

  const lHand = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.08, 0.05), role === 'player' ? blackLeatherM : skinM)
  lHand.position.set(0, -0.45, 0.03)
  leftArm.add(lHand)

  const rightArm = new THREE.Group()
  rightArm.position.set(0.26, 0.44, 0)
  torsoGroup.add(rightArm)
  g.userData.rightArm = rightArm

  const rShoulder = new THREE.Mesh(new THREE.SphereGeometry(0.075, 8, 8), coatM)
  rightArm.add(rShoulder)

  const rBicep = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.058, 0.24, 8), armMat)
  rBicep.position.set(0, -0.12, 0)
  rBicep.castShadow = true
  rightArm.add(rBicep)

  const rForearm = new THREE.Mesh(new THREE.CylinderGeometry(0.058, 0.050, 0.22, 8), role === 'luke' ? skinM : armMat)
  rForearm.position.set(0, -0.32, 0.02)
  rForearm.rotation.x = 0.08
  rForearm.castShadow = true
  rightArm.add(rForearm)

  const rCuff = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.04, 8), role === 'luke' ? mat(0x503822) : coatM)
  rCuff.position.set(0, -0.40, 0.02)
  rightArm.add(rCuff)

  const rHand = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.08, 0.05), role === 'player' ? blackLeatherM : skinM)
  rHand.position.set(0, -0.45, 0.03)
  rightArm.add(rHand)

  if (role === 'coroner') {
    const bag = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.20, 0.28), blackLeatherM)
    bag.position.set(0, -0.58, 0.05)
    bag.castShadow = true
    leftArm.add(bag)
    const bagHandle = new THREE.Mesh(new THREE.TorusGeometry(0.04, 0.012, 4, 8, Math.PI), goldM)
    bagHandle.position.set(0, -0.48, 0.05)
    bagHandle.rotation.z = Math.PI
    leftArm.add(bagHandle)
  }

  if (role === 'barrow') {
    const cane = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.012, 0.72, 8), blackLeatherM)
    cane.position.set(0.03, -0.44, 0.08)
    cane.castShadow = true
    rightArm.add(cane)
    const caneHead = new THREE.Mesh(new THREE.SphereGeometry(0.04, 10, 8), goldM)
    caneHead.position.set(0.03, -0.08, 0.08)
    rightArm.add(caneHead)
  }

  if (role === 'greta') {
    const basket = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.14, 0.22), mat(0x8a623c, { roughness: 0.9 }))
    basket.position.set(0, -0.38, 0.10)
    basket.castShadow = true
    leftArm.add(basket)
  }

  const sh = new THREE.Mesh(new THREE.CircleGeometry(.44, 16),
    new THREE.MeshBasicMaterial({ color: 0, transparent: true, opacity: .34, depthWrite: false }))
  sh.rotation.x = -Math.PI / 2
  sh.position.y = .028
  g.add(sh)

  g.userData.bob = Math.random() * 6
  scene.add(g)
  return g
}

export const player = makeChar(0x2e333d, 0x1e222a, { scarf: 0xd9a441, role: 'player' })
player.position.set(0, 0, 10)

export const NPCS = new Proxy({}, {
  get(target, prop) {
    const cur = getCurrentCase()
    if (cur && cur.map && cur.map.NPCS) {
      return cur.map.NPCS[prop]
    }
    return target[prop]
  },
  ownKeys() {
    const cur = getCurrentCase()
    if (cur && cur.map && cur.map.NPCS) {
      return Reflect.ownKeys(cur.map.NPCS)
    }
    return []
  },
  getOwnPropertyDescriptor(target, prop) {
    const cur = getCurrentCase()
    if (cur && cur.map && cur.map.NPCS && prop in cur.map.NPCS) {
      return { enumerable: true, configurable: true, value: cur.map.NPCS[prop] }
    }
    return undefined
  },
  has(target, prop) {
    const cur = getCurrentCase()
    if (cur && cur.map && cur.map.NPCS) {
      return prop in cur.map.NPCS
    }
    return prop in target
  },
})

export const labels = []

export function addLabel(getPos, html, cls, cond) {
  const el = document.createElement('div')
  el.className = 'wlabel' + (cls ? ' ' + cls : '')
  el.innerHTML = html
  $('labels').appendChild(el)
  labels.push({ el, getPos, cond })
  return el
}

export const scanLabels = {}

export function ensureScanLabel(id) {
  if (scanLabels[id]) {
    return scanLabels[id]
  }
  const it = ITAB[id]
  if (!it) {
    return null
  }
  const col = it.kind === 'npc' ? '#d9a441' : it.kind === 'clue' ? '#e05a5a' : it.kind === 'item'
    ? '#7fd0c4'
    : '#9aa4b4'
  const el = addLabel(
    () => it.mesh.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(0, it.kind === 'npc' ? 0 : 1.1, 0)),
    `<span class="dot" style="background:${ col }"></span>${ it.name }`,
    'scan',
    () => false,
  )
  el.style.opacity = 0
  scanLabels[id] = el
  return el
}

export function clearWorldObjects() {
  labels.forEach(l => {
    if (l.el && l.el.parentNode) {
      l.el.parentNode.removeChild(l.el)
    }
  })
  labels.length = 0
  for (const k in scanLabels) {
    delete scanLabels[k]
  }
  for (const k in ITAB) {
    delete ITAB[k]
  }
  interactMeshes.length = 0
  lampPositions.length = 0
  resetGrid()
}

export function zoneAt(x, z) {
  const cur = getCurrentCase()
  if (cur && cur.map && cur.map.zoneAt) {
    return cur.map.zoneAt(x, z)
  }
  return null
}

export function applyWorldFromFlags() {
  const cur = getCurrentCase()
  if (cur && cur.map && cur.map.applyWorldFromFlags) {
    cur.map.applyWorldFromFlags(G)
  }
}

export function openGate() {
  const cur = getCurrentCase()
  if (cur && cur.map && cur.map.openGate) {
    cur.map.openGate(G, setFlag)
  }
}
