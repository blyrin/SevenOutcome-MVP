import * as THREE from 'three'
import { setMusic, setVoice, sfx } from './audio.js'
import { closeModal, dlgOpen, G, modalOpen, openModal, toast, xpNeed } from './state.js'
import { $, ATTRS, clamp } from './utils.js'
import { applyWorldFromFlags, player } from './world.js'
import { getAllCases, getCurrentCase, loadCase } from './cases/caseManager.js'

export function refreshHUD() {
  $('lvlbadge').textContent = 'Lv.' + G.level
  $('xpfill').style.width = clamp((G.xp / xpNeed(G.level)) * 100, 0, 100) + '%'
  const ar = $('attrRow')
  ar.innerHTML = ''
  for (const k in ATTRS) {
    ar.innerHTML += `<div class="attr" title="${ ATTRS[k].d }"><span class="attr-icon">${ ATTRS[k].i }</span><span class="attr-label">${ ATTRS[k].n }</span><b>${ G.attrs[k] }</b></div>`
  }
  $('pendPts').style.display = G.points > 0 ? 'flex' : 'none'
}

export function refreshObjectives() {
  const curCase = getCurrentCase()
  const objData = curCase && curCase.getObjectives ? curCase.getObjectives(G) : { list: [] }
  if (objData.notStartedText) {
    $('objList').innerHTML = `<div class="obj">${ objData.notStartedText }</div>`
    return
  }
  $('objList').innerHTML = (objData.list || []).map(x => `<div class="obj ${ x.d ? 'done' : '' }">${ x.t }</div>`)
    .join('')
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
  const curCase = getCurrentCase()
  G.inventory.forEach(id => {
    const it = (curCase.items && curCase.items[id]) || (curCase.clues && curCase.clues[id]) || {}
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

export function selectInv(id) {
  document.querySelectorAll('.islot').forEach(x => x.classList.toggle('sel', x.dataset.id === id))
  const curCase = getCurrentCase()
  const it = (curCase.items && curCase.items[id]) || (curCase.clues && curCase.clues[id]) || {}
  $('invName').textContent = (it.icon || '') + ' ' + (it.name || id)
  $('invDesc').textContent = it.d || it.detail || ''
  if (invObj) {
    invScene.remove(invObj)
  }
  invObj = curCase.itemMesh ? curCase.itemMesh(id) : new THREE.Group()
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
    d.innerHTML = `<div>${ a.i } <b style="color:#e9dfc8">${ a.n }</b> <span class="lud">${ a.d }</span></div><div><button data-k="${ k }" data-d="-1">−</button> <b>${ G.attrs[k] }</b> <button data-k="${ k }" data-d="1">＋</button></div>`
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
    ? G.history.map(h => `<div><span class="hs">${ h.s }：</span>${ h.t }</div>`).join('')
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

export function drawMinimap() {
  const mm = $('minimap')
  const mmc = mm.getContext('2d')
  mmc.clearRect(0, 0, 176, 132)
  const curCase = getCurrentCase()
  if (curCase && curCase.map && curCase.map.drawMinimap) {
    curCase.map.drawMinimap(mmc, player)
  }
  const sx = x => ((x + 41) / 82) * 176
  const sy = z => ((z + 29) / 58) * 132

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

export function setupCaseUI(caseDef) {
  if (!caseDef) {
    return
  }
  const meta = caseDef.meta || {}
  const title = caseDef.title || '未知案件'
  const subtitle = caseDef.subtitle || ''

  document.title = subtitle ? `${ subtitle } · ${ title }` : title

  const chTag = $('chapterTag')
  if (chTag) {
    chTag.textContent = meta.chapterTag || title
  }

  const arName = $('areaName')
  if (arName) {
    arName.textContent = subtitle ? `${ subtitle } · ${ meta.defaultArea || '现场' }` : (meta.defaultArea || '调查现场')
  }

  const bdSub = $('boardSub')
  if (bdSub) {
    bdSub.textContent = meta.boardSub || meta.caseCode || 'CASE FILE'
  }

  const trSub = $('trialSub')
  if (trSub) {
    trSub.textContent = meta.trialSub || '基于已查明的证据链，做出最终案件定性'
  }

  const it = $('introTitle')
  if (it) {
    it.textContent = title
  }

  const isyn = $('introSynopsis')
  if (isyn) {
    isyn.innerHTML = meta.synopsis || '调查现场勘查、走访证人、拼合证据链，做出最终裁决。'
  }

  renderIntroCaseList()
  refreshHUD()
  refreshObjectives()
}

export function renderIntroCaseList() {
  const box = $('introCaseList')
  if (!box) {
    return
  }
  box.innerHTML = ''
  const cases = getAllCases()
  const curCase = getCurrentCase()

  for (const id in cases) {
    const c = cases[id]
    const meta = c.meta || {}
    const isCur = curCase && curCase.id === c.id
    const card = document.createElement('div')
    card.className = 'it-case-card' + (isCur ? ' active' : '')
    card.innerHTML = `
      <div class="it-case-card-head">
        <div class="it-case-title">${c.title}</div>
        <span class="it-case-status">${isCur ? '已就绪' : '可选择'}</span>
      </div>
      <div class="it-case-desc">${(meta.synopsis || '').replace(/<br\s*\/?>/gi, ' ')}</div>
    `
    card.onclick = () => {
      if (isCur) {
        return
      }
      sfx('click')
      loadCase(c)
    }
    box.appendChild(card)
  }
}

export function openCaseModal() {
  renderCaseModal()
  openModal('caseModal')
}

export function renderCaseModal() {
  const box = $('caseList')
  if (!box) {
    return
  }
  box.innerHTML = ''
  const cases = getAllCases()
  const curCase = getCurrentCase()

  for (const id in cases) {
    const c = cases[id]
    const meta = c.meta || {}
    const isCur = curCase && curCase.id === c.id
    const card = document.createElement('div')
    card.className = 'case-card' + (isCur ? ' active' : '')
    card.innerHTML = `
      <div class="case-card-head">
        <span class="case-code">${ meta.caseCode || 'CASE' }</span>
        <span class="case-badge">${ isCur ? '正在调查' : '待指派' }</span>
      </div>
      <div class="case-title">${ c.title }</div>
      <div class="case-sub">${ c.subtitle || '' }</div>
      <div class="case-desc">${ (meta.synopsis || '').replace(/<br>/g, ' ') }</div>
      <div class="case-action">
        <button class="btn ${ isCur ? 'ghost' : 'primary' }">${ isCur ? '当前调查中' : '载入此案件' }</button>
      </div>
    `
    card.querySelector('button').onclick = () => {
      if (isCur) {
        closeModal('caseModal')
        return
      }
      closeModal('caseModal')
      closeModal('pauseModal')
      loadCase(c)
      toast(`已载入案件：${ c.title }`)
      sfx('click')
    }
    box.appendChild(card)
  }
}

export function initUIEvents() {
  renderIntroCaseList()
  if ($('btnPauseCases')) {
    $('btnPauseCases').onclick = openCaseModal
  }
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
          caseId: getCurrentCase()?.id || 'blacksmith',
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
      if (d.caseId && getCurrentCase()?.id !== d.caseId) {
        loadCase(d.caseId)
      }
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
