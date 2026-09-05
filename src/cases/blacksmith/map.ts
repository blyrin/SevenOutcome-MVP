import * as THREE from 'three'
import {
  addLabel, barrel, blocked, blockRect, box, buildingShell, canvasTex, chalkOutline, crate, GW, ITAB, lamp,
  lampPositions, leatherTex, makeChar, mat, scene, solidHouse, stool, table, tagInteractive, tree, wallPlasterTex,
  wallRects, woodTex,
} from '../../world'
import { dist2, rand } from '../../utils'
import { CLUE_TOTAL } from './clues'
import { banner, toast } from '../../state'
import { sfx } from '../../audio'
import type {
  ClueAddedContext, FlagChangeContext, FlagValue, FountainDropParticle, GameState, InteractContext, MistParticle,
  MoteParticle, NpcConfig, ObjectivesResult, SmokeParticle, SparkParticle, SplashParticle, WorldContext,
} from '../../types'

export let embers: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshStandardMaterial> | null = null
export let forgeLight: THREE.PointLight | null = null
export let hammerM: THREE.Group | null = null
export let hamRing: THREE.Mesh | null = null
export let letterM: THREE.Mesh | null = null
export let apronM: THREE.Mesh | null = null
export let walletM: THREE.Group | null = null
export let gateMesh: THREE.Group | null = null
export let fwater: THREE.Mesh<THREE.CircleGeometry, THREE.MeshStandardMaterial> | null = null

export const NPCS: Record<string, NpcConfig> = {
  sheriff: { n: '警长 雷诺', pos: [-2.5, 5.2], coat: 0x2e4a6e, hat: 0x1e2c40, badge: true },
  coroner: { n: '验尸官 贝尔', pos: [-15.8, -14.2], coat: 0x565e66, hat: 0x3c434b },
  martha: { n: '玛莎 · 贝克', pos: [-20.5, 11.6], coat: 0x3e3549, hat: false, hair: 0x241d18 },
  luke: { n: '学徒 卢克', pos: [-22.0, -12.4], coat: 0x6e5638, hat: 0x4e3c26 },
  pete: { n: '醉汉 皮特', pos: [13.8, -10.4], coat: 0x4a5a3a, hat: 0x39462c },
  barrow: { n: '债主 巴罗', pos: [19.2, 12.0], coat: 0x5e2e3a, hat: 0x3c1e26 },
  greta: { n: '街坊 格蕾塔', pos: [3.2, -2.8], coat: 0x8a5e38, hat: 0x6e4a2c },
}

export const ZONES = [
  { id: 'plaza', n: '集市广场', x: [-8, 8], z: [-8, 8] },
  { id: 'smith', n: '铁匠铺 · 案发现场', x: [-27, -13], z: [-21, -9] },
  { id: 'tavern', n: '「野猪头」酒馆', x: [9, 25], z: [-19, -7] },
  { id: 'alley', n: '暗巷', x: [25, 32], z: [-17, 15] },
  { id: 'home', n: '玛莎的家', x: [-25, -15], z: [7, 17] },
  { id: 'pawn', n: '巴罗当铺', x: [13, 25], z: [7, 17] },
]

export function zoneAt(x: number, z: number): { id: string; n: string; x: number[]; z: number[] } | null {
  for (const zn of ZONES) {
    if (x >= zn.x[0] && x <= zn.x[1] && z >= zn.z[0] && z <= zn.z[1]) {
      return zn
    }
  }
  return null
}

export function openGate(G?: GameState, setFlagFn?: (k: string, v?: FlagValue) => void): void {
  if (G && G.flags && G.flags.gateOpen) {
    return
  }
  if (setFlagFn) {
    setFlagFn('gateOpen')
  } else if (G && G.flags) {
    G.flags.gateOpen = 1
  }
  if (gateMesh && gateMesh.parent) {
    scene.remove(gateMesh)
  }
}

let mistGeo: THREE.BufferGeometry | null = null
let mistCount = 140
let mistVel: MistParticle[] = []
let sparkGeo: THREE.BufferGeometry | null = null
let sparkCount = 60
let sparkData: SparkParticle[] = []
let smokeGeo: THREE.BufferGeometry | null = null
let smokeCount = 18
let smokeData: SmokeParticle[] = []
let rainGeo: THREE.BufferGeometry | null = null
let rainCount = 320
let rainVel: number[] = []
let splashGeo: THREE.BufferGeometry | null = null
let splashCount = 36
let splashData: SplashParticle[] = []
let fDropGeo: THREE.BufferGeometry | null = null
let fDropletCount = 42
let fDropVel: FountainDropParticle[] = []
let moteGeo: THREE.BufferGeometry | null = null
let moteCount = 36
let moteData: MoteParticle[] = []

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

export function setupMap(worldCtx: WorldContext): void {
  const { player } = worldCtx

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
        x.fillStyle = `rgb(${ tone - 4 }, ${ tone }, ${ toneB })`
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
  })
  groundTex.repeat.set(16, 11)

  const groundRoughTex = canvasTex(256, 256, (x, w, h) => {
    x.fillStyle = '#999999'
    x.fillRect(0, 0, w, h)
    for (let i = 0; i < 600; i++) {
      const px = rand(0, w), py = rand(0, h), r = rand(2, 7)
      const gr = x.createRadialGradient(px, py, 0, px, py, r)
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
        x.fillStyle = `rgb(${ t - 2 }, ${ t }, ${ t + 4 })`
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

  function road(x: number, z: number, w: number, d: number): void {
    const tex = roadTex.clone()
    tex.repeat.set(w / 3.2, d / 3.2)
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshStandardMaterial({
      map: tex,
      roughness: 0.72,
      metalness: 0.12,
    }))
    m.rotation.x = -Math.PI / 2
    m.position.set(x, .012, z)
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
  plaza.position.y = .020
  plaza.receiveShadow = true
  scene.add(plaza)

  wallRects(buildingShell(-26, -20, -14, -10, 3.2, 0x4a3f38, { side: 'S', a: -22.0, b: -18.0 }))
  box(11.5, .12, 9.5, 0x2b2622, -20, .06, -15, false)

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

  embers = new THREE.Mesh(new THREE.PlaneGeometry(1.3, .75), new THREE.MeshStandardMaterial({
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

  forgeLight = new THREE.PointLight(0xff7733, 1.15, 10.5, 2)
  forgeLight.position.set(-24.6, 2.2, -18.1)
  scene.add(forgeLight)

  tagInteractive(anvil, 'anvil', '铁砧', 'env')
  tagInteractive(embers, 'forge', '锻炉余烬', 'env')
  chalkOutline(-19.5, -15.5, 0.128)
  blockRect(-22.5 - .65, -14 - .35, -22.5 + .65, -14 + .35, 0)
  blockRect(-24.6 - 1.15, -18.6 - .95, -24.6 + 1.15, -18.6 + .95, 0)

  hammerM = new THREE.Group()
  const hammerHandle = new THREE.Mesh(new THREE.CylinderGeometry(.035, .04, .68, 8), mat(0x56422d, { map: woodTex }))
  hammerHandle.rotation.x = Math.PI / 2
  hammerHandle.castShadow = true
  hammerM.add(hammerHandle)

  const hammerGrip = new THREE.Mesh(new THREE.CylinderGeometry(.045, .045, .28, 8), mat(0x281e16))
  hammerGrip.rotation.x = Math.PI / 2
  hammerGrip.position.z = -.18
  hammerM.add(hammerGrip)

  const hammerHead = new THREE.Mesh(new THREE.BoxGeometry(.18, .18, .26),
    mat(0x424852, { roughness: 0.35, metalness: 0.8 }))
  hammerHead.position.z = .32
  hammerHead.castShadow = true
  hammerM.add(hammerHead)

  const hammerPeen = new THREE.Mesh(new THREE.ConeGeometry(.09, .14, 4),
    mat(0x3a404a, { roughness: 0.4, metalness: 0.75 }))
  hammerPeen.rotation.x = -Math.PI / 2
  hammerPeen.position.z = .48
  hammerM.add(hammerPeen)

  const hammerBlood = new THREE.Mesh(new THREE.BoxGeometry(.19, .19, .16), mat(0x6e1b1b, { roughness: 0.3 }))
  hammerBlood.position.z = .26
  hammerM.add(hammerBlood)

  hammerM.position.set(-18.8, 0.18, -13.4)
  hammerM.rotation.y = .8
  scene.add(hammerM)
  tagInteractive(hammerM, 'hammer', '染血的铁锤', 'clue')

  box(1.8, .9, .9, 0x4a3a2c, -15.6, .45, -18.6)
  blockRect(-15.6 - .9, -18.6 - .45, -15.6 + .9, -18.6 + .45, 0)

  const letterTex = canvasTex(256, 256, (x, w, h) => {
    x.fillStyle = '#f4ecd8'
    x.fillRect(0, 0, w, h)
    for (let i = 0; i < 300; i++) {
      x.fillStyle = 'rgba(140, 110, 70, 0.05)'
      x.fillRect(rand(0, w), rand(0, h), rand(2, 6), rand(2, 6))
    }
    x.strokeStyle = 'rgba(180, 140, 90, 0.35)'
    x.lineWidth = 1
    x.strokeRect(12, 12, w - 24, h - 24)
    x.fillStyle = '#2c2218'
    for (let i = 0; i < 10; i++) {
      const lw = i === 9 ? 70 : rand(140, 200)
      x.fillRect(28, 38 + i * 18, lw, 2.5)
    }
    x.fillStyle = '#8a1c1c'
    x.beginPath()
    x.arc(195, 205, 18, 0, Math.PI * 2)
    x.fill()
    x.fillStyle = '#5c1010'
    x.beginPath()
    x.arc(195, 205, 12, 0, Math.PI * 2)
    x.fill()
  })

  letterM = new THREE.Mesh(new THREE.PlaneGeometry(.42, .32), new THREE.MeshStandardMaterial({
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

  const apronTex = canvasTex(256, 256, (x, w, h) => {
    x.fillStyle = '#6a554a'
    x.fillRect(0, 0, w, h)
    for (let i = 0; i < 400; i++) {
      x.fillStyle = Math.random() < 0.5 ? 'rgba(0, 0, 0, 0.15)' : 'rgba(255, 255, 255, 0.08)'
      x.fillRect(rand(0, w), rand(0, h), 2, 2)
    }
    for (let i = 0; i < 20; i++) {
      x.fillStyle = 'rgba(20, 15, 10, 0.25)'
      x.beginPath()
      x.arc(rand(0, w), rand(0, h), rand(6, 22), 0, Math.PI * 2)
      x.fill()
    }
    for (let i = 0; i < 18; i++) {
      const px = rand(40, 220), py = rand(40, 220), r = rand(4, 16)
      x.fillStyle = 'rgba(74, 14, 18, 0.85)'
      x.beginPath()
      x.arc(px, py, r, 0, Math.PI * 2)
      x.fill()
    }
  })
  apronM = new THREE.Mesh(new THREE.PlaneGeometry(.58, .7),
    mat(0x6e4e42, { map: apronTex, roughness: 0.88, side: THREE.DoubleSide }))
  apronM.rotation.x = -Math.PI / 2
  apronM.rotation.z = 1
  apronM.position.set(-24.6, 0.13, -11.4)
  scene.add(apronM)
  tagInteractive(apronM, 'barrels', '成堆的木桶', 'env')

  box(1.9, .55, 1.2, 0x3a3128, -15.4, .28, -11.4)
  blockRect(-15.4 - .95, -11.4 - .6, -15.4 + .95, -11.4 + .6, 0)
  const mbox = box(.5, .35, .4, 0x5a4a2e, -15.2, .28, -11.1)
  tagInteractive(mbox, 'moneybox', '床底的钱匣', 'env')

  wallRects(buildingShell(-24, 8, -16, 16, 3, 0x44404e, { side: 'N', a: -21.5, b: -18.5 }))
  box(7.5, .12, 7.5, 0x2b2730, -20, .06, 12, false)
  table(-18.2, 13.6)
  const dresser = box(1.2, 1.3, .7, 0x4e3c2e, -22.6, .65, 13.8)
  box(1.3, .1, .8, 0x5e4a38, -22.6, 1.34, 13.8)
  blockRect(-22.6 - .6, 13.8 - .35, -22.6 + .6, 13.8 + .35, 0)
  tagInteractive(dresser, 'dresser', '梳妆台', 'env')

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

  wallRects(buildingShell(14, 8, 24, 16, 3.2, 0x3e4448, { side: 'N', a: 17.0, b: 21.0 }))
  box(9.5, .12, 7.5, 0x272c30, 19, .06, 12, false)
  table(21.5, 12)
  box(1.6, 1.9, .5, 0x30363c, 15, 1, 14.6)
  blockRect(15 - .8, 14.6 - .25, 15 + .8, 14.6 + .25, 0)

  blockRect(25.4, -16, 26, -2, 0)
  blockRect(25.4, 2, 26, 14, 0)
  blockRect(30.5, -16, 31.2, -2, 0)
  blockRect(30.5, 2, 31.2, 14, 0)
  crate(29.5, 6.5)
  crate(26.8, -6, .8)
  barrel(27.2, -9, .8)

  walletM = new THREE.Group()
  const walletBody = new THREE.Mesh(new THREE.BoxGeometry(.32, .08, .22),
    mat(0x52321c, { map: leatherTex, roughness: 0.65 }))
  walletBody.castShadow = true
  walletM.add(walletBody)
  const walletFlap = new THREE.Mesh(new THREE.BoxGeometry(.325, .03, .12),
    mat(0x3e2212, { map: leatherTex, roughness: 0.65 }))
  walletFlap.position.set(0, .045, .05)
  walletM.add(walletFlap)
  const walletClasp = new THREE.Mesh(new THREE.CylinderGeometry(.02, .02, .015, 8),
    mat(0xd4af37, { metalness: 0.9, roughness: 0.2 }))
  walletClasp.position.set(0, .055, .10)
  walletM.add(walletClasp)
  walletM.position.set(28.6, .06, 5.2)
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
  const posterTex = canvasTex(128, 128, (x, w, h) => {
    x.fillStyle = '#f0e6d2'
    x.fillRect(0, 0, w, h)
    x.fillStyle = '#221c16'
    x.fillRect(16, 14, w - 32, 6)
    x.fillStyle = '#44382c'
    x.fillRect(28, 28, w - 56, 36)
    for (let i = 0; i < 4; i++) {
      x.fillRect(20, 74 + i * 10, w - 40, 2)
    }
    x.fillStyle = '#8a2020'
    x.fillRect(w / 2 - 18, 110, 36, 4)
  })
  for (let i = 0; i < 4; i++) {
    const p = new THREE.Mesh(new THREE.PlaneGeometry(.4, .5),
      mat(i % 2 ? 0xe0d4b8 : 0xd8dce2, { map: posterTex, roughness: 0.85 }))
    p.position.set(-1.1 + i * .45, 1.55 + rand(-.2, .2), 7.26)
    p.rotation.z = rand(-.2, .2)
    boardProp.add(p)
  }
  tagInteractive(cork, 'board', '调查告示板', 'board')

  const fountainGroup = new THREE.Group()
  const fbase = new THREE.Mesh(new THREE.CylinderGeometry(2.1, 2.35, .75, 24),
    mat(0x363f4a, { roughness: 0.65, metalness: 0.18 }))
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

  fwater = new THREE.Mesh(new THREE.CircleGeometry(1.9, 32), new THREE.MeshStandardMaterial({
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

  const fpil = new THREE.Mesh(new THREE.CylinderGeometry(.22, .34, 1.6, 12),
    mat(0x404854, { roughness: 0.6, metalness: 0.2 }))
  fpil.position.y = 1.35
  fpil.castShadow = true
  fountainGroup.add(fpil)

  const fBowl = new THREE.Mesh(new THREE.CylinderGeometry(.68, .42, .24, 16),
    mat(0x353d48, { roughness: 0.6, metalness: 0.2 }))
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

  for (const k in NPCS) {
    const d = NPCS[k]
    const m = makeChar(d.coat, d.hat, { hat: d.hat !== false, hair: d.hair, badge: d.badge, role: k })
    m.position.set(d.pos[0], 0, d.pos[1])
    d.mesh = m
    const ring = new THREE.Mesh(new THREE.RingGeometry(.5, .62, 28),
      new THREE.MeshBasicMaterial({ color: 0xd9a441, transparent: true, opacity: 0, side: THREE.DoubleSide }))
    ring.rotation.x = -Math.PI / 2
    ring.position.y = .045
    m.add(ring)
    d.ring = ring
    tagInteractive(m, k, d.n, 'npc')

    addLabel(
      () => m.position.clone().add(new THREE.Vector3(0, 2.15, 0)),
      `<span class="dot" style="background:#d9a441"></span>${ d.n }`,
      '',
      () => dist2(player.position.x, player.position.z, d.pos[0], d.pos[1]) < 16,
    )
  }

  const mistTex = canvasTex(128, 128, (x, w, h) => {
    const g = x.createRadialGradient(64, 64, 4, 64, 64, 64)
    g.addColorStop(0, 'rgba(190, 215, 245, 0.95)')
    g.addColorStop(0.3, 'rgba(150, 180, 220, 0.45)')
    g.addColorStop(0.65, 'rgba(110, 140, 185, 0.12)')
    g.addColorStop(1, 'rgba(70, 100, 150, 0)')
    x.fillStyle = g
    x.fillRect(0, 0, w, h)
  })

  mistGeo = new THREE.BufferGeometry()
  const mistPos = new Float32Array(mistCount * 3)
  mistVel = []
  for (let i = 0; i < mistCount; i++) {
    mistPos[i * 3] = rand(-42, 42)
    mistPos[i * 3 + 1] = rand(0.3, 1.8)
    mistPos[i * 3 + 2] = rand(-28, 28)
    mistVel.push({
      vx: rand(-0.15, -0.4),
      vz: rand(-0.06, 0.06),
      baseY: mistPos[i * 3 + 1],
      phase: rand(0, Math.PI * 2),
    })
  }
  mistGeo.setAttribute('position', new THREE.BufferAttribute(mistPos, 3))
  const mistMat = new THREE.PointsMaterial({
    map: mistTex,
    size: 5.4,
    transparent: true,
    opacity: 0.18,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  })
  scene.add(new THREE.Points(mistGeo, mistMat))

  const sparkTex = canvasTex(64, 64, (x, w, h) => {
    const g = x.createRadialGradient(32, 32, 2, 32, 32, 32)
    g.addColorStop(0, '#ffffff')
    g.addColorStop(0.2, '#ffe066')
    g.addColorStop(0.55, '#ff5500')
    g.addColorStop(1, 'rgba(255, 60, 0, 0)')
    x.fillStyle = g
    x.fillRect(0, 0, w, h)
  })

  sparkGeo = new THREE.BufferGeometry()
  const sparkPos = new Float32Array(sparkCount * 3)
  const sparkColors = new Float32Array(sparkCount * 3)
  sparkData = []
  for (let i = 0; i < sparkCount; i++) {
    sparkPos[i * 3] = -24.6 + rand(-0.4, 0.4)
    sparkPos[i * 3 + 1] = 1.4 + rand(0, 0.5)
    sparkPos[i * 3 + 2] = -18.15 + rand(-0.3, 0.3)
    sparkColors[i * 3] = 1.0
    sparkColors[i * 3 + 1] = 0.6
    sparkColors[i * 3 + 2] = 0.2
    sparkData.push({
      vx: rand(-0.18, 0.18),
      vy: rand(0.7, 1.5),
      vz: rand(-0.18, 0.18),
      life: rand(0.8, 2.2),
      age: rand(0, 1.5),
      seed: rand(0, 100),
    })
  }
  sparkGeo.setAttribute('position', new THREE.BufferAttribute(sparkPos, 3))
  sparkGeo.setAttribute('color', new THREE.BufferAttribute(sparkColors, 3))
  const sparkMat = new THREE.PointsMaterial({
    map: sparkTex,
    size: 0.42,
    transparent: true,
    vertexColors: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  })
  scene.add(new THREE.Points(sparkGeo, sparkMat))

  smokeGeo = new THREE.BufferGeometry()
  const smokePos = new Float32Array(smokeCount * 3)
  smokeData = []
  for (let i = 0; i < smokeCount; i++) {
    smokePos[i * 3] = -24.6 + rand(-0.25, 0.25)
    smokePos[i * 3 + 1] = 1.6 + rand(0, 2.2)
    smokePos[i * 3 + 2] = -18.15 + rand(-0.2, 0.2)
    smokeData.push({
      vy: rand(0.35, 0.75),
      life: rand(1.8, 3.2),
      age: rand(0, 2.5),
      seed: rand(0, 100),
    })
  }
  smokeGeo.setAttribute('position', new THREE.BufferAttribute(smokePos, 3))
  const smokeMat = new THREE.PointsMaterial({
    map: mistTex,
    size: 2.8,
    transparent: true,
    opacity: 0.16,
    depthWrite: false,
    color: 0x3a3028,
  })
  scene.add(new THREE.Points(smokeGeo, smokeMat))

  const rainStreakTex = canvasTex(32, 128, (x, w, h) => {
    const g = x.createLinearGradient(0, 0, 0, h)
    g.addColorStop(0, 'rgba(180, 210, 240, 0)')
    g.addColorStop(0.65, 'rgba(200, 225, 255, 0.45)')
    g.addColorStop(1, 'rgba(230, 245, 255, 0.95)')
    x.fillStyle = g
    x.fillRect(14, 0, 4, h)
  })

  rainGeo = new THREE.BufferGeometry()
  const rainPos = new Float32Array(rainCount * 3)
  rainVel = []
  for (let i = 0; i < rainCount; i++) {
    rainPos[i * 3] = rand(-40, 40)
    rainPos[i * 3 + 1] = rand(0, 24)
    rainPos[i * 3 + 2] = rand(-28, 28)
    rainVel.push(rand(18, 28))
  }
  rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPos, 3))
  const rainMat = new THREE.PointsMaterial({
    map: rainStreakTex,
    size: 0.9,
    transparent: true,
    opacity: 0.55,
    depthWrite: false,
  })
  scene.add(new THREE.Points(rainGeo, rainMat))

  const splashTex = canvasTex(64, 64, (x, w, h) => {
    x.strokeStyle = 'rgba(200, 225, 255, 0.65)'
    x.lineWidth = 3
    x.beginPath()
    x.arc(32, 32, 20, 0, Math.PI * 2)
    x.stroke()
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2
      x.fillStyle = 'rgba(230, 245, 255, 0.85)'
      x.beginPath()
      x.arc(32 + Math.cos(a) * 24, 32 + Math.sin(a) * 24, 2, 0, Math.PI * 2)
      x.fill()
    }
  })

  splashGeo = new THREE.BufferGeometry()
  const splashPos = new Float32Array(splashCount * 3)
  splashData = []
  for (let i = 0; i < splashCount; i++) {
    splashPos[i * 3] = rand(-38, 38)
    splashPos[i * 3 + 1] = 0.04
    splashPos[i * 3 + 2] = rand(-26, 26)
    splashData.push({
      life: rand(0.2, 0.45),
      age: rand(0, 0.3),
    })
  }
  splashGeo.setAttribute('position', new THREE.BufferAttribute(splashPos, 3))
  const splashMat = new THREE.PointsMaterial({
    map: splashTex,
    size: 0.6,
    transparent: true,
    opacity: 0.45,
    depthWrite: false,
  })
  scene.add(new THREE.Points(splashGeo, splashMat))

  fDropGeo = new THREE.BufferGeometry()
  const fDropPos = new Float32Array(fDropletCount * 3)
  fDropVel = []
  for (let i = 0; i < fDropletCount; i++) {
    fDropPos[i * 3] = 0
    fDropPos[i * 3 + 1] = 2.05
    fDropPos[i * 3 + 2] = 0
    const ang = (i / fDropletCount) * Math.PI * 2
    const spd = rand(0.4, 0.95)
    fDropVel.push({
      vx: Math.cos(ang) * spd,
      vy: rand(1.4, 2.2),
      vz: Math.sin(ang) * spd,
      age: rand(0, 1.2),
    })
  }
  fDropGeo.setAttribute('position', new THREE.BufferAttribute(fDropPos, 3))
  const fDropMat = new THREE.PointsMaterial({
    color: 0x90d5f8,
    size: 0.18,
    transparent: true,
    opacity: 0.75,
    depthWrite: false,
  })
  scene.add(new THREE.Points(fDropGeo, fDropMat))

  moteGeo = new THREE.BufferGeometry()
  const motePos = new Float32Array(moteCount * 3)
  moteData = []
  for (let i = 0; i < moteCount; i++) {
    const lamp = lampPositions[i % lampPositions.length] || [0, 0]
    const rad = rand(0.3, 1.4)
    const ang = rand(0, Math.PI * 2)
    motePos[i * 3] = lamp[0] + Math.cos(ang) * rad
    motePos[i * 3 + 1] = 3.52 + rand(-0.4, 0.4)
    motePos[i * 3 + 2] = lamp[1] + Math.sin(ang) * rad
    moteData.push({
      lx: lamp[0],
      lz: lamp[1],
      rad,
      ang,
      spd: rand(-0.8, 0.8),
      bob: rand(0, 10),
    })
  }
  moteGeo.setAttribute('position', new THREE.BufferAttribute(motePos, 3))
  const moteMat = new THREE.PointsMaterial({
    map: sparkTex,
    size: 0.22,
    transparent: true,
    opacity: 0.55,
    depthWrite: false,
    color: 0xffd990,
  })
  scene.add(new THREE.Points(moteGeo, moteMat))
}

export function updateAtmosphere(dt: number, now: number): void {
  if (!mistGeo || !sparkGeo || !smokeGeo || !rainGeo || !splashGeo || !fDropGeo || !moteGeo) {
    return
  }
  const mPosAttr = mistGeo.getAttribute('position') as THREE.BufferAttribute
  const mPos = mPosAttr.array as Float32Array
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
  mPosAttr.needsUpdate = true

  const sPosAttr = sparkGeo.getAttribute('position') as THREE.BufferAttribute
  const sColAttr = sparkGeo.getAttribute('color') as THREE.BufferAttribute
  const sPos = sPosAttr.array as Float32Array
  const sCol = sColAttr.array as Float32Array
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
  sPosAttr.needsUpdate = true
  sColAttr.needsUpdate = true

  const smPosAttr = smokeGeo.getAttribute('position') as THREE.BufferAttribute
  const smPos = smPosAttr.array as Float32Array
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
  smPosAttr.needsUpdate = true

  const rPosAttr = rainGeo.getAttribute('position') as THREE.BufferAttribute
  const rPos = rPosAttr.array as Float32Array
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
  rPosAttr.needsUpdate = true

  const spPosAttr = splashGeo.getAttribute('position') as THREE.BufferAttribute
  const spPos = spPosAttr.array as Float32Array
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
  spPosAttr.needsUpdate = true

  const fdPosAttr = fDropGeo.getAttribute('position') as THREE.BufferAttribute
  const fdPos = fdPosAttr.array as Float32Array
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
  fdPosAttr.needsUpdate = true

  const mtPosAttr = moteGeo.getAttribute('position') as THREE.BufferAttribute
  const mtPos = mtPosAttr.array as Float32Array
  for (let i = 0; i < moteCount; i++) {
    const idx = i * 3
    const d = moteData[i]
    d.ang += d.spd * dt
    mtPos[idx] = d.lx + Math.cos(d.ang) * d.rad
    mtPos[idx + 1] = 3.52 + Math.sin(now / 500 + d.bob) * 0.35
    mtPos[idx + 2] = d.lz + Math.sin(d.ang) * d.rad
  }
  mtPosAttr.needsUpdate = true
}

export function update(dt: number, now: number): void {
  const pu = (Math.sin(now / 300) + 1) / 2
  if (embers) {
    embers.material.color.setHSL(0.05, 0.95, 0.42 + pu * 0.14)
    if (embers.material.emissiveIntensity !== undefined) {
      embers.material.emissiveIntensity = 2.0 + pu * 0.9
    }
  }
  if (forgeLight) {
    forgeLight.intensity = 0.7 + pu * 0.4
  }
  if (fwater) {
    fwater.material.color.setHSL(0.55, 0.4, 0.26 + Math.sin(now / 700) * 0.03)
    if (fwater.material.map) {
      fwater.material.map.offset.x = (now * 0.00003) % 1
      fwater.material.map.offset.y = (now * 0.00002) % 1
    }
  }
  updateAtmosphere(dt, now)
}

export function applyWorldFromFlags(G: GameState): void {
  if (!G) {
    return
  }
  const hasFlag = (k: string): boolean => !!G.flags[k]
  if (hasFlag('clue_hammer')) {
    if (ITAB.hammer) ITAB.hammer.hidden = true
    if (hammerM) hammerM.visible = false
  }
  if (hasFlag('gateOpen')) {
    if (gateMesh && gateMesh.parent) scene.remove(gateMesh)
  }
  if (G.clues.includes('clue_letter')) {
    if (ITAB.letter) ITAB.letter.hidden = true
    if (letterM) letterM.visible = false
  }
  if (G.clues.includes('clue_apron')) {
    if (ITAB.barrels) ITAB.barrels.hidden = true
    if (apronM) apronM.visible = true
  } else {
    if (apronM) apronM.visible = false
  }
  if (G.inventory.includes('wallet') || hasFlag('walletReturned')) {
    if (ITAB.wallet) ITAB.wallet.hidden = true
    if (walletM) walletM.visible = false
  }
}

export function onFlagChange(k: string, v: FlagValue, ctx: FlagChangeContext): void {
  const { G, setFlag, refreshObjectives } = ctx
  if (k === 'walletReturned') {
    banner('🦋 因 果 回 响', '善举会被记住——皮特想起了那个夜晚，暗巷的栅栏门也为你打开。', 4200)
    openGate(G, setFlag)
  }
  if (k === 'deductionCorrect') {
    banner('真 相 拼 合', '推论成立。去向这个镇子宣布你的裁决吧。', 3800)
    sfx('success')
    if (refreshObjectives) refreshObjectives()
  }
}

export function onClueAdded(clueId: string, ctx: ClueAddedContext): void {
  const { G, setFlag, hasFlag } = ctx
  if (G.clues.length === 3 && !hasFlag('boardHint')) {
    setFlag('boardHint')
    setTimeout(() => toast('线索渐多——按 B 打开告示板，把它们拼成真相'), 1500)
  }
}

export function onInteract(id: string, ctx: InteractContext): void {
  const { G, addClue, addItem, setFlag, hasFlag, checkFX, failFX, flavor, toast, sfx } = ctx
  switch (id) {
    case 'hammer':
      if (!G.clues.includes('clue_hammer')) {
        addClue('clue_hammer')
        setFlag('hasHammer')
      } else {
        toast('铁锤已作为证物记录。')
      }
      break
    case 'letter':
      if (!G.clues.includes('clue_letter')) {
        addClue('clue_letter')
      } else {
        toast('恐吓信已记录在案。')
      }
      break
    case 'body':
      setFlag('seenBody')
      ctx.refreshObjectives()
      flavor('body',
        '白色粉笔勾勒出汉斯倒毙的扭曲轮廓。大片暗红血泊已经凝固发黑，四周泥灰被踩得凌乱不堪——验尸官贝尔正在一旁查验致命伤痕。')
      break
    case 'anvil':
      flavor('anvil',
        '粗粝厚重的铁砧上坑洼交错。平整的台面边缘留有一道新鲜劈出的锐利擦痕——似乎是不久前猛烈器械撞击留下的。')
      break
    case 'forge':
      flavor('forge', '炉火早已熄灭冷透，余温散尽。灰白色的炉渣里斜插着半截烧焦的拨火棍，地面落满了煤屑与厚厚的灰尘。')
      break
    case 'fountain':
      flavor('fountain', '广场中央的石砌喷泉，泛着微冷的波光。池底沉着几枚被水流磨平的薄铜板——镇民们常在这里祈求安宁。')
      break
    case 'barrels':
      if (G.clues.includes('clue_apron')) {
        toast('木桶后已经没有别的了。')
        break
      }
      if (G.attrs.ins >= 3) {
        checkFX('ins', 3)
        addClue('clue_apron')
      } else {
        failFX('ins', 3, '木桶后幽暗的阴影里隐约有一块碎布……但光线太暗，你辨认不清细节。')
      }
      break
    case 'moneybox':
      if (G.clues.includes('clue_insurance')) {
        toast('钱匣已经空了。')
        break
      }
      if (!hasFlag('peteTip')) {
        toast('床下塞着个生锈的暗锁铁匣。锁孔精巧，也许镇上有人知晓汉斯藏东西的习惯。')
        break
      }
      if (G.attrs.int >= 4) {
        checkFX('int', 4)
        addClue('clue_insurance')
      } else if (G.attrs.strw >= 3) {
        checkFX('strw', 3)
        addClue('clue_insurance')
      } else {
        failFX('int', 4, '黄铜暗锁咬合紧密。在没有技巧或门道的情况下，很难强行打开。')
      }
      break
    case 'dresser':
      if (G.clues.includes('clue_diary')) {
        toast('抽屉空了。')
        break
      }
      if (hasFlag('diaryHint')) {
        addClue('clue_diary')
        toast('玛莎允许你取走了日记。')
      } else if (G.attrs.ins >= 4) {
        checkFX('ins', 4)
        addClue('clue_diary')
        toast('抽屉缝里露出一角纸页——一本日记。（未经女主人的许可）')
      } else {
        failFX('ins', 4, '梳妆台抽屉上了锁。私自翻弄不太妥当，也许该先听听女主人的心声。')
      }
      break
    case 'wallet':
      if (G.inventory.includes('wallet')) {
        toast('钱包已经在你这儿了。')
        break
      }
      addItem('wallet')
      sfx('pickup')
      toast('拾取：破旧的钱包 —— 也许是皮特丢的。')
      if (ITAB.wallet) {
        ITAB.wallet.hidden = true
        ITAB.wallet.mesh.visible = false
      }
      break
    case 'gate':
      if (hasFlag('gateOpen')) {
        toast('皮特的钥匙打开了它。暗巷如今畅通无阻。')
      } else if (hasFlag('peteTip') || G.flags.walletReturned) {
        openGate(G, setFlag)
        toast('你用老皮特的钥匙打开了栅栏门。暗巷如今畅通无阻。')
      } else {
        toast('栅栏门锈住了，挂着一把沉重的锁。要是有人知道钥匙的下落就好了……')
      }
      break
  }
}

export function getObjectives(G: GameState): ObjectivesResult {
  const hasFlag = (k: string): boolean => !!G.flags[k]
  if (!hasFlag('caseStarted')) {
    return { notStartedText: '与警长雷诺对话了解案情', list: [] }
  }
  const o = []
  o.push({ t: '勘查铁匠铺案发现场', d: hasFlag('seenBody') })
  o.push({ t: `收集线索（${ G.clues.length }/${ CLUE_TOTAL }）`, d: G.clues.length >= CLUE_TOTAL })
  o.push({ t: '走访嫌疑人与证人', d: Object.keys(G.talked).filter(k => k !== 'sheriff').length >= 6 })
  o.push({ t: '在告示板完成证据链推演', d: hasFlag('deductionCorrect') })
  o.push({ t: '提交终局裁决', d: !!G.verdict })
  return { list: o }
}


