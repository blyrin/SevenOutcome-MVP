import * as THREE from 'three'
import {
  addLabel, blockRect, box, buildingShell, canvasTex, fabricTex, makeChar, mat, scene, stool, table, tagInteractive,
  wallPlasterTex, wallRects, woodTex,
} from '../../world'
import { dist2, rand } from '../../utils'
import { G, toast } from '../../state'
import { sfx } from '../../audio'
import { openCaseModal, refreshObjectives, switchToCase } from '../../ui'
import { getManifest, nextCaseId } from '../../cases/caseManager'
import { getDailyDef, isDailyAccepted, isDailyDone, notifyDailyFlag, openQuestBoard } from './daily'
import type {
  FlagChangeContext, FlagValue, GameState, InteractContext, NpcConfig, ObjectivesResult, WorldContext,
} from '../../types'

export const NPCS: Record<string, NpcConfig> = {
  evelyn: { n: '助手 伊芙', pos: [5.2, -5.4], coat: 0x3d5a52, hat: false, hair: 0x2c2018 },
  tim: { n: '报童 蒂姆', pos: [-3.6, 3.2], coat: 0x5a4a34, hat: 0x46392a },
}

export const ZONES = [
  { id: 'hub_hall', n: '前厅', x: [-10, 10], z: [2, 7] },
  { id: 'hub_office', n: '办公区', x: [0, 10], z: [-7, 2] },
  { id: 'hub_corner', n: '档案角', x: [-10, 0], z: [-7, 2] },
]

export function zoneAt(x: number, z: number): { id: string; n: string } | null {
  for (const zn of ZONES) {
    if (x >= zn.x[0] && x <= zn.x[1] && z >= zn.z[0] && z <= zn.z[1]) {
      return zn
    }
  }
  return null
}

export function getHeightAt(): number {
  return 0
}

export function acceptCase(id: string): void {
  const m = getManifest(id)
  if (!m) {
    return
  }
  G.assignment = id
  toast(`已接取委托「${ m.title }」· 准备好后从大门出发`)
  sfx('pickup')
  refreshObjectives()
  autoSaveSafe()
}

export function departNow(): void {
  const id = G.assignment
  if (!id || !getManifest(id)) {
    toast('尚未接取任何委托。先和伊芙谈谈吧。')
    return
  }
  setTimeout(() => switchToCase(id), 60)
}

function autoSaveSafe(): void {
  void import('../../ui').then(m => m.autoSave())
}

function doDaily(qid: string, ctx: InteractContext, text: string, check?: { attr: 'ins' | 'kno'; dc: number }): void {
  const def = getDailyDef(qid)
  if (isDailyDone(qid) || !isDailyAccepted(qid)) {
    ctx.flavor('hub_' + qid + '_flavor', def ? def.desc : text)
    return
  }
  if (check) {
    if (G.attrs[check.attr] < check.dc) {
      ctx.failFX(check.attr, check.dc, '这次没弄明白，过会再试一次吧')
      return
    }
    ctx.checkFX(check.attr, check.dc)
  }
  ctx.flavor('hub_' + qid + '_flavor', text)
  ctx.setFlag(getDailyDef(qid)!.flag)
}

export function onInteract(id: string, ctx: InteractContext): void {
  switch (id) {
    case 'archive':
      ctx.toast('翻开档案柜，调出案件卷宗。')
      openCaseModal()
      break
    case 'questboard':
      openQuestBoard()
      break
    case 'frontdoor':
      if (G.assignment && getManifest(G.assignment)) {
        ctx.toast('整理好行装，推门出发。')
        departNow()
      } else {
        ctx.toast('大门外是雾杉镇的夜色。先接一份委托再出发吧。')
      }
      break
    case 'teapot':
      doDaily('dq_tea', ctx, '炉上的水正好烧开，茶香很快漫开了整间事务所。')
      break
    case 'gazette':
      doDaily('dq_gazette', ctx, '你用红笔在晨报上圈出了几条与旧案有关的消息。', { attr: 'ins', dc: 3 })
      break
    case 'gramophone':
      doDaily('dq_gramophone', ctx, '上紧发条，换好唱针，留声机又能放出沙沙的爵士乐了。')
      break
    case 'plant':
      doDaily('dq_plant', ctx, '你给窗台的蕨类浇了水，叶子上滚落了几颗水珠。')
      break
    case 'evidencebox':
      doDaily('dq_evidence', ctx, '证物逐一清点完毕，封条编号与台账完全吻合。', { attr: 'kno', dc: 3 })
      break
    case 'bookshelf':
      ctx.flavor('hub_bookshelf', '法医学、毒物学、镇志……书脊被翻得起了毛边。')
      break
    case 'clock':
      ctx.flavor('hub_clock', '挂钟指向凌晨两点。侦探的时区和别人不太一样。')
      break
    case 'sofa':
      ctx.flavor('hub_sofa', '沙发上还留着上一位委托人焦躁搓出的褶皱。')
      break
    case 'evedesk':
      ctx.flavor('hub_evedesk', '伊芙的桌面一如既往地整齐：委托登记簿、镇区地图、半杯凉掉的茶。')
      break
  }
}

export function onFlagChange(k: string, _v: FlagValue, _ctx: FlagChangeContext): void {
  notifyDailyFlag(k)
}

export function getObjectives(G: GameState): ObjectivesResult {
  const o: Array<{ t: string; d: boolean }> = []
  if (G.assignment) {
    const m = getManifest(G.assignment)
    o.push({ t: `出发调查「${ m ? m.title : G.assignment }」（从大门离开）`, d: false })
  } else {
    const next = nextCaseId()
    o.push({
      t: next ? `与伊芙接取委托「${ getManifest(next)?.title || next }」` : '事务所暂时没有新委托，可自由调查',
      d: false,
    })
  }
  const total = G.daily ? G.daily.offered.length : 0
  const done = G.daily ? G.daily.done.length : 0
  if (total > 0) {
    o.push({ t: `完成每日委托（${ done }/${ total }）`, d: done >= total })
  }
  return { list: o }
}

export function setupMap(worldCtx: WorldContext): void {
  const floorTex = canvasTex(512, 512, (x, w, h) => {
    x.fillStyle = '#4a3626'
    x.fillRect(0, 0, w, h)
    for (let i = 0; i < 10; i++) {
      const y = i * (h / 10)
      x.fillStyle = i % 2 ? 'rgba(30, 20, 12, 0.35)' : 'rgba(90, 66, 42, 0.3)'
      x.fillRect(0, y, w, h / 10)
      x.fillStyle = 'rgba(14, 9, 5, 0.5)'
      x.fillRect(0, y, w, 2)
    }
    for (let i = 0; i < 300; i++) {
      x.fillStyle = 'rgba(0, 0, 0, 0.14)'
      x.fillRect(rand(0, w), rand(0, h), rand(6, 26), 1)
    }
  })
  floorTex.repeat.set(4, 3)

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(20, 14), new THREE.MeshStandardMaterial({
    map: floorTex,
    roughness: 0.78,
    metalness: 0.06,
  }))
  floor.rotation.x = -Math.PI / 2
  floor.receiveShadow = true
  scene.add(floor)

  const carpet = new THREE.Mesh(new THREE.CircleGeometry(3.4, 40), mat(0x5a2e30, {
    map: fabricTex,
    roughness: 0.95,
  }))
  carpet.rotation.x = -Math.PI / 2
  carpet.position.set(0, 0.015, 1.5)
  carpet.receiveShadow = true
  scene.add(carpet)

  wallRects(buildingShell(-10, -7, 10, 7, 3.1, 0x453a30, { side: 'S', a: -1.3, b: 1.3 }))
  blockRect(-10.4, 7.5, 10.4, 12.5)

  const door = new THREE.Mesh(new THREE.BoxGeometry(2.5, 2.6, 0.14), mat(0x2e2118, { map: woodTex, roughness: 0.8 }))
  door.position.set(0, 1.3, 7.02)
  door.castShadow = true
  scene.add(door)
  const doorKnob = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8),
    mat(0xd4af37, { metalness: 0.85, roughness: 0.3 }))
  doorKnob.position.set(0.9, 1.25, 7.12)
  scene.add(doorKnob)
  const sign = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.5, 0.08), mat(0x241a12, { map: woodTex }))
  sign.position.set(0, 3.35, 7.14)
  scene.add(sign)
  const signText = canvasTex(256, 64, (x, w, h) => {
    x.fillStyle = '#241a12'
    x.fillRect(0, 0, w, h)
    x.fillStyle = '#d9b45a'
    x.font = 'bold 34px serif'
    x.textAlign = 'center'
    x.textBaseline = 'middle'
    x.fillText('雾杉侦探事务所', w / 2, h / 2 + 2)
  })
  const signFace = new THREE.Mesh(new THREE.PlaneGeometry(1.86, 0.46), new THREE.MeshBasicMaterial({ map: signText }))
  signFace.position.set(0, 3.35, 7.19)
  scene.add(signFace)
  tagInteractive(door, 'frontdoor', '事务所大门', 'system')
  blockRect(-1.5, 6.7, 1.5, 7.6)

  const step = box(3.4, 0.18, 1.6, 0x2b2f36, 0, 0.09, 7.9, false)
  step.receiveShadow = true

  const rugTex = canvasTex(128, 128, (x, w, h) => {
    x.fillStyle = '#4e2628'
    x.fillRect(0, 0, w, h)
    x.strokeStyle = 'rgba(217, 180, 90, 0.4)'
    x.lineWidth = 3
    x.strokeRect(8, 8, w - 16, h - 16)
    x.strokeRect(18, 18, w - 36, h - 36)
  })
  const doorMat = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 1.3), new THREE.MeshStandardMaterial({
    map: rugTex, roughness: 0.95,
  }))
  doorMat.rotation.x = -Math.PI / 2
  doorMat.position.set(0, 0.02, 5.9)
  scene.add(doorMat)

  const windowM = new THREE.MeshStandardMaterial({
    color: 0x1a2436,
    emissive: 0x24344e,
    emissiveIntensity: 0.9,
    roughness: 0.3,
    metalness: 0.2,
  })
  for (const wx of [-5.5, 3.5]) {
    const win = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 1.35), windowM)
    win.position.set(wx, 1.75, -6.93)
    win.rotation.y = Math.PI
    scene.add(win)
    const frame = new THREE.Mesh(new THREE.BoxGeometry(1.9, 1.55, 0.06), mat(0x2a2018, { map: woodTex }))
    frame.position.set(wx, 1.75, -6.96)
    scene.add(frame)
  }

  const shelfMat = mat(0x33261a, { map: woodTex })
  const bookColors = [0x6e2b2b, 0x2b4a6e, 0x4a6e2b, 0x6e5a2b, 0x50304a]
  const shelf = new THREE.Group()
  const shelfBody = new THREE.Mesh(new THREE.BoxGeometry(3.6, 2.5, 0.5), shelfMat)
  shelfBody.position.y = 1.25
  shelfBody.castShadow = true
  shelf.add(shelfBody)
  for (let row = 0; row < 4; row++) {
    const ledge = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.06, 0.44), mat(0x241a10, { map: woodTex }))
    ledge.position.set(0, 0.55 + row * 0.55, 0.04)
    shelf.add(ledge)
    let bx = -1.68
    while (bx < 1.6) {
      const bw = rand(0.1, 0.2)
      if (rand(0, 1) > 0.22) {
        const bk = new THREE.Mesh(new THREE.BoxGeometry(bw, rand(0.32, 0.44), 0.3),
          mat(bookColors[Math.floor(rand(0, bookColors.length))]))
        bk.position.set(bx + bw / 2, 0.58 + row * 0.55, 0.08)
        shelf.add(bk)
      }
      bx += bw + 0.02
    }
  }
  shelf.position.set(-6, 0, -6.55)
  scene.add(shelf)
  blockRect(-7.9, -6.9, -4.1, -6.2)
  tagInteractive(shelf, 'bookshelf', '书架', 'prop')
  addLabel(() => shelf.position.clone().add(new THREE.Vector3(0, 2.9, 0)),
    '<span class="dot" style="background:#9aa4b4"></span>书架', '',
    () => dist2(worldCtx.player.position.x, worldCtx.player.position.z, -6, -6.55) < 13)

  const archive = new THREE.Group()
  for (let i = 0; i < 2; i++) {
    const cab = new THREE.Mesh(new THREE.BoxGeometry(1.15, 2.1, 0.85),
      mat(0x3a3f46, { map: wallPlasterTex, roughness: 0.7, metalness: 0.25 }))
    cab.position.set(i * 1.2, 1.05, 0)
    cab.castShadow = true
    archive.add(cab)
    for (let row = 0; row < 4; row++) {
      const handle = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.045, 0.05),
        mat(0xb4bcc8, { metalness: 0.8, roughness: 0.3 }))
      handle.position.set(i * 1.2, 0.45 + row * 0.45, 0.45)
      archive.add(handle)
    }
  }
  archive.position.set(-8.6, 0, -2.6)
  scene.add(archive)
  blockRect(-9.5, -3.6, -6.8, -1.6)
  tagInteractive(archive, 'archive', '档案柜', 'system')
  addLabel(() => archive.position.clone().add(new THREE.Vector3(0.6, 2.5, 0)),
    '<span class="dot" style="background:#7fd0c4"></span>案件档案柜', '',
    () => dist2(worldCtx.player.position.x, worldCtx.player.position.z, -8.6, -2.6) < 13)

  const board = new THREE.Group()
  const boardBack = new THREE.Mesh(new THREE.BoxGeometry(2.6, 1.6, 0.1), mat(0x2c2118, { map: woodTex }))
  boardBack.position.y = 1.85
  board.add(boardBack)
  const boardCork = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.4, 0.05), mat(0x8a6a44, { roughness: 0.95 }))
  boardCork.position.set(0, 1.85, 0.06)
  board.add(boardCork)
  for (let i = 0; i < 5; i++) {
    const note = new THREE.Mesh(new THREE.PlaneGeometry(rand(0.28, 0.4), rand(0.3, 0.42)),
      mat(i % 2 ? 0xd8cba8 : 0xc4b48c, { roughness: 0.95 }))
    note.position.set(rand(-0.9, 0.9), rand(1.4, 2.2), 0.1)
    note.rotation.z = rand(-0.2, 0.2)
    board.add(note)
    const pin = new THREE.Mesh(new THREE.SphereGeometry(0.02, 6, 6), mat(i % 2 ? 0xc43c3c : 0x3c6ec4))
    pin.position.set(note.position.x, note.position.y + 0.18, 0.11)
    board.add(pin)
  }
  board.position.set(2.5, 0, -6.8)
  scene.add(board)
  tagInteractive(board, 'questboard', '每日委托板', 'system')
  addLabel(() => board.position.clone().add(new THREE.Vector3(0, 2.9, 0.2)),
    '<span class="dot" style="background:#d9a441"></span>每日委托板', '',
    () => dist2(worldCtx.player.position.x, worldCtx.player.position.z, 2.5, -6.8) < 13)

  table(5.2, -4.2)
  const papers = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.06, 0.36), mat(0xdcd6ca, {
    map: canvasTex(64, 64, (x, w, h) => {
      x.fillStyle = '#dcd6ca'
      x.fillRect(0, 0, w, h)
      x.strokeStyle = 'rgba(60, 60, 60, 0.5)'
      for (let i = 1; i < 6; i++) {
        x.beginPath()
        x.moveTo(6, i * 10)
        x.lineTo(w - 6, i * 10)
        x.stroke()
      }
    }),
  }))
  papers.position.set(5.0, 0.9, -4.3)
  papers.rotation.y = 0.3
  scene.add(papers)
  const mapRoll = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.9, 8), mat(0xb8a888))
  mapRoll.rotation.z = Math.PI / 2
  mapRoll.position.set(5.7, 0.92, -4.0)
  scene.add(mapRoll)
  const lampBase = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.12, 0.06, 8), mat(0x2c2620, { metalness: 0.6 }))
  lampBase.position.set(4.4, 0.9, -4.0)
  scene.add(lampBase)
  const lampStem = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.35, 6), mat(0x2c2620, { metalness: 0.6 }))
  lampStem.position.set(4.4, 1.08, -4.0)
  scene.add(lampStem)
  const lampShade = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.18, 8, 1, true), new THREE.MeshStandardMaterial({
    color: 0xd8b46a, emissive: 0xffa03c, emissiveIntensity: 1.4, roughness: 0.4, side: THREE.DoubleSide,
  }))
  lampShade.position.set(4.4, 1.28, -4.0)
  scene.add(lampShade)
  const deskLampLight = new THREE.PointLight(0xffc98a, 0.9, 6, 2)
  deskLampLight.position.set(4.4, 1.3, -4.0)
  scene.add(deskLampLight)
  tagInteractive(papers, 'evedesk', '伊芙的办公桌', 'prop')
  addLabel(() => papers.position.clone().add(new THREE.Vector3(0, 1.2, 0)),
    '<span class="dot" style="background:#9aa4b4"></span>办公桌', '',
    () => dist2(worldCtx.player.position.x, worldCtx.player.position.z, 5.2, -4.2) < 10)

  const teapot = new THREE.Group()
  const teaTable = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.08, 0.8), mat(0x3a2c1f, { map: woodTex }))
  teaTable.position.y = 0.85
  teapot.add(teaTable)
  const ttLegs: Array<[number, number]> = [[-0.48, -0.32], [0.48, -0.32], [-0.48, 0.32], [0.48, 0.32]]
  ttLegs.forEach(([lx, lz]) => {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.85, 0.08), mat(0x2c2118, { map: woodTex }))
    leg.position.set(lx, 0.42, lz)
    teapot.add(leg)
  })
  const kettle = new THREE.Mesh(new THREE.SphereGeometry(0.17, 10, 8),
    mat(0x48505c, { metalness: 0.75, roughness: 0.35 }))
  kettle.position.set(0, 1.06, 0)
  teapot.add(kettle)
  const kettleSpout = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.04, 0.18, 6),
    mat(0x48505c, { metalness: 0.75 }))
  kettleSpout.position.set(0.19, 1.08, 0)
  kettleSpout.rotation.z = -Math.PI / 3
  teapot.add(kettleSpout)
  const stove = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.24, 0.2, 10), mat(0x22262c, { metalness: 0.5 }))
  stove.position.set(0, 0.98, 0)
  teapot.add(stove)
  teapot.position.set(8.4, 0, -5.6)
  scene.add(teapot)
  blockRect(7.8, -6.1, 9.0, -5.1)
  tagInteractive(teapot, 'teapot', '茶炉', 'prop')
  addLabel(() => teapot.position.clone().add(new THREE.Vector3(0, 1.7, 0)),
    '<span class="dot" style="background:#9aa4b4"></span>茶炉', '',
    () => dist2(worldCtx.player.position.x, worldCtx.player.position.z, 8.4, -5.6) < 11)

  const gazTable = new THREE.Group()
  const top = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.06, 16), mat(0x3a2c1f, { map: woodTex }))
  top.position.y = 0.78
  gazTable.add(top)
  const gzLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.09, 0.78, 8), mat(0x2c2118, { map: woodTex }))
  gzLeg.position.y = 0.39
  gazTable.add(gzLeg)
  const gazette = new THREE.Mesh(new THREE.PlaneGeometry(0.55, 0.4), mat(0xd8d2c4, {
    map: canvasTex(128, 96, (x, w, h) => {
      x.fillStyle = '#d8d2c4'
      x.fillRect(0, 0, w, h)
      x.fillStyle = '#2a2a2a'
      x.font = 'bold 20px serif'
      x.textAlign = 'center'
      x.fillText('雾杉镇公报', w / 2, 24)
      x.strokeStyle = 'rgba(40, 40, 40, 0.55)'
      for (let i = 0; i < 6; i++) {
        x.beginPath()
        x.moveTo(10, 38 + i * 9)
        x.lineTo(w - 10, 38 + i * 9)
        x.stroke()
      }
    }),
  }))
  gazette.rotation.x = -Math.PI / 2
  gazette.position.y = 0.815
  gazTable.add(gazette)
  gazTable.position.set(-2.6, 0, 4.6)
  scene.add(gazTable)
  blockRect(-3.2, 4.0, -2.0, 5.2)
  tagInteractive(gazette, 'gazette', '《雾杉镇公报》', 'prop')
  addLabel(() => gazTable.position.clone().add(new THREE.Vector3(0, 1.5, 0)),
    '<span class="dot" style="background:#9aa4b4"></span>晨报', '',
    () => dist2(worldCtx.player.position.x, worldCtx.player.position.z, -2.6, 4.6) < 11)
  stool(-1.6, 3.8)

  const gramophone = new THREE.Group()
  const gTable = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.08, 0.9), mat(0x3a2c1f, { map: woodTex }))
  gTable.position.y = 0.85
  gramophone.add(gTable)
  const gtLegs: Array<[number, number]> = [[-0.38, -0.38], [0.38, -0.38], [-0.38, 0.38], [0.38, 0.38]]
  gtLegs.forEach(([lx, lz]) => {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.85, 0.07), mat(0x2c2118, { map: woodTex }))
    leg.position.set(lx, 0.42, lz)
    gramophone.add(leg)
  })
  const gBox = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.2, 0.34), mat(0x4a3020, { map: woodTex }))
  gBox.position.set(-0.1, 1.0, 0)
  gramophone.add(gBox)
  const horn = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.42, 12, 1, true),
    mat(0xb08d57, { metalness: 0.8, roughness: 0.3, side: THREE.DoubleSide }))
  horn.position.set(0.14, 1.3, 0)
  horn.rotation.z = 0.9
  gramophone.add(horn)
  gramophone.position.set(-7.9, 0, 3.6)
  scene.add(gramophone)
  blockRect(-8.4, 3.1, -7.4, 4.1)
  tagInteractive(gramophone, 'gramophone', '老留声机', 'prop')
  addLabel(() => gramophone.position.clone().add(new THREE.Vector3(0, 1.8, 0)),
    '<span class="dot" style="background:#9aa4b4"></span>留声机', '',
    () => dist2(worldCtx.player.position.x, worldCtx.player.position.z, -7.9, 3.6) < 11)

  const plant = new THREE.Group()
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.14, 0.26, 10), mat(0x7a4a30, { roughness: 0.9 }))
  pot.position.y = 0.13
  plant.add(pot)
  for (let i = 0; i < 6; i++) {
    const frond = new THREE.Mesh(new THREE.ConeGeometry(0.045, rand(0.4, 0.6), 5), mat(0x2d4a30, { roughness: 0.85 }))
    const a = (i / 6) * Math.PI * 2
    frond.position.set(Math.cos(a) * 0.08, 0.42, Math.sin(a) * 0.08)
    frond.rotation.set(Math.sin(a) * 0.5, 0, -Math.cos(a) * 0.5)
    plant.add(frond)
  }
  const plantStand = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.26, 0.5, 8), mat(0x2c2118, { map: woodTex }))
  plantStand.position.y = 0.25
  plant.add(plantStand)
  plant.position.set(8.9, 0, 2.4)
  scene.add(plant)
  blockRect(8.6, 2.1, 9.2, 2.7)
  tagInteractive(plant, 'plant', '窗台盆栽', 'prop')
  addLabel(() => plant.position.clone().add(new THREE.Vector3(0, 1.3, 0)),
    '<span class="dot" style="background:#9aa4b4"></span>盆栽', '',
    () => dist2(worldCtx.player.position.x, worldCtx.player.position.z, 8.9, 2.4) < 10)

  const evidence = new THREE.Group()
  const evBox = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.55, 0.6), mat(0x4a3a2a, { map: woodTex, roughness: 0.85 }))
  evBox.position.y = 0.28
  evBox.castShadow = true
  evidence.add(evBox)
  const evLid = new THREE.Mesh(new THREE.BoxGeometry(0.94, 0.08, 0.64), mat(0x36281b, { map: woodTex }))
  evLid.position.y = 0.58
  evidence.add(evLid)
  const evSeal = new THREE.Mesh(new THREE.BoxGeometry(0.94, 0.1, 0.1), mat(0xc4a45a, { roughness: 0.6 }))
  evSeal.position.set(0, 0.58, 0)
  evidence.add(evSeal)
  evidence.position.set(3.2, 0, 3.6)
  scene.add(evidence)
  blockRect(2.7, 3.2, 3.7, 4.0)
  tagInteractive(evidence, 'evidencebox', '证物箱', 'item')
  addLabel(() => evidence.position.clone().add(new THREE.Vector3(0, 1.1, 0)),
    '<span class="dot" style="background:#7fd0c4"></span>证物箱', '',
    () => dist2(worldCtx.player.position.x, worldCtx.player.position.z, 3.2, 3.6) < 10)

  const sofa = new THREE.Group()
  const seat = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.42, 0.85),
    mat(0x4a3a44, { map: fabricTex, roughness: 0.95 }))
  seat.position.y = 0.32
  sofa.add(seat)
  const back = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.6, 0.22), mat(0x4a3a44, { map: fabricTex, roughness: 0.95 }))
  back.position.set(0, 0.72, -0.32)
  sofa.add(back)
  const armL = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.55, 0.85),
    mat(0x3e3040, { map: fabricTex, roughness: 0.95 }))
  armL.position.set(-0.94, 0.52, 0)
  sofa.add(armL)
  const armR = armL.clone()
  armR.position.x = 0.94
  sofa.add(armR)
  const cushion = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.12, 0.7), mat(0x5a4650, { map: fabricTex }))
  cushion.position.set(-0.4, 0.58, 0.02)
  cushion.rotation.y = 0.1
  sofa.add(cushion)
  sofa.position.set(-4.6, 0, 1.2)
  sofa.rotation.y = 0.3
  scene.add(sofa)
  blockRect(-5.8, 0.4, -3.4, 2.0)
  tagInteractive(sofa, 'sofa', '旧沙发', 'prop')

  const clock = new THREE.Group()
  const clockBody = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.08, 20), mat(0x2c2118, { map: woodTex }))
  clockBody.rotation.x = Math.PI / 2
  clock.add(clockBody)
  const clockFace = new THREE.Mesh(new THREE.CircleGeometry(0.24, 20), mat(0xe4dcc8))
  clockFace.position.z = 0.05
  clock.add(clockFace)
  const handH = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.13, 0.01), mat(0x1a1a1a))
  handH.position.set(0.03, 0.06, 0.06)
  clock.add(handH)
  const handM = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.19, 0.01), mat(0x1a1a1a))
  handM.position.set(-0.04, 0.04, 0.06)
  handM.rotation.z = 1.1
  clock.add(handM)
  clock.position.set(-1.6, 2.3, -6.9)
  scene.add(clock)
  tagInteractive(clock, 'clock', '老挂钟', 'prop')

  const chandelier = new THREE.Group()
  const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.9, 6), mat(0x1a1a1a))
  cord.position.y = 2.65
  chandelier.add(cord)
  const shadeM = new THREE.MeshStandardMaterial({
    color: 0xd8b46a, emissive: 0xffa03c, emissiveIntensity: 1.8, roughness: 0.4, side: THREE.DoubleSide,
  })
  const shade = new THREE.Mesh(new THREE.ConeGeometry(0.45, 0.35, 10, 1, true), shadeM)
  shade.position.y = 2.1
  chandelier.add(shade)
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), new THREE.MeshStandardMaterial({
    color: 0xfff2c8, emissive: 0xffd88a, emissiveIntensity: 2.6,
  }))
  bulb.position.y = 2.02
  chandelier.add(bulb)
  chandelier.position.set(0, 0, 0.5)
  scene.add(chandelier)
  chandelierLight = new THREE.PointLight(0xffc98a, 1.35, 17, 2)
  chandelierLight.position.set(0, 2.0, 0.5)
  scene.add(chandelierLight)

  fireplaceLight = new THREE.PointLight(0xff9a4a, 0.7, 9, 2)
  fireplaceLight.position.set(-1.6, 1.1, -6.2)
  scene.add(fireplaceLight)

  for (const k in NPCS) {
    const d = NPCS[k]
    const m = makeChar(d.coat, d.hat, { hat: d.hat !== false, hair: d.hair, role: k })
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
      () => dist2(worldCtx.player.position.x, worldCtx.player.position.z, d.pos[0], d.pos[1]) < 15,
    )
    blockRect(d.pos[0] - 0.45, d.pos[1] - 0.45, d.pos[0] + 0.45, d.pos[1] + 0.45)
  }

}

let fireplaceLight: THREE.PointLight | null = null
let chandelierLight: THREE.PointLight | null = null

export function update(_dt: number, now: number): void {
  if (fireplaceLight) {
    fireplaceLight.intensity = 0.6 + Math.sin(now / 130) * 0.07 + Math.sin(now / 47) * 0.05
  }
  if (chandelierLight) {
    chandelierLight.intensity = 1.3 + Math.sin(now / 900) * 0.06
  }
}
