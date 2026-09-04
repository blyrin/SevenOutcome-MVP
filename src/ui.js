import * as THREE from 'three'
import { setMusic, setVoice, sfx } from './audio.js'
import { CLUE_TOTAL, CLUES, ITEMS } from './clues.js'
import { closeModal, dlgOpen, G, hasFlag, modalOpen, openModal, toast, xpNeed } from './state.js'
import { $, ATTRS, clamp, rand } from './utils.js'
import { applyWorldFromFlags, mat, NPCS, player } from './world.js'

export function refreshHUD() {
  $('lvlbadge').textContent = 'Lv.' + G.level
  $('xpfill').style.width = clamp((G.xp / xpNeed(G.level)) * 100, 0, 100) + '%'
  const ar = $('attrRow')
  ar.innerHTML = ''
  for (const k in ATTRS) {
    ar.innerHTML += `<div class="attr" title="${ATTRS[k].d}"><span class="attr-icon">${ATTRS[k].i}</span><span class="attr-label">${ATTRS[k].n}</span><b>${G.attrs[k]}</b></div>`
  }
  $('pendPts').style.display = G.points > 0 ? 'flex' : 'none'
}

export function refreshObjectives() {
  const o = []
  o.push({ t: '勘查铁匠铺案发现场', d: hasFlag('seenBody') })
  o.push({ t: `收集线索（${G.clues.length}/${CLUE_TOTAL}）`, d: G.clues.length >= CLUE_TOTAL })
  o.push({ t: '走访嫌疑人与证人', d: Object.keys(G.talked).filter(k => k !== 'sheriff').length >= 6 })
  o.push({ t: '在告示板完成证据链推演', d: hasFlag('deductionCorrect') })
  o.push({ t: '提交终局裁决', d: !!G.verdict })
  if (!hasFlag('caseStarted')) {
    $('objList').innerHTML = '<div class="obj">与警长雷诺对话了解案情</div>'
    return
  }
  $('objList').innerHTML = o.map(x => `<div class="obj ${x.d ? 'done' : ''}">${x.t}</div>`).join('')
}

let invScene = null
let invCam = null
let invObj = null
let invRenderer = null

export function openInv() {
  if (modalOpen()) {
    return
  }
  openModal('invModal')
  renderInvGrid()
  if (!invRenderer) {
    invRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    invRenderer.setSize(300, 210)
    invRenderer.outputEncoding = THREE.sRGBEncoding
    invRenderer.toneMapping = THREE.ACESFilmicToneMapping
    $('invViewer').appendChild(invRenderer.domElement)
    invScene = new THREE.Scene()
    invCam = new THREE.PerspectiveCamera(40, 300 / 210, 0.1, 50)
    invCam.position.set(0, 1.6, 3.4)
    invCam.lookAt(0, 0.4, 0)
    invScene.add(new THREE.AmbientLight(0xffffff, 0.5))
    const dl = new THREE.DirectionalLight(0xffe0b0, 1)
    dl.position.set(3, 5, 4)
    invScene.add(dl)
    const pl = new THREE.PointLight(0x8ab0d8, 0.5)
    pl.position.set(-3, 2, -2)
    invScene.add(pl)
  }
  if (G.inventory.length) {
    selectInv(G.inventory[0])
  }
}

export function renderInvGrid() {
  const g = $('invGrid')
  g.innerHTML = ''
  G.inventory.forEach(id => {
    const it = ITEMS[id] || CLUES[id]
    const d = document.createElement('div')
    d.className = 'islot'
    d.dataset.id = id
    d.textContent = it.icon || '❔'
    d.onclick = () => selectInv(id)
    g.appendChild(d)
  })
  if (!G.inventory.length) {
    g.innerHTML = '<div class="empty-hint" style="grid-column:span 4">暂无随身物品</div>'
  }
}

function itemMesh(id) {
  const g = new THREE.Group()
  const M = mat
  if (id === 'clue_hammer') {
    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.075, 1.6, 8), M(0x5a432e))
    handle.rotation.x = Math.PI / 2
    g.add(handle)
    const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.65, 8), M(0x281d14))
    grip.rotation.x = Math.PI / 2
    grip.position.z = -0.42
    g.add(grip)
    const hd = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.38, 0.52), M(0x424954, { roughness: 0.35, metalness: 0.75 }))
    hd.position.z = 0.72
    g.add(hd)
    const peen = new THREE.Mesh(new THREE.ConeGeometry(0.19, 0.28, 4), M(0x3a404a, { roughness: 0.4, metalness: 0.7 }))
    peen.rotation.x = -Math.PI / 2
    peen.position.z = 1.05
    g.add(peen)
    const bl = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.22, 0.32), M(0x6e1b1b, { roughness: 0.3 }))
    bl.position.set(0, 0.1, 0.62)
    g.add(bl)
  }
  if (id === 'wallet') {
    const w = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.16, 0.78), M(0x563822, { roughness: 0.65 }))
    g.add(w)
    const flap = new THREE.Mesh(new THREE.BoxGeometry(1.06, 0.06, 0.36), M(0x422816, { roughness: 0.65 }))
    flap.position.set(0, 0.1, 0.22)
    g.add(flap)
    const clasp = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.04, 8), M(0xd4af37, { metalness: 0.9, roughness: 0.2 }))
    clasp.position.set(0, 0.13, 0.36)
    g.add(clasp)
    const coin = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.02, 10), M(0xb87333, { metalness: 0.85, roughness: 0.3 }))
    coin.position.set(0.24, 0.1, -0.15)
    coin.rotation.x = 0.2
    g.add(coin)
  }
  if (id === 'clue_diary') {
    const b = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.2, 1.25), M(0x4e272a, { roughness: 0.75 }))
    g.add(b)
    const pages = new THREE.Mesh(new THREE.BoxGeometry(0.86, 0.14, 1.18), M(0xede2cb, { roughness: 0.9 }))
    pages.position.set(0.02, 0, 0)
    g.add(pages)
    const spine = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 1.26, 6), M(0x381b1d))
    spine.position.set(-0.44, 0, 0)
    g.add(spine)
    const ribbon = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.02, 1.42), M(0xd4af37))
    ribbon.position.set(0.05, 0.11, 0)
    g.add(ribbon)
  }
  if (id === 'clue_letter') {
    const l = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.03, 0.82), M(0xf4ebdb, { roughness: 0.85 }))
    g.add(l)
    const fold = new THREE.Mesh(new THREE.BoxGeometry(1.16, 0.015, 0.02), M(0xded0ba))
    fold.position.set(0, 0.02, 0)
    g.add(fold)
    const wax = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.04, 12), M(0x8a1c1c, { roughness: 0.45 }))
    wax.position.set(0.28, 0.03, 0)
    g.add(wax)
  }
  if (id === 'clue_insurance') {
    const p = new THREE.Mesh(new THREE.BoxGeometry(0.98, 0.02, 1.28), M(0xf6edd8, { roughness: 0.85 }))
    g.add(p)
    const header = new THREE.Mesh(new THREE.BoxGeometry(0.98, 0.025, 0.22), M(0x2a463a))
    header.position.set(0, 0.01, -0.5)
    g.add(header)
    const seal = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.02, 10), M(0x9a2222))
    seal.position.set(0.26, 0.02, 0.45)
    g.add(seal)
  }
  if (id === 'clue_apron') {
    const a = new THREE.Mesh(new THREE.BoxGeometry(0.88, 0.03, 1.15), M(0x6e3434, { roughness: 0.9 }))
    g.add(a)
    const pocket = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.02, 0.32), M(0x5c2b2b))
    pocket.position.set(0, 0.02, 0.12)
    g.add(pocket)
    for (let i = 0; i < 6; i++) {
      const t = new THREE.Mesh(new THREE.BoxGeometry(rand(0.1, 0.22), 0.035, rand(0.1, 0.32)), M(0x3e1212, { roughness: 0.4 }))
      t.position.set(rand(-0.35, 0.35), 0.02, rand(-0.3, 0.45))
      t.rotation.y = rand(0, 3.14)
      g.add(t)
    }
  }
  return g
}

export function selectInv(id) {
  document.querySelectorAll('.islot').forEach(x => x.classList.toggle('sel', x.dataset.id === id))
  const it = ITEMS[id] || CLUES[id]
  $('invName').textContent = (it.icon || '') + ' ' + (it.name || id)
  $('invDesc').textContent = it.d || it.detail || ''
  if (invObj) {
    invScene.remove(invObj)
  }
  invObj = itemMesh(id)
  invObj.position.y = 0.4
  invScene.add(invObj)
}

export function updateInv(dt) {
  if (invObj) {
    invObj.rotation.y += dt * 0.8
  }
  if ($('invModal').classList.contains('on') && invRenderer) {
    invRenderer.render(invScene, invCam)
  }
}

export function openLevelup() {
  if (modalOpen()) {
    return
  }
  renderLu()
  openModal('levelupModal')
}

export function renderLu() {
  $('luPts').textContent = G.points
  const r = $('luRows')
  r.innerHTML = ''
  for (const k in ATTRS) {
    const a = ATTRS[k]
    const d = document.createElement('div')
    d.className = 'lurow'
    d.innerHTML = `<div>${a.i} <b style="color:#e9dfc8">${a.n}</b> <span class="lud">${a.d}</span></div><div><button data-k="${k}" data-d="-1">−</button> <b>${G.attrs[k]}</b> <button data-k="${k}" data-d="1">＋</button></div>`
    r.appendChild(d)
  }
  r.querySelectorAll('button').forEach(b => {
    b.onclick = () => {
      const k = b.dataset.k
      const d = parseInt(b.dataset.d)
      if (d > 0 && G.points > 0) {
        G.attrs[k]++
        G.points--
        sfx('click')
      }
      if (d < 0 && G.luSpent && G.luSpent > 0) {}
      if (d < 0 && b.__can) {
        G.attrs[k]--
        G.points++
      }
      renderLu()
      refreshHUD()
    }
  })
  r.querySelectorAll('button[data-d="-1"]').forEach(b => {
    b.style.opacity = '0.2'
  })
}

export function openHist() {
  if (modalOpen()) {
    return
  }
  const l = $('histList')
  l.innerHTML = G.history.length
    ? G.history.map(h => `<div><span class="hs">${h.s}：</span>${h.t}</div>`).join('')
    : '<div class="empty-hint">暂无历史对话记录</div>'
  openModal('historyModal')
}

export function togglePause() {
  if ($('pauseModal').classList.contains('on')) {
    closeModal('pauseModal')
  } else if (!modalOpen() && !dlgOpen() && G.started) {
    openModal('pauseModal')
  }
}

const mmBase = document.createElement('canvas')
mmBase.width = 176
mmBase.height = 132;
(() => {
  const c = mmBase.getContext('2d')
  const sx = x => ((x + 41) / 82) * 176
  const sy = z => ((z + 29) / 58) * 132
  c.fillStyle = '#0c1118'
  c.fillRect(0, 0, 176, 132)
  c.fillStyle = '#2a3140'
  c.fillRect(sx(-8), sy(-8), sx(8) - sx(-8), sy(8) - sy(-8))
  c.fillStyle = '#1d222b'
  c.fillRect(0, sy(-3.2), 176, sy(3.2) - sy(-3.2))
  c.fillRect(sx(-3.2), 0, sx(3.2) - sx(-3.2), 132)
  c.fillStyle = '#2b3038'
  c.fillRect(sx(25.4), sy(-16), sx(31.2) - sx(25.4), sy(14) - sy(-16))
  const B = [
    [[-26, -20], [-14, -10], '#4a3028'],
    [[-24, 8], [-16, 16], '#3a3a4a'],
    [[10, -18], [24, -8], '#4a3e2c'],
    [[14, 8], [24, 16], '#33424a'],
    [[-36.5, 7], [-29.5, 13], '#2b2b34'],
    [[-36.5, -11], [-29.5, -5], '#2b2b34'],
    [[29.5, -12], [36.5, -6], '#2b2b34'],
    [[5.5, 17.2], [12.5, 22.8], '#2b2b34'],
    [[-12.5, 18.2], [-5.5, 23.8], '#2b2b34'],
    [[27.8, 9], [34.2, 15], '#2b2b34'],
  ]
  B.forEach(b => {
    c.fillStyle = b[2]
    c.fillRect(sx(b[0][0]), sy(b[0][1]), sx(b[1][0]) - sx(b[0][0]), sy(b[1][1]) - sy(b[0][1]))
  })
  c.strokeStyle = '#3c4450'
  c.beginPath()
  c.arc(sx(0), sy(0), 6, 0, 7)
  c.stroke()
})()

export function drawMinimap() {
  const mm = $('minimap')
  const mmc = mm.getContext('2d')
  mmc.clearRect(0, 0, 176, 132)
  mmc.drawImage(mmBase, 0, 0)
  const sx = x => ((x + 41) / 82) * 176
  const sy = z => ((z + 29) / 58) * 132
  const p = performance.now() / 400

  for (const k in NPCS) {
    mmc.fillStyle = 'rgba(212, 175, 55, 0.22)'
    mmc.beginPath()
    mmc.arc(sx(NPCS[k].pos[0]), sy(NPCS[k].pos[1]), 3.8, 0, 7)
    mmc.fill()
    mmc.fillStyle = '#d4af37'
    mmc.beginPath()
    mmc.arc(sx(NPCS[k].pos[0]), sy(NPCS[k].pos[1]), 2, 0, 7)
    mmc.fill()
  }

  const wave = 3.2 + Math.sin(p) * 1.4
  mmc.strokeStyle = 'rgba(200, 72, 72, 0.45)'
  mmc.lineWidth = 1
  mmc.beginPath()
  mmc.arc(sx(-19), sy(-15), wave + 2, 0, 7)
  mmc.stroke()

  mmc.fillStyle = '#e05a5a'
  mmc.beginPath()
  mmc.arc(sx(-19), sy(-15), 2.2, 0, 7)
  mmc.fill()

  mmc.save()
  mmc.translate(sx(player.position.x), sy(player.position.z))
  mmc.rotate(Math.PI - player.rotation.y)

  const fovGrad = mmc.createRadialGradient(0, 0, 1, 0, -12, 16)
  fovGrad.addColorStop(0, 'rgba(96, 182, 168, 0.45)')
  fovGrad.addColorStop(1, 'rgba(96, 182, 168, 0)')
  mmc.fillStyle = fovGrad
  mmc.beginPath()
  mmc.moveTo(0, 0)
  mmc.arc(0, 0, 16, -Math.PI / 2 - 0.42, -Math.PI / 2 + 0.42)
  mmc.closePath()
  mmc.fill()

  mmc.fillStyle = '#fff'
  mmc.beginPath()
  mmc.moveTo(0, -4.5)
  mmc.lineTo(3, 3.5)
  mmc.lineTo(-3, 3.5)
  mmc.closePath()
  mmc.fill()
  mmc.restore()
}

export function initUIEvents() {
  $('luDone').onclick = () => {
    closeModal('levelupModal')
    refreshHUD()
  }
  $('pendPts').onclick = openLevelup

  $('btnResume').onclick = () => closeModal('pauseModal')
  $('btnRestart').onclick = () => location.reload()
  $('btnMusic').onclick = () => {
    setMusic(!G.musicOn)
    $('btnMusic').textContent = '音乐：' + (G.musicOn ? '开' : '关')
  }
  if ($('btnVoice')) {
    $('btnVoice').onclick = () => {
      setVoice(!G.voiceOn)
      $('btnVoice').textContent = '角色配音：' + (G.voiceOn ? '开' : '关')
    }
  }
  $('btnSave').onclick = () => {
    try {
      localStorage.setItem(
        'wst_save',
        JSON.stringify({
          attrs: G.attrs,
          xp: G.xp,
          level: G.level,
          points: G.points,
          checks: G.checks,
          flags: G.flags,
          clues: G.clues,
          inv: G.inventory,
          zones: G.zones,
          talked: G.talked,
          board: G.board,
          history: G.history,
          verdict: G.verdict,
          pos: [player.position.x, player.position.z],
          flavor: G.flavorXP,
        }),
      )
      toast('已存档 ✓')
    } catch (e) {
      toast('存档失败')
    }
  }
  $('btnLoad').onclick = () => {
    const s = localStorage.getItem('wst_save')
    if (!s) {
      toast('没有找到存档')
      return
    }
    try {
      const d = JSON.parse(s)
      Object.assign(G.attrs, d.attrs)
      G.xp = d.xp
      G.level = d.level
      G.points = d.points
      G.checks = d.checks
      G.flags = d.flags
      G.clues = d.clues
      G.inventory = d.inv
      G.zones = d.zones
      G.talked = d.talked
      G.board = d.board
      G.history = d.history
      G.verdict = d.verdict
      G.flavorXP = d.flavor || {}
      player.position.set(d.pos[0], 0, d.pos[1])
      applyWorldFromFlags()
      closeModal('pauseModal')
      refreshHUD()
      refreshObjectives()
      toast('已读档 ✓')
    } catch (e) {
      toast('读档失败')
    }
  }
}
