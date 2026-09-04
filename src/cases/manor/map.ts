import type { GameState, InteractContext, NpcConfig, ObjectivesResult, SnowParticle, WorldContext } from '../../types'
import * as THREE from 'three'
import {
  addLabel, blockRect, canvasTex, chalkOutline, lamp, lampGlowTex, makeChar, mat, scene, tagInteractive,
  woodTex, wallPlasterTex, leatherTex, fabricTex,
} from '../../world'
import { rand } from '../../utils'
import { CLUE_TOTAL } from './clues'

export let snowGeo: THREE.BufferGeometry | null = null
export let snowCount = 450
export let snowVel: SnowParticle[] = []

export let studyLight: THREE.PointLight | null = null
export let fireLight: THREE.PointLight | null = null
export let clinicLight: THREE.PointLight | null = null
export let hallChandelier: THREE.PointLight | null = null
export let pianoLight: THREE.PointLight | null = null
export let foyerLight: THREE.PointLight | null = null
export let greenhouseLight: THREE.PointLight | null = null
export let guestLight: THREE.PointLight | null = null

export const NPCS: Record<string, NpcConfig> = {
  thomas: { n: '巡士 托马斯', pos: [-2.0, 14.5], coat: 0x2e4a6e, hat: 0x1e2c40, badge: true },
  morris: { n: '老管家 莫里斯', pos: [-2.0, 3.0], coat: 0x22242a, hat: false, hair: 0x8c8f96 },
  eleanor: { n: '艾莲娜 夫人', pos: [-18.5, 9.5], coat: 0x482d3e, hat: false, hair: 0x1a1210 },
  julian: { n: '长子 朱利安', pos: [18.5, 10.5], coat: 0x73362a, hat: 0x421e18 },
  vincent: { n: '凡森特 医生', pos: [18.5, -11.0], coat: 0x2c433b, hat: 0x1a2622, glasses: true },
  cecilia: { n: '琴师 塞西莉亚', pos: [-2.0, -9.0], coat: 0x8a7d65, hat: false, hair: 0xd4af37 },
}

export const ZONES = [
  { id: 'foyer', n: '庄园玄关门廊', x: [-8, 8], z: [11, 18] },
  { id: 'corridor', n: '中央主厅与楼梯', x: [-10, 10], z: [-6, 11] },
  { id: 'gallery', n: '二楼挑空琴廊', x: [-12, 6], z: [-13, -6] },
  { id: 'study', n: '男爵二楼书房 · 案发现场', x: [-27, -11], z: [-19, -3] },
  { id: 'greenhouse', n: '温室玻璃花房', x: [-27, -11], z: [3, 19] },
  { id: 'guestroom', n: '东翼客房 · 软禁室', x: [11, 27], z: [3, 19] },
  { id: 'clinic', n: '东翼医务室与药房', x: [11, 27], z: [-19, -3] },
]

export function zoneAt(x: number, z: number): { id: string; n: string; x: number[]; z: number[] } | null {
  for (const zn of ZONES) {
    if (x >= zn.x[0] && x <= zn.x[1] && z >= zn.z[0] && z <= zn.z[1]) {
      return zn
    }
  }
  return null
}

export function getHeightAt(x: number, z: number): number {
  if (z <= -6.5 && x >= -26.5 && x <= 3.5) {
    return 2.4
  }
  if (x >= -4.2 && x <= 0.2 && z < -2.5 && z > -6.5) {
    const t = (-2.5 - z) / 4.0
    return t * 2.4
  }
  return 0.0
}

const marbleTileTex = canvasTex(512, 512, (x, w, h) => {
  const tileSize = 64
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const isBlack = (r + c) % 2 === 1
      const bx = c * tileSize
      const by = r * tileSize
      if (isBlack) {
        x.fillStyle = '#1b1e25'
        x.fillRect(bx, by, tileSize, tileSize)
        x.fillStyle = 'rgba(42, 50, 64, 0.45)'
        for (let i = 0; i < 4; i++) {
          x.beginPath()
          x.arc(bx + rand(10, 54), by + rand(10, 54), rand(4, 14), 0, Math.PI * 2)
          x.fill()
        }
      } else {
        x.fillStyle = '#dfd8ce'
        x.fillRect(bx, by, tileSize, tileSize)
        x.fillStyle = 'rgba(205, 195, 180, 0.55)'
        for (let i = 0; i < 5; i++) {
          x.beginPath()
          x.arc(bx + rand(8, 56), by + rand(8, 56), rand(6, 16), 0, Math.PI * 2)
          x.fill()
        }
      }
      x.strokeStyle = '#524030'
      x.lineWidth = 1
      x.strokeRect(bx, by, tileSize, tileSize)
    }
  }
})
marbleTileTex.wrapS = THREE.RepeatWrapping
marbleTileTex.wrapT = THREE.RepeatWrapping
marbleTileTex.repeat.set(8, 8)

const redCarpetTex = canvasTex(256, 512, (x, w, h) => {
  x.fillStyle = '#6a161d'
  x.fillRect(0, 0, w, h)
  x.fillStyle = '#4e0e15'
  for (let y = 0; y < h; y += 32) {
    for (let i = 0; i < w; i += 32) {
      x.beginPath()
      x.moveTo(i + 16, y)
      x.lineTo(i + 32, y + 16)
      x.lineTo(i + 16, y + 32)
      x.lineTo(i, y + 16)
      x.closePath()
      x.fill()
    }
  }
  x.fillStyle = '#d4af37'
  x.fillRect(8, 0, 6, h)
  x.fillRect(w - 14, 0, 6, h)
  x.fillStyle = 'rgba(212, 175, 55, 0.4)'
  x.fillRect(20, 0, 2, h)
  x.fillRect(w - 22, 0, 2, h)
})

const parquetTex = canvasTex(256, 256, (x, w, h) => {
  x.fillStyle = '#3a261a'
  x.fillRect(0, 0, w, h)
  const bs = 32
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const bx = c * bs, by = r * bs
      x.fillStyle = (r + c) % 2 ? '#462e20' : '#301d12'
      x.fillRect(bx + 1, by + 1, bs - 2, bs - 2)
      x.fillStyle = 'rgba(255, 255, 255, 0.04)'
      x.fillRect(bx + 1, by + 1, bs - 2, 2)
      x.fillStyle = 'rgba(0, 0, 0, 0.3)'
      x.fillRect(bx + 1, by + bs - 2, bs - 2, 2)
    }
  }
})
parquetTex.wrapS = THREE.RepeatWrapping
parquetTex.wrapT = THREE.RepeatWrapping
parquetTex.repeat.set(4, 4)

const persianRugTex = canvasTex(256, 256, (x, w, h) => {
  x.fillStyle = '#58131b'
  x.fillRect(0, 0, w, h)
  x.strokeStyle = '#c49746'
  x.lineWidth = 6
  x.strokeRect(8, 8, w - 16, h - 16)
  x.strokeStyle = '#1d3345'
  x.lineWidth = 3
  x.strokeRect(18, 18, w - 36, h - 36)
  x.fillStyle = '#c49746'
  x.beginPath()
  x.arc(w / 2, h / 2, 45, 0, Math.PI * 2)
  x.fill()
  x.fillStyle = '#1d3345'
  x.beginPath()
  x.arc(w / 2, h / 2, 30, 0, Math.PI * 2)
  x.fill()
  x.fillStyle = '#82222a'
  x.beginPath()
  x.arc(w / 2, h / 2, 16, 0, Math.PI * 2)
  x.fill()
})

const greenhouseTileTex = canvasTex(256, 256, (x, w, h) => {
  x.fillStyle = '#44281c'
  x.fillRect(0, 0, w, h)
  const sz = 32
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const bx = c * sz, by = r * sz
      x.fillStyle = (r + c) % 2 ? '#543124' : '#392116'
      x.fillRect(bx + 1, by + 1, sz - 2, sz - 2)
      if ((r + c) % 3 === 0) {
        x.fillStyle = 'rgba(52, 80, 42, 0.3)'
        x.fillRect(bx + 3, by + 3, sz - 6, sz - 6)
      }
    }
  }
})
greenhouseTileTex.wrapS = THREE.RepeatWrapping
greenhouseTileTex.wrapT = THREE.RepeatWrapping
greenhouseTileTex.repeat.set(4, 4)

const clinicTileTex = canvasTex(256, 256, (x, w, h) => {
  x.fillStyle = '#b4c4c0'
  x.fillRect(0, 0, w, h)
  const sz = 16
  for (let r = 0; r < 16; r++) {
    for (let c = 0; c < 16; c++) {
      const bx = c * sz, by = r * sz
      x.fillStyle = (r * 11 + c * 7) % 5 === 0 ? '#a8b9b5' : '#bccbc7'
      x.fillRect(bx + 1, by + 1, sz - 2, sz - 2)
    }
  }
  x.strokeStyle = '#7c8e8a'
  x.lineWidth = 1
  for (let i = 0; i <= w; i += sz) {
    x.beginPath()
    x.moveTo(i, 0)
    x.lineTo(i, h)
    x.stroke()
    x.beginPath()
    x.moveTo(0, i)
    x.lineTo(w, i)
    x.stroke()
  }
})
clinicTileTex.wrapS = THREE.RepeatWrapping
clinicTileTex.wrapT = THREE.RepeatWrapping
clinicTileTex.repeat.set(4, 4)

function wallLantern(px: number, py: number, pz: number, dir: 'N' | 'S' | 'W' | 'E'): void {
  const g = new THREE.Group()
  const ironM = mat(0x22242a, { roughness: 0.4, metalness: 0.8 })
  const arm = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.42), ironM)
  g.add(arm)

  const cage = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.09, 0.35, 6),
    mat(0x22242a, { roughness: 0.3, metalness: 0.85 }))
  cage.position.set(0, -0.06, 0.22)
  g.add(cage)

  const flame = new THREE.Mesh(new THREE.SphereGeometry(0.065, 8, 8),
    new THREE.MeshStandardMaterial({
      color: 0xffe285,
      emissive: 0xffaa2b,
      emissiveIntensity: 1.8,
    }))
  flame.position.set(0, -0.06, 0.22)
  g.add(flame)

  const glowMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.85, 0.85),
    new THREE.MeshBasicMaterial({
      map: lampGlowTex,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }))
  glowMesh.position.set(0, -0.06, 0.23)
  g.add(glowMesh)

  if (dir === 'N') g.rotation.y = Math.PI
  else if (dir === 'S') g.rotation.y = 0
  else if (dir === 'W') g.rotation.y = -Math.PI / 2
  else if (dir === 'E') g.rotation.y = Math.PI / 2

  g.position.set(px, py, pz)
  scene.add(g)
}

function createRailing(x1: number, z1: number, x2: number, z2: number, yBase: number): void {
  const g = new THREE.Group()
  const brassM = mat(0xcda44b, { roughness: 0.3, metalness: 0.85 })
  const ironM = mat(0x22262c, { roughness: 0.4, metalness: 0.8 })

  const dx = x2 - x1, dz = z2 - z1
  const len = Math.hypot(dx, dz)
  const angle = Math.atan2(dx, dz)

  const handrail = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, len, 8), brassM)
  handrail.rotation.z = Math.PI / 2
  handrail.position.set(0, 0.95, len / 2)
  g.add(handrail)

  const bottomRail = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, len), ironM)
  bottomRail.position.set(0, 0.12, len / 2)
  g.add(bottomRail)

  const postCount = Math.max(2, Math.floor(len / 0.6))
  for (let i = 0; i <= postCount; i++) {
    const zPos = (i / postCount) * len
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.035, 0.9, 8), ironM)
    post.position.set(0, 0.48, zPos)
    g.add(post)
  }

  g.rotation.y = angle
  g.position.set(x1, yBase, z1)
  scene.add(g)

  const pad = 0.25
  blockRect(
    Math.min(x1, x2) - pad,
    Math.min(z1, z2) - pad,
    Math.max(x1, x2) + pad,
    Math.max(z1, z2) + pad,
    0,
  )
}

function createGrandStaircase(): void {
  const g = new THREE.Group()
  const marbleM = mat(0xdcd6cb, { roughness: 0.6, metalness: 0.15 })
  const carpetM = mat(0x7e1820, { map: redCarpetTex, roughness: 0.85 })
  const brassM = mat(0xd4af37, { roughness: 0.25, metalness: 0.9 })

  const steps = 14
  const startZ = -2.5
  const endZ = -6.5
  const startY = 0.0
  const endY = 2.4
  const width = 4.4
  const carpetW = 2.6

  const stepDepth = Math.abs(endZ - startZ) / steps
  const stepHeight = (endY - startY) / steps

  for (let i = 0; i < steps; i++) {
    const curY = startY + i * stepHeight
    const curZ = startZ - i * stepDepth - stepDepth / 2

    const stepMesh = new THREE.Mesh(
      new THREE.BoxGeometry(width, stepHeight + 0.02, stepDepth + 0.02),
      marbleM,
    )
    stepMesh.position.set(-2.0, curY + stepHeight / 2, curZ)
    stepMesh.castShadow = true
    stepMesh.receiveShadow = true
    g.add(stepMesh)

    const cStep = new THREE.Mesh(
      new THREE.BoxGeometry(carpetW, 0.02, stepDepth + 0.02),
      carpetM,
    )
    cStep.position.set(-2.0, curY + stepHeight + 0.01, curZ)
    cStep.receiveShadow = true
    g.add(cStep)
  }

  const leftX = -2.0 - width / 2
  const rightX = -2.0 + width / 2

  for (let lx of [leftX, rightX]) {
    const handrailGeo = new THREE.CylinderGeometry(0.05, 0.05, Math.hypot(endZ - startZ, endY - startY), 8)
    const hr = new THREE.Mesh(handrailGeo, brassM)
    const pitch = Math.atan2(endY - startY, Math.abs(endZ - startZ))
    hr.rotation.x = -pitch
    hr.position.set(lx, (startY + endY) / 2 + 0.85, (startZ + endZ) / 2)
    g.add(hr)

    for (let i = 0; i <= steps; i += 2) {
      const py = startY + i * stepHeight
      const pz = startZ - i * stepDepth
      const baluster = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, 0.85, 8), brassM)
      baluster.position.set(lx, py + 0.42, pz)
      g.add(baluster)
    }

    const newelBase = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.95, 0.24), brassM)
    newelBase.position.set(lx, startY + 0.48, startZ)
    g.add(newelBase)
    const newelBall = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 12), brassM)
    newelBall.position.set(lx, startY + 1.05, startZ)
    g.add(newelBall)
  }

  scene.add(g)

  blockRect(leftX - 0.25, endZ - 0.2, leftX + 0.25, startZ + 0.2, 0)
  blockRect(rightX - 0.25, endZ - 0.2, rightX + 0.25, startZ + 0.2, 0)
}

function createOpenWalls(opts: {
  x1: number; z1: number; x2: number; z2: number; yBase: number; h: number
  wallColor: number
  doorSide: 'N' | 'S' | 'W' | 'E'
  doorA: number; doorB: number
  floorMat: THREE.Material
}): void {
  const { x1, z1, x2, z2, yBase, h, wallColor, doorSide, doorA, doorB, floorMat } = opts
  const t = 0.4
  const wallMat = mat(wallColor, { map: wallPlasterTex, roughness: 0.85, metalness: 0.05 })

  const fWidth = (x2 - x1) - 0.1
  const fDepth = (z2 - z1) - 0.1
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(fWidth, fDepth), floorMat)
  floor.rotation.x = -Math.PI / 2
  floor.position.set((x1 + x2) / 2, yBase + 0.02, (z1 + z2) / 2)
  floor.receiveShadow = true
  scene.add(floor)

  const wMatBottom = mat(0x281c15, { map: woodTex, roughness: 0.65 })

  const buildWallPart = (wx1: number, wz1: number, wx2: number, wz2: number): void => {
    const w = Math.abs(wx2 - wx1)
    const d = Math.abs(wz2 - wz1)
    const mx = (wx1 + wx2) / 2
    const mz = (wz1 + wz2) / 2

    const topPart = new THREE.Mesh(new THREE.BoxGeometry(w, h - 1.2, d), wallMat)
    topPart.position.set(mx, yBase + 1.2 + (h - 1.2) / 2, mz)
    topPart.castShadow = true
    topPart.receiveShadow = true
    scene.add(topPart)

    const botPart = new THREE.Mesh(new THREE.BoxGeometry(w + 0.04, 1.2, d + 0.04), wMatBottom)
    botPart.position.set(mx, yBase + 0.6, mz)
    botPart.castShadow = true
    botPart.receiveShadow = true
    scene.add(botPart)

    blockRect(Math.min(wx1, wx2), Math.min(wz1, wz2), Math.max(wx1, wx2), Math.max(wz1, wz2), 0)
  }

  const doorLintel = (lx: number, lz: number, lw: number, ld: number): void => {
    const lh = 0.8
    const lint = new THREE.Mesh(new THREE.BoxGeometry(lw, lh, ld), wallMat)
    lint.position.set(lx, yBase + h - lh / 2, lz)
    lint.castShadow = true
    scene.add(lint)

    const trim = new THREE.Mesh(new THREE.BoxGeometry(lw + 0.15, 0.16, ld + 0.15),
      mat(0x221a14, { map: woodTex, roughness: 0.6 }))
    trim.position.set(lx, yBase + h - lh, lz)
    scene.add(trim)
  }

  if (doorSide === 'N') {
    buildWallPart(x1, z1, doorA, z1 + t)
    buildWallPart(doorB, z1, x2, z1 + t)
    doorLintel((doorA + doorB) / 2, z1 + t / 2, doorB - doorA, t + 0.08)
  } else {
    buildWallPart(x1, z1, x2, z1 + t)
  }

  if (doorSide === 'S') {
    buildWallPart(x1, z2 - t, doorA, z2)
    buildWallPart(doorB, z2 - t, x2, z2)
    doorLintel((doorA + doorB) / 2, z2 - t / 2, doorB - doorA, t + 0.08)
  } else {
    buildWallPart(x1, z2 - t, x2, z2)
  }

  if (doorSide === 'W') {
    buildWallPart(x1, z1, x1 + t, doorA)
    buildWallPart(x1, doorB, x1 + t, z2)
    doorLintel(x1 + t / 2, (doorA + doorB) / 2, t + 0.08, doorB - doorA)
  } else {
    buildWallPart(x1, z1, x1 + t, z2)
  }

  if (doorSide === 'E') {
    buildWallPart(x2 - t, z1, x2, doorA)
    buildWallPart(x2 - t, doorB, x2, z2)
    doorLintel(x2 - t / 2, (doorA + doorB) / 2, t + 0.08, doorB - doorA)
  } else {
    buildWallPart(x2 - t, z1, x2, z2)
  }
}

function createGrandPiano(): THREE.Group {
  const g = new THREE.Group()
  const blackM = mat(0x16161a, { roughness: 0.18, metalness: 0.45 })
  const goldM = mat(0xb89748, { roughness: 0.3, metalness: 0.85 })

  const body = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.55, 1.8), blackM)
  body.position.set(0, 0.75, 0)
  body.castShadow = true
  g.add(body)

  const curvedTail = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.85, 0.55, 12, 1, false, 0, Math.PI), blackM)
  curvedTail.position.set(-0.35, 0.75, -0.05)
  curvedTail.rotation.y = -Math.PI / 2
  curvedTail.castShadow = true
  g.add(curvedTail)

  const lid = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.06, 1.7), blackM)
  lid.position.set(-0.1, 1.35, -0.2)
  lid.rotation.z = 0.36
  lid.castShadow = true
  g.add(lid)

  const propStick = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.8, 8), goldM)
  propStick.position.set(0.65, 1.15, -0.2)
  propStick.rotation.z = -0.15
  g.add(propStick)

  const keyBed = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.12, 0.38), mat(0xeeeeee, { roughness: 0.3 }))
  keyBed.position.set(0.2, 0.8, 0.95)
  g.add(keyBed)

  const blackKeys = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.08, 0.22), mat(0x111114, { roughness: 0.2 }))
  blackKeys.position.set(0.2, 0.86, 0.91)
  g.add(blackKeys)

  const musicStand = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.4, 0.05), goldM)
  musicStand.position.set(0.2, 1.22, 0.75)
  musicStand.rotation.x = -0.3
  g.add(musicStand)

  const sheet = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.26), mat(0xf4ede2, { roughness: 0.9 }))
  sheet.position.set(0.2, 1.23, 0.78)
  sheet.rotation.x = -0.3
  g.add(sheet)

  const legGeo = new THREE.CylinderGeometry(0.07, 0.04, 0.75, 8)
  const l1 = new THREE.Mesh(legGeo, blackM)
  l1.position.set(-0.95, 0.37, -0.7)
  g.add(l1)
  const l2 = new THREE.Mesh(legGeo, blackM)
  l2.position.set(0.95, 0.37, -0.7)
  g.add(l2)
  const l3 = new THREE.Mesh(legGeo, blackM)
  l3.position.set(0.95, 0.37, 0.7)
  g.add(l3)

  const stool = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.1, 16),
    mat(0x6a1820, { map: fabricTex, roughness: 0.8 }))
  stool.position.set(0.2, 0.48, 1.45)
  g.add(stool)
  const stoolLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.06, 0.48, 8), goldM)
  stoolLeg.position.set(0.2, 0.24, 1.45)
  g.add(stoolLeg)

  return g
}

function createFireplace(): THREE.Group {
  const g = new THREE.Group()
  const mBase = mat(0xded8cc, { roughness: 0.6, metalness: 0.15 })
  const mInner = mat(0x181514, { roughness: 0.9 })

  const mainSurround = new THREE.Mesh(new THREE.BoxGeometry(2.8, 2.4, 0.8), mBase)
  mainSurround.position.set(0, 1.2, 0)
  mainSurround.castShadow = true
  g.add(mainSurround)

  const hearthOpening = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.5, 0.85), mInner)
  hearthOpening.position.set(0, 0.85, 0.05)
  g.add(hearthOpening)

  const mantelpiece = new THREE.Mesh(new THREE.BoxGeometry(3.1, 0.16, 1.05),
    mat(0x2d1f18, { map: woodTex, roughness: 0.5 }))
  mantelpiece.position.set(0, 2.48, 0)
  g.add(mantelpiece)

  const grate = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.2, 0.45), mat(0x282c32, { roughness: 0.5, metalness: 0.8 }))
  grate.position.set(0, 0.15, 0.1)
  g.add(grate)

  const logM = mat(0x221710, { roughness: 0.9 })
  const log1 = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.09, 1.0, 8), logM)
  log1.rotation.z = Math.PI / 2
  log1.position.set(0, 0.32, 0.1)
  g.add(log1)
  const log2 = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, 0.9, 8), logM)
  log2.rotation.set(0.2, 0.1, Math.PI / 2.2)
  log2.position.set(0, 0.42, 0.12)
  g.add(log2)

  const candlePair = (cx: number, cy: number, cz: number): void => {
    const s = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.09, 0.25, 8),
      mat(0xb89748, { roughness: 0.3, metalness: 0.85 }))
    s.position.set(cx, cy, cz)
    g.add(s)
    const wax = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.2, 8), mat(0xeee4cf))
    wax.position.set(cx, cy + 0.2, cz)
    g.add(wax)
    const flame = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.08, 8),
      new THREE.MeshStandardMaterial({ color: 0xffaa22, emissive: 0xff7700, emissiveIntensity: 2.0 }))
    flame.position.set(cx, cy + 0.34, cz)
    g.add(flame)
  }
  candlePair(-1.0, 2.62, 0.1)
  candlePair(1.0, 2.62, 0.1)

  return g
}

function createGrandClock(): THREE.Group {
  const g = new THREE.Group()
  const caseM = mat(0x3a2214, { map: woodTex, roughness: 0.6 })
  const brassM = mat(0xd4af37, { roughness: 0.3, metalness: 0.85 })

  const base = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.7, 0.5), caseM)
  base.position.set(0, 0.35, 0)
  g.add(base)

  const waist = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.6, 0.42), caseM)
  waist.position.set(0, 1.5, 0)
  g.add(waist)

  const glassDoor = new THREE.Mesh(new THREE.BoxGeometry(0.58, 1.35, 0.04),
    mat(0xddeeff, { roughness: 0.1, metalness: 0.2, transparent: true, opacity: 0.45 }))
  glassDoor.position.set(0, 1.5, 0.22)
  g.add(glassDoor)

  const pendulum = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 1.1, 8), brassM)
  pendulum.position.set(0, 1.5, 0.08)
  g.add(pendulum)
  const bob = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.05, 16), brassM)
  bob.rotation.x = Math.PI / 2
  bob.position.set(0, 1.05, 0.08)
  g.add(bob)

  const weight1 = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.4, 12), brassM)
  weight1.position.set(-0.14, 1.6, 0.08)
  g.add(weight1)
  const weight2 = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.4, 12), brassM)
  weight2.position.set(0.14, 1.45, 0.08)
  g.add(weight2)

  const wire = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 1.6, 6),
    mat(0x8898a8, { metalness: 0.9, roughness: 0.2 }))
  wire.position.set(0.14, 2.2, 0.08)
  g.add(wire)

  const hood = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.9, 0.5), caseM)
  hood.position.set(0, 2.75, 0)
  g.add(hood)

  const dial = new THREE.Mesh(new THREE.CircleGeometry(0.34, 24), mat(0xfff7e8, { roughness: 0.4 }))
  dial.position.set(0, 2.75, 0.26)
  g.add(dial)

  const hands = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.3, 0.02), mat(0x111114))
  hands.position.set(0, 2.82, 0.28)
  g.add(hands)

  const pediment = new THREE.Mesh(new THREE.ConeGeometry(0.58, 0.35, 4), caseM)
  pediment.rotation.y = Math.PI / 4
  pediment.position.set(0, 3.38, 0)
  g.add(pediment)

  return g
}

function createDeskAndChairs(): THREE.Group {
  const g = new THREE.Group()
  const woodM = mat(0x321f14, { map: woodTex, roughness: 0.55 })
  const brassM = mat(0xb89748, { roughness: 0.3, metalness: 0.85 })

  const top = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.12, 1.2), woodM)
  top.position.set(0, 0.82, 0)
  top.castShadow = true
  g.add(top)

  const pad = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.02, 0.85), mat(0x1e3028, { map: leatherTex, roughness: 0.7 }))
  pad.position.set(0, 0.89, 0)
  g.add(pad)

  const leftDrawer = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.75, 1.05), woodM)
  leftDrawer.position.set(-0.85, 0.38, 0)
  leftDrawer.castShadow = true
  g.add(leftDrawer)

  const rightDrawer = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.75, 1.05), woodM)
  rightDrawer.position.set(0.85, 0.38, 0)
  rightDrawer.castShadow = true
  g.add(rightDrawer)

  for (let dy of [0.55, 0.35, 0.15]) {
    const h1 = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.04, 0.04), brassM)
    h1.position.set(-0.85, dy, 0.55)
    g.add(h1)
    const h2 = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.04, 0.04), brassM)
    h2.position.set(0.85, dy, 0.55)
    g.add(h2)
  }

  const ink = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.1, 8), mat(0x181c24, { metalness: 0.7 }))
  ink.position.set(0.8, 0.94, -0.3)
  g.add(ink)
  const quill = new THREE.Mesh(new THREE.ConeGeometry(0.015, 0.3, 6), mat(0xeee9dd))
  quill.rotation.z = -0.4
  quill.position.set(0.84, 1.05, -0.3)
  g.add(quill)

  const chairM = mat(0x421b14, { map: leatherTex, roughness: 0.65 })
  const chairFrameM = mat(0x22140c, { roughness: 0.7 })

  const seat = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.1, 0.62), chairM)
  seat.position.set(0, 0.5, -0.85)
  g.add(seat)

  const back = new THREE.Mesh(new THREE.BoxGeometry(0.64, 0.9, 0.1), chairM)
  back.position.set(0, 0.95, -1.12)
  g.add(back)

  const cLegGeo = new THREE.CylinderGeometry(0.035, 0.03, 0.48, 8)
  for (let lx of [-0.26, 0.26]) {
    for (let lz of [-0.65, -1.05]) {
      const cl = new THREE.Mesh(cLegGeo, chairFrameM)
      cl.position.set(lx, 0.24, lz)
      g.add(cl)
    }
  }

  return g
}

function createBookcase(): THREE.Group {
  const g = new THREE.Group()
  const woodM = mat(0x2d1b12, { map: woodTex, roughness: 0.65 })

  const frame = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.9, 0.55), woodM)
  frame.position.set(0, 1.45, 0)
  frame.castShadow = true
  g.add(frame)

  const colors = [0x78241e, 0x1d3856, 0x224830, 0x4f3521, 0xd4af37, 0x5a2632]
  for (let row = 0; row < 4; row++) {
    const ry = 0.45 + row * 0.65
    let currX = -0.95
    while (currX < 0.95) {
      const bw = rand(0.08, 0.16)
      const bh = rand(0.38, 0.52)
      const bColor = colors[Math.floor(rand(0, colors.length))]
      const book = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, 0.42),
        mat(bColor, { roughness: 0.7 }))
      book.position.set(currX + bw / 2, ry + bh / 2, 0.04)
      g.add(book)
      currX += bw + 0.015
    }
  }
  return g
}

function createGreenhouseBench(): THREE.Group {
  const g = new THREE.Group()
  const benchWood = mat(0x384a36, { map: woodTex, roughness: 0.75 })

  const top = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.12, 1.1), benchWood)
  top.position.set(0, 0.85, 0)
  top.castShadow = true
  g.add(top)

  const l1 = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.82, 0.12), benchWood)
  l1.position.set(-1.18, 0.41, -0.42)
  g.add(l1)
  const l2 = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.82, 0.12), benchWood)
  l2.position.set(1.18, 0.41, -0.42)
  g.add(l2)
  const l3 = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.82, 0.12), benchWood)
  l3.position.set(-1.18, 0.41, 0.42)
  g.add(l3)
  const l4 = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.82, 0.12), benchWood)
  l4.position.set(1.18, 0.41, 0.42)
  g.add(l4)

  const mortar = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.08, 0.16, 12),
    mat(0xe5ded0, { roughness: 0.5, metalness: 0.1 }))
  mortar.position.set(-0.6, 0.98, 0)
  g.add(mortar)
  const pestle = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.035, 0.26, 8), mat(0xd4af37))
  pestle.rotation.z = 0.35
  pestle.position.set(-0.56, 1.08, 0)
  g.add(pestle)

  const flask = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.28, 12),
    mat(0x99ddcc, { roughness: 0.1, metalness: 0.3, transparent: true, opacity: 0.7 }))
  flask.position.set(0.45, 1.05, 0.1)
  g.add(flask)

  const pottedPlant = (px: number, pz: number, leafColor: number): void => {
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.11, 0.24, 12),
      mat(0x8a4b32, { roughness: 0.8 }))
    pot.position.set(px, 1.02, pz)
    g.add(pot)
    const leaves = new THREE.Mesh(new THREE.DodecahedronGeometry(0.24, 1),
      mat(leafColor, { roughness: 0.9 }))
    leaves.position.set(px, 1.24, pz)
    g.add(leaves)
  }
  pottedPlant(0.9, -0.2, 0x3d6640)
  pottedPlant(-0.15, -0.25, 0x6e3d7a)

  return g
}

function createPlantRack(): THREE.Group {
  const g = new THREE.Group()
  const ironM = mat(0x28322c, { roughness: 0.5, metalness: 0.7 })

  for (let s = 0; s < 3; s++) {
    const shelf = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.06, 0.45), ironM)
    shelf.position.set(0, 0.4 + s * 0.7, -0.15 + s * 0.12)
    g.add(shelf)

    const colors = [0x345e38, 0x6a3f78, 0x2e6b52, 0x8a3838, 0x4a7842]
    for (let p = -0.85; p <= 0.85; p += 0.42) {
      const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.09, 0.18, 10), mat(0x8a4630, { roughness: 0.8 }))
      pot.position.set(p, 0.5 + s * 0.7, -0.15 + s * 0.12)
      g.add(pot)
      const fol = new THREE.Mesh(new THREE.DodecahedronGeometry(0.18, 1),
        mat(colors[Math.floor(rand(0, colors.length))], { roughness: 0.9 }))
      fol.position.set(p, 0.68 + s * 0.7, -0.15 + s * 0.12)
      g.add(fol)
    }
  }
  return g
}

function createMedicineCabinet(): THREE.Group {
  const g = new THREE.Group()
  const frameM = mat(0x2d3f38, { map: woodTex, roughness: 0.55 })
  const glassM = mat(0x9cd9cc, { roughness: 0.15, metalness: 0.4, transparent: true, opacity: 0.55 })

  const mainBox = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.6, 0.65), frameM)
  mainBox.position.set(0, 1.3, 0)
  mainBox.castShadow = true
  g.add(mainBox)

  const leftGlass = new THREE.Mesh(new THREE.BoxGeometry(0.95, 1.6, 0.04), glassM)
  leftGlass.position.set(-0.52, 1.48, 0.33)
  g.add(leftGlass)

  const rightGlass = new THREE.Mesh(new THREE.BoxGeometry(0.95, 1.6, 0.04), glassM)
  rightGlass.position.set(0.52, 1.48, 0.33)
  g.add(rightGlass)

  const bottleColors = [0x50756c, 0xb87a40, 0x3d5c7a, 0x8f3c4d, 0x6e7880]
  for (let s = 0; s < 3; s++) {
    const sy = 0.85 + s * 0.58
    for (let bx = -0.8; bx <= 0.8; bx += 0.28) {
      const bColor = bottleColors[Math.floor(rand(0, bottleColors.length))]
      const bot = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.065, 0.24, 8),
        mat(bColor, { roughness: 0.2, metalness: 0.3, transparent: true, opacity: 0.85 }))
      bot.position.set(bx, sy + 0.12, 0.12)
      g.add(bot)
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.05, 8), mat(0xd4af37))
      cap.position.set(bx, sy + 0.26, 0.12)
      g.add(cap)
    }
  }

  const drawer1 = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.35, 0.55), mat(0x22302b))
  drawer1.position.set(-0.55, 0.38, 0.05)
  g.add(drawer1)
  const drawer2 = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.35, 0.55), mat(0x22302b))
  drawer2.position.set(0.55, 0.38, 0.05)
  g.add(drawer2)

  const keyhole = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.04, 8), mat(0xd4af37, { metalness: 0.9 }))
  keyhole.rotation.x = Math.PI / 2
  keyhole.position.set(0.55, 0.38, 0.34)
  g.add(keyhole)

  return g
}

function createDoctorDesk(): THREE.Group {
  const g = new THREE.Group()
  const woodM = mat(0x24322d, { map: woodTex, roughness: 0.6 })

  const top = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.12, 1.1), woodM)
  top.position.set(0, 0.85, 0)
  top.castShadow = true
  g.add(top)

  for (let lx of [-0.98, 0.98]) {
    for (let lz of [-0.45, 0.45]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.84, 0.1), woodM)
      leg.position.set(lx, 0.42, lz)
      g.add(leg)
    }
  }

  const microscope = new THREE.Group()
  const brassM = mat(0xd4af37, { roughness: 0.3, metalness: 0.85 })
  const mb = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.05, 0.22), brassM)
  microscope.add(mb)
  const mt = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.35, 8), brassM)
  mt.rotation.x = 0.25
  mt.position.set(0, 0.22, -0.04)
  microscope.add(mt)
  microscope.position.set(-0.6, 0.94, 0.1)
  g.add(microscope)

  const medicalBook = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.08, 0.48), mat(0x1a2e3b, { roughness: 0.8 }))
  medicalBook.position.set(0.4, 0.95, -0.1)
  g.add(medicalBook)

  return g
}

function createCanopyBed(): THREE.Group {
  const g = new THREE.Group()
  const woodM = mat(0x2b1b14, { map: woodTex, roughness: 0.65 })
  const velvetM = mat(0x5e1620, { map: fabricTex, roughness: 0.85 })
  const sheetM = mat(0xdedad4, { roughness: 0.7 })

  const base = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.45, 3.0), woodM)
  base.position.set(0, 0.3, 0)
  g.add(base)

  const mattress = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.4, 2.8), sheetM)
  mattress.position.set(0, 0.6, 0)
  g.add(mattress)

  const duvet = new THREE.Mesh(new THREE.BoxGeometry(2.22, 0.22, 1.8), velvetM)
  duvet.position.set(0, 0.76, 0.45)
  g.add(duvet)

  const pillow1 = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.16, 0.45), sheetM)
  pillow1.position.set(-0.55, 0.86, -1.0)
  g.add(pillow1)
  const pillow2 = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.16, 0.45), sheetM)
  pillow2.position.set(0.55, 0.86, -1.0)
  g.add(pillow2)

  const postGeo = new THREE.CylinderGeometry(0.06, 0.08, 2.8, 8)
  for (let px of [-1.15, 1.15]) {
    for (let pz of [-1.45, 1.45]) {
      const post = new THREE.Mesh(postGeo, woodM)
      post.position.set(px, 1.4, pz)
      g.add(post)
    }
  }

  const canopyFrame = new THREE.Mesh(new THREE.BoxGeometry(2.45, 0.12, 3.05), velvetM)
  canopyFrame.position.set(0, 2.8, 0)
  g.add(canopyFrame)

  return g
}

function createJulianDesk(): THREE.Group {
  const g = new THREE.Group()
  const woodM = mat(0x38241a, { map: woodTex, roughness: 0.6 })

  const top = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.1, 1.0), woodM)
  top.position.set(0, 0.8, 0)
  g.add(top)

  for (let lx of [-0.8, 0.8]) {
    for (let lz of [-0.4, 0.4]) {
      const l = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.78, 0.08), woodM)
      l.position.set(lx, 0.4, lz)
      g.add(l)
    }
  }

  const bottle = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.32, 8),
    mat(0x385532, { roughness: 0.2, transparent: true, opacity: 0.8 }))
  bottle.position.set(-0.4, 0.98, -0.15)
  g.add(bottle)

  const glass = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.025, 0.12, 8),
    mat(0xccddee, { roughness: 0.2, transparent: true, opacity: 0.6 }))
  glass.rotation.z = Math.PI / 2.3
  glass.position.set(-0.25, 0.86, -0.1)
  g.add(glass)

  const card = new THREE.Mesh(new THREE.PlaneGeometry(0.25, 0.18), mat(0xefede8))
  card.rotation.x = -Math.PI / 2
  card.position.set(0.3, 0.86, 0.1)
  g.add(card)

  return g
}

export function setupMap(worldCtx: WorldContext): void {
  const { player } = worldCtx

  scene.add(new THREE.AmbientLight(0xffeed8, 0.52))
  scene.add(new THREE.HemisphereLight(0xdde8f8, 0x3d3024, 0.54))

  const groundGeo = new THREE.PlaneGeometry(84, 84)
  const groundMat = mat(0x1b1e25, { map: marbleTileTex, roughness: 0.7, metalness: 0.12 })
  const groundMesh = new THREE.Mesh(groundGeo, groundMat)
  groundMesh.rotation.x = -Math.PI / 2
  groundMesh.receiveShadow = true
  scene.add(groundMesh)

  const runnerGeo = new THREE.PlaneGeometry(3.6, 17.5)
  const runnerMat = mat(0x7e1820, { map: redCarpetTex, roughness: 0.85 })
  const mainRunner = new THREE.Mesh(runnerGeo, runnerMat)
  mainRunner.rotation.x = -Math.PI / 2
  mainRunner.position.set(-2.0, 0.025, 5.0)
  mainRunner.receiveShadow = true
  scene.add(mainRunner)

  const upperPlat = new THREE.Mesh(
    new THREE.BoxGeometry(30, 2.4, 13.5),
    mat(0x281d16, { roughness: 0.8 }),
  )
  upperPlat.position.set(-11.5, 1.2, -12.75)
  upperPlat.receiveShadow = true
  upperPlat.castShadow = true
  scene.add(upperPlat)

  const galleryFloor = new THREE.Mesh(
    new THREE.PlaneGeometry(15.5, 6.0),
    mat(0x262a33, { map: marbleTileTex, roughness: 0.65 }),
  )
  galleryFloor.rotation.x = -Math.PI / 2
  galleryFloor.position.set(-4.25, 2.415, -9.5)
  galleryFloor.receiveShadow = true
  scene.add(galleryFloor)

  const galleryRunner = new THREE.Mesh(
    new THREE.PlaneGeometry(15.0, 2.4),
    mat(0x821a22, { map: redCarpetTex, roughness: 0.85 }),
  )
  galleryRunner.rotation.x = -Math.PI / 2
  galleryRunner.position.set(-4.25, 2.425, -9.5)
  galleryRunner.receiveShadow = true
  scene.add(galleryRunner)

  createGrandStaircase()

  createRailing(-12.0, -6.5, -4.2, -6.5, 2.4)
  createRailing(0.2, -6.5, 3.5, -6.5, 2.4)
  createRailing(3.5, -12.5, 3.5, -6.5, 2.4)

  const gothicPillar = (px: number, pz: number, yB = 0.0, h = 5.2): void => {
    const colG = new THREE.Group()
    const stoneM = mat(0x383e4a, { map: wallPlasterTex, roughness: 0.72, metalness: 0.12 })

    const plinth = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.5, 0.9), stoneM)
    plinth.position.y = 0.25
    colG.add(plinth)

    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.4, h - 0.8, 12), stoneM)
    shaft.position.y = (h - 0.8) / 2 + 0.5
    shaft.castShadow = true
    colG.add(shaft)

    const capital = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.4, 1.0), stoneM)
    capital.position.y = h - 0.2
    colG.add(capital)

    colG.position.set(px, yB, pz)
    scene.add(colG)
    blockRect(px - 0.5, pz - 0.5, px + 0.5, pz + 0.5, 0)
  }

  gothicPillar(-6.5, 8.0, 0.0)
  gothicPillar(2.5, 8.0, 0.0)
  gothicPillar(-6.5, 2.0, 0.0)
  gothicPillar(2.5, 2.0, 0.0)

  gothicPillar(-12.0, -6.5, 2.4, 3.2)
  gothicPillar(3.5, -6.5, 2.4, 3.2)

  blockRect(-42, -42, 42, -22)
  blockRect(-42, 22, 42, 42)
  blockRect(-42, -42, -28, 42)
  blockRect(28, -42, 42, 42)

  createOpenWalls({
    x1: -26, z1: -18, x2: -12, z2: -4, yBase: 2.4, h: 3.2,
    wallColor: 0x362b24,
    doorSide: 'E',
    doorA: -12.5, doorB: -9.5,
    floorMat: mat(0x402b1c, { map: parquetTex, roughness: 0.65 }),
  })

  const pRug = new THREE.Mesh(new THREE.PlaneGeometry(6.0, 4.5),
    mat(0x751a22, { map: persianRugTex, roughness: 0.85 }))
  pRug.rotation.x = -Math.PI / 2
  pRug.position.set(-19.0, 2.425, -10.5)
  pRug.receiveShadow = true
  scene.add(pRug)

  const desk = createDeskAndChairs()
  desk.position.set(-19.0, 2.4, -11.0)
  scene.add(desk)
  tagInteractive(desk, 'body', '男爵书桌与遗体', 'clue')
  blockRect(-20.4, -12.4, -17.6, -10.4, 0)

  const chalkM = chalkOutline(-18.8, -9.6, 0.4)
  chalkM.position.y = 2.428
  chalkM.rotation.y = 0.35
  scene.add(chalkM)

  const cupM = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.08, 0.16, 8), mat(0xeef2f5, { roughness: 0.25 }))
  cupM.rotation.z = Math.PI / 2
  cupM.position.set(-17.6, 2.48, -9.8)
  scene.add(cupM)
  tagInteractive(cupM, 'teacup', '打翻的骨瓷茶杯')

  const candleM = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.09, 0.35, 8), mat(0xdcd2bc, { roughness: 0.6 }))
  candleM.position.set(-19.8, 3.28, -11.2)
  scene.add(candleM)
  tagInteractive(candleM, 'candle', '未燃尽的沉香蜡烛')

  const fireplace = createFireplace()
  fireplace.position.set(-19.0, 2.4, -17.3)
  scene.add(fireplace)
  blockRect(-20.5, -17.8, -17.5, -16.8, 0)
  tagInteractive(fireplace, 'fireplace', '大理石壁炉与灰烬')

  const grandClock = createGrandClock()
  grandClock.position.set(-12.7, 2.4, -6.5)
  grandClock.rotation.y = -Math.PI / 2
  scene.add(grandClock)
  blockRect(-13.2, -7.1, -12.2, -5.9, 0)
  tagInteractive(grandClock, 'clock', '双面重锤机械钟')

  const bookcase = createBookcase()
  bookcase.position.set(-25.5, 2.4, -11.0)
  bookcase.rotation.y = Math.PI / 2
  scene.add(bookcase)
  blockRect(-26.0, -12.3, -25.0, -9.7, 0)

  createOpenWalls({
    x1: -26, z1: 4, x2: -12, z2: 18, yBase: 0.0, h: 3.2,
    wallColor: 0x243528,
    doorSide: 'E',
    doorA: 9.0, doorB: 13.0,
    floorMat: mat(0x482d22, { map: greenhouseTileTex, roughness: 0.8 }),
  })

  const ghBench = createGreenhouseBench()
  ghBench.position.set(-19.0, 0.0, 12.0)
  scene.add(ghBench)
  blockRect(-20.4, 11.4, -17.6, 12.6, 0)
  tagInteractive(ghBench, 'greenhouse_desk', '温室草药操作台')

  const plantRack = createPlantRack()
  plantRack.position.set(-25.4, 0.0, 11.0)
  plantRack.rotation.y = Math.PI / 2
  scene.add(plantRack)
  blockRect(-25.8, 9.6, -24.8, 12.4, 0)

  createOpenWalls({
    x1: 12, z1: 4, x2: 26, z2: 18, yBase: 0.0, h: 3.2,
    wallColor: 0x3d2b24,
    doorSide: 'W',
    doorA: 9.0, doorB: 13.0,
    floorMat: mat(0x3e281b, { map: parquetTex, roughness: 0.7 }),
  })

  const canopyBed = createCanopyBed()
  canopyBed.position.set(20.5, 0.0, 15.6)
  scene.add(canopyBed)
  blockRect(19.2, 14.0, 21.8, 17.2, 0)

  const julianDesk = createJulianDesk()
  julianDesk.position.set(19.0, 0.0, 7.5)
  scene.add(julianDesk)
  blockRect(18.0, 6.9, 20.0, 8.1, 0)

  createOpenWalls({
    x1: 12, z1: -18, x2: 26, z2: -4, yBase: 0.0, h: 3.2,
    wallColor: 0x243530,
    doorSide: 'W',
    doorA: -12.5, doorB: -9.5,
    floorMat: mat(0xa8b8b4, { map: clinicTileTex, roughness: 0.45 }),
  })

  const medCabinet = createMedicineCabinet()
  medCabinet.position.set(19.5, 0.0, -17.3)
  scene.add(medCabinet)
  blockRect(18.3, -17.8, 20.7, -16.8, 0)
  tagInteractive(medCabinet, 'clinic_cabinet', '凡森特医生的药柜')

  const docDesk = createDoctorDesk()
  docDesk.position.set(18.5, 0.0, -10.0)
  scene.add(docDesk)
  blockRect(17.3, -10.6, 19.7, -9.4, 0)

  const mudM = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 1.4),
    mat(0x3e2e42, { roughness: 0.95 }))
  mudM.rotation.x = -Math.PI / 2
  mudM.position.set(-8.5, 0.03, 0.5)
  scene.add(mudM)
  tagInteractive(mudM, 'corridor_mud', '走廊角落的花泥鞋印')

  const grandPiano = createGrandPiano()
  grandPiano.position.set(-2.0, 2.4, -10.6)
  scene.add(grandPiano)
  blockRect(-3.3, -11.6, -0.7, -9.7, 0)
  tagInteractive(grandPiano, 'piano', '羽管键琴')

  const boardGroup = new THREE.Group()
  const easelM = mat(0x422a18, { roughness: 0.7 })
  const easelLeg1 = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 2.4, 8), easelM)
  easelLeg1.rotation.z = -0.15
  easelLeg1.position.set(-0.35, 1.15, 0)
  boardGroup.add(easelLeg1)
  const easelLeg2 = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 2.4, 8), easelM)
  easelLeg2.rotation.z = 0.15
  easelLeg2.position.set(0.35, 1.15, 0)
  boardGroup.add(easelLeg2)
  const easelBack = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 2.3, 8), easelM)
  easelBack.rotation.x = 0.22
  easelBack.position.set(0, 1.1, -0.28)
  boardGroup.add(easelBack)

  const boardM = new THREE.Mesh(new THREE.BoxGeometry(2.1, 1.5, 0.08), mat(0x1a241e, { roughness: 0.85 }))
  boardM.position.set(0, 1.5, 0.02)
  boardGroup.add(boardM)

  const boardFrame = new THREE.Mesh(new THREE.BoxGeometry(2.22, 1.62, 0.06), mat(0xd4af37, { roughness: 0.4, metalness: 0.8 }))
  boardFrame.position.set(0, 1.5, 0)
  boardGroup.add(boardFrame)

  boardGroup.rotation.y = -Math.PI / 2
  boardGroup.position.set(4.5, 0.0, 3.5)
  scene.add(boardGroup)
  blockRect(4.0, 2.8, 5.0, 4.2, 0)
  tagInteractive(boardM, 'board', '案情分析立架')

  lamp(-2, 15.5)
  lamp(-2, 1.0)
  lamp(-8.5, 11.0)
  lamp(4.5, 11.0)
  lamp(4.5, -11.0)

  wallLantern(-12.0, 4.6, -11.0, 'W')
  wallLantern(-12.0, 2.4, 11.0, 'W')
  wallLantern(12.0, 2.4, 11.0, 'E')
  wallLantern(12.0, 2.4, -11.0, 'E')

  hallChandelier = new THREE.PointLight(0xffe6b8, 1.85, 24, 1.4)
  hallChandelier.position.set(-2.0, 5.6, 3.5)
  scene.add(hallChandelier)

  foyerLight = new THREE.PointLight(0xffbe76, 1.5, 16, 1.5)
  foyerLight.position.set(-2.0, 3.6, 14.5)
  scene.add(foyerLight)

  pianoLight = new THREE.PointLight(0xffe4aa, 1.6, 16, 1.5)
  pianoLight.position.set(-2.0, 5.2, -9.5)
  scene.add(pianoLight)

  studyLight = new THREE.PointLight(0xffa855, 2.2, 16, 1.5)
  studyLight.position.set(-19.0, 5.4, -11.0)
  scene.add(studyLight)

  fireLight = new THREE.PointLight(0xff5511, 2.6, 13, 1.6)
  fireLight.position.set(-19.0, 3.6, -16.5)
  scene.add(fireLight)

  greenhouseLight = new THREE.PointLight(0x7fe3aa, 1.4, 16, 1.5)
  greenhouseLight.position.set(-19.0, 3.2, 11.0)
  scene.add(greenhouseLight)

  guestLight = new THREE.PointLight(0xffbe7a, 1.5, 16, 1.5)
  guestLight.position.set(19.0, 3.2, 11.0)
  scene.add(guestLight)

  clinicLight = new THREE.PointLight(0x8eeed4, 1.7, 16, 1.5)
  clinicLight.position.set(19.0, 3.2, -11.0)
  scene.add(clinicLight)

  for (const k in NPCS) {
    const d = NPCS[k]
    const m = makeChar(d.coat, d.coat, { hat: d.hat !== false, hair: d.hair, role: k })
    const ny = getHeightAt(d.pos[0], d.pos[1])
    m.position.set(d.pos[0], ny, d.pos[1])
    d.mesh = m
    tagInteractive(m, k, d.n, 'npc')
    addLabel(m, d.n, 2.4, d.role)
    blockRect(d.pos[0] - 0.45, d.pos[1] - 0.45, d.pos[0] + 0.45, d.pos[1] + 0.45)
  }

  const sPos = new Float32Array(snowCount * 3)
  snowVel = []
  for (let i = 0; i < snowCount; i++) {
    sPos[i * 3] = rand(-40, 40)
    sPos[i * 3 + 1] = rand(0.5, 16)
    sPos[i * 3 + 2] = rand(-40, 40)
    snowVel.push({
      vx: rand(-0.4, 0.4),
      vy: rand(-1.8, -0.8),
      vz: rand(-0.4, 0.4),
    })
  }
  snowGeo = new THREE.BufferGeometry()
  snowGeo.setAttribute('position', new THREE.BufferAttribute(sPos, 3))
  const snowMat = new THREE.PointsMaterial({
    color: 0xccddee,
    size: 0.18,
    transparent: true,
    opacity: 0.75,
  })
  const snowPoints = new THREE.Points(snowGeo, snowMat)
  scene.add(snowPoints)
}

export function update(dt: number, now: number): void {
  if (fireLight) {
    fireLight.intensity = 2.4 + Math.sin(now * 8) * 0.45 + Math.sin(now * 15) * 0.25
  }
  if (studyLight) {
    studyLight.intensity = 2.1 + Math.sin(now * 3.5) * 0.15
  }
  if (hallChandelier) {
    hallChandelier.intensity = 1.8 + Math.sin(now * 2) * 0.08
  }

  if (snowGeo) {
    const posAttr = snowGeo.getAttribute('position') as THREE.BufferAttribute
    const pos = posAttr.array as Float32Array
    for (let i = 0; i < snowCount; i++) {
      const v = snowVel[i]
      pos[i * 3] += v.vx * dt
      pos[i * 3 + 1] += v.vy * dt
      pos[i * 3 + 2] += v.vz * dt
      if (pos[i * 3 + 1] < 0.2) {
        pos[i * 3 + 1] = rand(12, 16)
        pos[i * 3] = rand(-40, 40)
        pos[i * 3 + 2] = rand(-40, 40)
      }
    }
    posAttr.needsUpdate = true
  }
}

export function onInteract(id: string, ctx: InteractContext): void {
  const { G, addClue, checkFX, failFX, toast, sfx, setFlag, hasFlag } = ctx
  switch (id) {
    case 'body':
      if (!G.clues.includes('clue_silver_knife')) {
        addClue('clue_silver_knife')
        toast('发现重要物证：胸前插着的纯银拆信刀。')
      }
      if (!G.clues.includes('clue_autopsy_vane')) {
        if (G.attrs.kno >= 4 || G.attrs.ins >= 4) {
          checkFX('kno', 4)
          addClue('clue_autopsy_vane')
          setFlag('seenBody')
          toast('详查尸表：创口无生活反应，死于乌头碱呼吸麻痹！')
        } else {
          failFX('kno', 4, '死者面容青紫狰狞……你需要更高的学识或洞察力来判断真正死因。')
        }
      }
      break

    case 'teacup':
      if (G.clues.includes('clue_tea_cup')) {
        toast('地毯上的残茶渗湿了羊毛绒，苦杏仁味扑鼻。')
      } else {
        addClue('clue_tea_cup')
        toast('提取物证：打翻的骨瓷茶杯。')
      }
      break

    case 'candle':
      if (G.clues.includes('clue_candle')) {
        toast('蜡烛基座处那个极细的注射孔清晰可见。')
        break
      }
      if (G.attrs.ins >= 4 || G.attrs.kno >= 4) {
        checkFX('ins', 4)
        addClue('clue_candle')
        toast('细致检视：蜡烛基座深处暗藏一个极细的注射针孔！')
      } else {
        failFX('ins', 4, '粗大的沉香蜡烛……表面看似寻常，基座处似乎有些异样蜡痕。')
      }
      break

    case 'fireplace':
      if (G.clues.includes('clue_will_remnant')) {
        toast('壁炉炭灰里只剩些焦黑残渣。')
        break
      }
      addClue('clue_will_remnant')
      toast('从余烬中抢救出：未烧尽的遗嘱残页。')
      break

    case 'clock':
      if (G.clues.includes('clue_clock_device')) {
        toast('双面重锤机械钟的发条机关已被你彻底解明。')
        break
      }
      if (G.attrs.int >= 4 || G.attrs.kno >= 4) {
        checkFX('int', 4)
        addClue('clue_clock_device')
        toast('破解密室：重锤下坠拉死黄铜门栓的延时机关！')
      } else {
        failFX('int', 4, '挂钟的摆锤有异常阻力……齿轮箱后似乎连接着奇怪的金属细弦。')
      }
      break

    case 'greenhouse_desk':
      if (G.clues.includes('clue_eleanor_herbs')) {
        toast('花房抽屉已被搜查完毕。')
        break
      }
      if (G.attrs.ins >= 3) {
        checkFX('ins', 3)
        addClue('clue_eleanor_herbs')
        toast('搜获物证：艾莲娜夫人的温室草药手记。')
      } else {
        failFX('ins', 3, '抽屉里塞着许多花种和植物标本，你一时理不出头绪。')
      }
      break

    case 'clinic_cabinet':
      if (G.clues.includes('clue_syringe')) {
        toast('凡森特医生的药柜暗格已经空了。')
        break
      }
      if (hasFlag('clinicOpen') || G.attrs.int >= 5) {
        if (!hasFlag('clinicOpen')) {
          checkFX('int', 5)
        }
        addClue('clue_syringe')
        toast('搜获关键物证：带有熔蜡与乌头碱残留的医用铜注射器！')
      } else {
        failFX('int', 5, '药柜暗锁十分精密。也许管家莫里斯保管着这里的备用钥匙。')
      }
      break

    case 'corridor_mud':
      if (G.clues.includes('clue_footprints')) {
        toast('紫罗兰花泥鞋印已被详细拓印归档。')
        break
      }
      if (G.attrs.ins >= 3) {
        checkFX('ins', 3)
        addClue('clue_footprints')
        toast('搜获物证：沾有温室紫罗兰泥的男士皮靴鞋印！')
      } else {
        failFX('ins', 3, '地毯拐角处有些许深色泥土，但光线太暗难以辨别成分。')
      }
      break

    case 'piano':
      toast('盲女塞西莉亚经常在这里演奏。黑白琴键泛着柔和的光泽。')
      break
  }
}

export function getObjectives(G: GameState): ObjectivesResult {
  const hasFlag = (k: string): boolean => !!G.flags[k]
  if (!hasFlag('caseStarted')) {
    return { notStartedText: '与见习巡士托马斯对话了解案情', list: [] }
  }
  const o = []
  o.push({ t: '勘查二楼男爵书房密室现场', d: hasFlag('seenBody') })
  o.push({ t: `收集案件物证（${ G.clues.length }/${ CLUE_TOTAL }）`, d: G.clues.length >= CLUE_TOTAL })
  o.push({ t: '走访庄园全部嫌疑人与证人', d: Object.keys(G.talked).filter(k => k !== 'thomas').length >= 5 })
  o.push({ t: '在案情分析板完成密室证据链推演', d: hasFlag('deductionCorrect') })
  o.push({ t: '在玄关大厅进行最终裁决', d: !!G.verdict })
  return { list: o }
}

const mmBase = document.createElement('canvas')
mmBase.width = 176
mmBase.height = 132
;(() => {
  const c = mmBase.getContext('2d')
  if (!c) return
  const sx = (x: number): number => ((x + 42) / 84) * 176
  const sy = (z: number): number => ((z + 42) / 84) * 132
  c.fillStyle = '#101318'
  c.fillRect(0, 0, 176, 132)

  c.fillStyle = '#222834'
  c.fillRect(sx(-10), sy(-14), sx(8) - sx(-10), sy(16) - sy(-14))

  c.fillStyle = '#342a38'
  c.fillRect(sx(-5.5), sy(-12), sx(2) - sx(-5.5), sy(-6) - sy(-12))

  const B: Array<[[number, number], [number, number], string]> = [
    [[-26, -18], [-12, -4], '#45384e'],
    [[-26, 4], [-12, 18], '#263a2c'],
    [[12, 4], [26, 18], '#3d2e28'],
    [[12, -18], [26, -4], '#28363a'],
  ]
  B.forEach(b => {
    c.fillStyle = b[2]
    c.fillRect(sx(b[0][0]), sy(b[0][1]), sx(b[1][0]) - sx(b[0][0]), sy(b[1][1]) - sy(b[0][1]))
  })

  c.strokeStyle = '#4a5468'
  c.strokeRect(sx(-38), sy(-38), sx(38) - sx(-38), sy(38) - sy(-38))
})()

export function drawMinimap(mmc: CanvasRenderingContext2D, player: THREE.Group): void {
  mmc.drawImage(mmBase, 0, 0)
  const sx = (x: number): number => ((x + 42) / 84) * 176
  const sy = (z: number): number => ((z + 42) / 84) * 132
  const p = performance.now() / 400

  for (const k in NPCS) {
    mmc.fillStyle = 'rgba(212, 175, 55, 0.25)'
    mmc.beginPath()
    mmc.arc(sx(NPCS[k].pos[0]), sy(NPCS[k].pos[1]), 4.0, 0, 7)
    mmc.fill()
    mmc.fillStyle = '#d4af37'
    mmc.beginPath()
    mmc.arc(sx(NPCS[k].pos[0]), sy(NPCS[k].pos[1]), 2.2, 0, 7)
    mmc.fill()
  }

  const wave = 3.5 + Math.sin(p) * 1.5
  mmc.strokeStyle = 'rgba(210, 80, 80, 0.5)'
  mmc.lineWidth = 1
  mmc.beginPath()
  mmc.arc(sx(-19.0), sy(-11), wave + 2, 0, 7)
  mmc.stroke()

  mmc.fillStyle = '#e85c5c'
  mmc.beginPath()
  mmc.arc(sx(-19.0), sy(-11), 2.5, 0, 7)
  mmc.fill()
}
