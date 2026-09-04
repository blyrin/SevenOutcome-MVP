import type { GameState, InteractContext, NpcConfig, ObjectivesResult, SnowParticle, WorldContext } from '../../types'
import * as THREE from 'three'
import {
  addLabel, blockRect, box, canvasTex, chalkOutline, lamp, makeChar, mat, scene, solidHouse, table, tagInteractive,
} from '../../world'
import { rand } from '../../utils'
import { CLUE_TOTAL } from './clues'

export let snowGeo: THREE.BufferGeometry | null = null
export let snowCount = 400
export let snowVel: SnowParticle[] = []
export let studyLight: THREE.PointLight | null = null
export let fireLight: THREE.PointLight | null = null
export let clinicLight: THREE.PointLight | null = null

export const NPCS: Record<string, NpcConfig> = {
  thomas: { n: '巡士 托马斯', pos: [-2.0, 11.5], coat: 0x2e4a6e, hat: 0x1e2c40, badge: true },
  morris: { n: '老管家 莫里斯', pos: [-2.0, 1.8], coat: 0x22242a, hat: false, hair: 0x8c8f96 },
  eleanor: { n: '艾莲娜 夫人', pos: [-18.5, 9.5], coat: 0x482d3e, hat: false, hair: 0x1a1210 },
  julian: { n: '长子 朱利安', pos: [18.5, 10.5], coat: 0x73362a, hat: 0x421e18 },
  vincent: { n: '凡森特 医生', pos: [18.5, -11.0], coat: 0x2c433b, hat: 0x1a2622, glasses: true },
  cecilia: { n: '琴师 塞西莉亚', pos: [-2.0, -8.5], coat: 0x8a7d65, hat: false, hair: 0xd4af37 },
}

export const ZONES = [
  { id: 'foyer', n: '庄园玄关门廊', x: [-8, 8], z: [6, 16] },
  { id: 'study', n: '男爵书房 · 案发现场', x: [-27, -11], z: [-19, -3] },
  { id: 'greenhouse', n: '温室玻璃花房', x: [-27, -11], z: [3, 17] },
  { id: 'corridor', n: '中央大厅与琴廊', x: [-10, 6], z: [-12, 5] },
  { id: 'guestroom', n: '东翼客房 · 软禁室', x: [11, 27], z: [3, 17] },
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

export function setupMap(worldCtx: WorldContext): void {
  const { player } = worldCtx

  const groundTex = canvasTex(512, 512, (x, w, h) => {
    x.fillStyle = '#181b22'
    x.fillRect(0, 0, w, h)
    x.strokeStyle = '#252a36'
    x.lineWidth = 2
    for (let i = 0; i <= w; i += 32) {
      x.beginPath()
      x.moveTo(i, 0)
      x.lineTo(i, h)
      x.stroke()
      x.beginPath()
      x.moveTo(0, i)
      x.lineTo(w, i)
      x.stroke()
    }
    for (let i = 0; i < 400; i++) {
      x.fillStyle = Math.random() < 0.6 ? 'rgba(210, 225, 240, 0.08)' : 'rgba(10, 14, 20, 0.4)'
      x.fillRect(rand(0, w), rand(0, h), rand(2, 6), rand(2, 6))
    }
  })

  const floorGeo = new THREE.PlaneGeometry(84, 84)
  const floorMat = mat(0x282e3b, { map: groundTex, roughness: 0.85, metalness: 0.15 })
  const floorMesh = new THREE.Mesh(floorGeo, floorMat)
  floorMesh.rotation.x = -Math.PI / 2
  floorMesh.receiveShadow = true
  scene.add(floorMesh)

  const gothicPillar = (px: number, pz: number): void => {
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.45, 5, 8), mat(0x3a404d, { roughness: 0.7 }))
    col.position.set(px, 2.5, pz)
    col.castShadow = true
    scene.add(col)
    blockRect(px - 0.4, pz - 0.4, px + 0.4, pz + 0.4)
  }

  gothicPillar(-6, 8)
  gothicPillar(6, 8)
  gothicPillar(-6, 2)
  gothicPillar(6, 2)
  gothicPillar(-6, -4)
  gothicPillar(6, -4)

  solidHouse(-19, -11, 14, 12, 5.2, 0x2b2e38, 0x1a1c22, { frontDoor: true, doorSide: 'right' })
  solidHouse(-19, 10, 14, 12, 4.8, 0x223528, 0x142018, { frontDoor: true, doorSide: 'right' })
  solidHouse(19, 10, 14, 12, 5.0, 0x362c28, 0x221a16, { frontDoor: true, doorSide: 'left' })
  solidHouse(19, -11, 14, 12, 5.0, 0x283236, 0x162024, { frontDoor: true, doorSide: 'left' })

  blockRect(-42, -42, 42, -26)
  blockRect(-42, 26, 42, 42)
  blockRect(-42, -42, -28, 42)
  blockRect(28, -42, 42, 42)

  table(-19.5, -11)
  const deskMesh = box(2.2, 0.88, 1.1, 0x3d2c1e, -19.5, 0.44, -11)
  tagInteractive(deskMesh, 'body', '男爵书桌与遗体', 'clue')

  const chalkM = chalkOutline(-19.2, -12.4, 0.4)
  chalkM.rotation.y = 0.35
  scene.add(chalkM)

  const cupM = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.08, 0.16, 8), mat(0xe8ecef, { roughness: 0.3 }))
  cupM.rotation.z = Math.PI / 2
  cupM.position.set(-18.2, 0.1, -11.6)
  scene.add(cupM)
  tagInteractive(cupM, 'teacup', '打翻的骨瓷茶杯')

  const candleM = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.09, 0.35, 8), mat(0xd6ccb6, { roughness: 0.6 }))
  candleM.position.set(-20.2, 1.05, -11.2)
  scene.add(candleM)
  tagInteractive(candleM, 'candle', '未燃尽的沉香蜡烛')

  const fireplaceM = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.2, 0.8), mat(0x1a1512, { roughness: 0.9 }))
  fireplaceM.position.set(-19.5, 1.1, -16.6)
  scene.add(fireplaceM)
  blockRect(-19.5 - 1.2, -16.6 - 0.4, -19.5 + 1.2, -16.6 + 0.4)
  tagInteractive(fireplaceM, 'fireplace', '大理石壁炉与灰烬')

  const clockM = new THREE.Mesh(new THREE.BoxGeometry(1.2, 2.4, 0.4), mat(0xb89748, { roughness: 0.4, metalness: 0.7 }))
  clockM.position.set(-14.2, 2.6, -11)
  scene.add(clockM)
  tagInteractive(clockM, 'clock', '双面重锤机械钟')

  table(-19, 11)
  const gBench = box(2.0, 0.85, 1.0, 0x2e3b2e, -19, 0.42, 11)
  tagInteractive(gBench, 'greenhouse_desk', '温室草药操作台')

  const clinicCab = new THREE.Mesh(new THREE.BoxGeometry(2.0, 2.8, 0.8), mat(0x2d3a33, { roughness: 0.6 }))
  clinicCab.position.set(19.5, 1.4, -16.5)
  scene.add(clinicCab)
  blockRect(19.5 - 1.0, -16.5 - 0.4, 19.5 + 1.0, -16.5 + 0.4)
  tagInteractive(clinicCab, 'clinic_cabinet', '凡森特医生的药柜')

  const mudM = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.2), mat(0x3d3042, { roughness: 0.9 }))
  mudM.rotation.x = -Math.PI / 2
  mudM.position.set(-8.5, 0.05, 0.5)
  scene.add(mudM)
  tagInteractive(mudM, 'corridor_mud', '走廊角落的花泥鞋印')

  const pianoM = new THREE.Mesh(new THREE.BoxGeometry(2.6, 1.3, 1.6), mat(0x181412, { roughness: 0.2, metalness: 0.3 }))
  pianoM.position.set(-2.0, 0.65, -10.5)
  scene.add(pianoM)
  blockRect(-2.0 - 1.3, -10.5 - 0.8, -2.0 + 1.3, -10.5 + 0.8)
  tagInteractive(pianoM, 'piano', '羽管键琴')

  const boardM = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.4, 0.1), mat(0x5a3f28, { roughness: 0.8 }))
  boardM.position.set(4.5, 1.8, 4.5)
  scene.add(boardM)
  const standM = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.8, 8), mat(0x3a2516))
  standM.position.set(4.5, 0.9, 4.5)
  scene.add(standM)
  blockRect(4.5 - 0.5, 4.5 - 0.5, 4.5 + 0.5, 4.5 + 0.5)
  tagInteractive(boardM, 'board', '案情分析立架')

  lamp(-2, 7)
  lamp(-2, -2)
  lamp(-14, 10)
  lamp(14, 10)
  lamp(14, -11)

  studyLight = new THREE.PointLight(0xff9944, 2.2, 16)
  studyLight.position.set(-19, 3.5, -11)
  scene.add(studyLight)

  fireLight = new THREE.PointLight(0xff5511, 2.5, 12)
  fireLight.position.set(-19.5, 1.2, -15.8)
  scene.add(fireLight)

  clinicLight = new THREE.PointLight(0x66ccaa, 1.6, 14)
  clinicLight.position.set(19, 3.2, -11)
  scene.add(clinicLight)

  for (const k in NPCS) {
    const d = NPCS[k]
    const m = makeChar(d.coat, d.coat, { hat: d.hat !== false, hair: d.hair, role: k })
    m.position.set(d.pos[0], 0, d.pos[1])
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

  addLabel(deskMesh, '男爵遗体与书桌', 1.8, '现场中心')
  addLabel(cupM, '打翻的茶杯', 0.8, '毒物')
  addLabel(candleM, '沉香蜡烛', 0.9, '物证')
  addLabel(fireplaceM, '壁炉残烬', 1.6, '遗嘱')
  addLabel(clockM, '机械壁钟', 2.2, '机关')
  addLabel(boardM, '案情分析立架 [B]', 1.8, '系统')
}

export function update(dt: number, now: number): void {
  if (fireLight) {
    fireLight.intensity = 2.2 + Math.sin(now * 8) * 0.4 + Math.sin(now * 15) * 0.2
  }
  if (studyLight) {
    studyLight.intensity = 2.0 + Math.sin(now * 3) * 0.15
  }

  if (snowGeo) {
    const pos = snowGeo.attributes.position.array as Float32Array
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
    snowGeo.attributes.position.needsUpdate = true
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

  const B: Array<[[number, number], [number, number], string]> = [
    [[-26, -17], [-12, -5], '#383242'],
    [[-26, 4], [-12, 16], '#263a2c'],
    [[12, 4], [26, 16], '#3d2e28'],
    [[12, -17], [26, -5], '#28363a'],
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
  mmc.arc(sx(-19.5), sy(-11), wave + 2, 0, 7)
  mmc.stroke()

  mmc.fillStyle = '#e85c5c'
  mmc.beginPath()
  mmc.arc(sx(-19.5), sy(-11), 2.5, 0, 7)
  mmc.fill()
}
