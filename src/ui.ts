import * as THREE from 'three'
import { setMusic, setVoice, sfx } from './audio'
import { setTimeScaleT } from './controls'
import { closeModal, confirmBox, dlgOpen, G, modalOpen, openModal, toast, xpNeed } from './state'
import { $, ATTRS, clamp } from './utils'
import { applyWorldFromFlags, player } from './world'
import {
  getAllManifests, getCurrentCase, getCurrentScene, HUB_CASE_ID, isCaseUnlocked,
} from './cases/caseManager'
import type {
  AttrKey, AttrStats, BoardState, CaseDefinition, DailySaveState, FlagValue, HistoryItem, HubDefinition,
} from './types'

export function refreshHUD(): void {
  if (!G.started) return
  const lvlbadge = $('lvlbadge')
  if (lvlbadge) {
    lvlbadge.textContent = 'Lv.' + G.level
  }
  const xpfill = $('xpfill')
  if (xpfill) {
    xpfill.style.width = clamp((G.xp / xpNeed(G.level)) * 100, 0, 100) + '%'
  }
  const ar = $('attrRow')
  if (ar) {
    ar.innerHTML = ''
    const keys = Object.keys(ATTRS) as AttrKey[]
    for (const k of keys) {
      ar.innerHTML += `<div class="attr" title="${ ATTRS[k].d }"><span class="attr-icon">${ ATTRS[k].i }</span><span class="attr-label">${ ATTRS[k].n }</span><b>${ G.attrs[k] }</b></div>`
    }
  }
  const pendPts = $('pendPts')
  if (pendPts) {
    pendPts.style.display = G.points > 0 ? 'flex' : 'none'
  }
}

export function refreshObjectives(): void {
  if (!G.started) return
  const curScene = getCurrentScene()
  const objData = curScene && curScene.map.getObjectives ? curScene.map.getObjectives(G) : { list: [] }
  const objList = $('objList')
  if (!objList) return
  if (objData.notStartedText) {
    objList.innerHTML = `<div class="obj">${ objData.notStartedText }</div>`
    return
  }
  objList.innerHTML = (objData.list || []).map(x => `<div class="obj ${ x.d ? 'done' : '' }">${ x.t }</div>`)
    .join('')
}

let invScene: THREE.Scene | null = null
let invCam: THREE.PerspectiveCamera | null = null
let invObj: THREE.Object3D | null = null
let invRenderer: THREE.WebGLRenderer | null = null

export function openInv(): void {
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
    const invViewer = $('invViewer')
    if (invViewer) {
      invViewer.appendChild(invRenderer.domElement)
    }
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

export function renderInvGrid(): void {
  const g = $('invGrid')
  if (!g) return
  g.innerHTML = ''
  const curCase = getCurrentCase()
  G.inventory.forEach(id => {
    const it = (curCase?.items && curCase.items[id]) || (curCase?.clues && curCase.clues[id]) ||
      { icon: '❔', name: id }
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

export function selectInv(id: string): void {
  document.querySelectorAll<HTMLElement>('.islot').forEach(x => x.classList.toggle('sel', x.dataset.id === id))
  const curCase = getCurrentCase()
  const it = (curCase?.items && curCase.items[id]) || (curCase?.clues && curCase.clues[id]) ||
    { icon: '', name: id, d: '', detail: '' }
  const invName = $('invName')
  if (invName) {
    invName.textContent = (it.icon || '') + ' ' + (it.name || id)
  }
  const invDesc = $('invDesc')
  if (invDesc) {
    invDesc.textContent = it.d || it.detail || ''
  }
  if (invObj && invScene) {
    invScene.remove(invObj)
  }
  invObj = curCase?.itemMesh ? curCase.itemMesh(id) : new THREE.Group()
  invObj.position.y = 0.4
  if (invScene) {
    invScene.add(invObj)
  }
}

export function updateInv(dt: number): void {
  if (invObj) {
    invObj.rotation.y += dt * 0.8
  }
  const modal = $('invModal')
  if (modal && modal.classList.contains('on') && invRenderer && invScene && invCam) {
    invRenderer.render(invScene, invCam)
  }
}

interface LevelUpButton extends HTMLButtonElement {
  __can?: boolean
}

export function openLevelup(): void {
  if (modalOpen()) {
    return
  }
  renderLu()
  openModal('levelupModal')
}

export function renderLu(): void {
  const luPts = $('luPts')
  if (luPts) {
    luPts.textContent = String(G.points)
  }
  const r = $('luRows')
  if (!r) return
  r.innerHTML = ''
  const keys = Object.keys(ATTRS) as AttrKey[]
  for (const k of keys) {
    const a = ATTRS[k]
    const d = document.createElement('div')
    d.className = 'lurow'
    d.innerHTML = `<div>${ a.i } <b style="color:#e9dfc8">${ a.n }</b> <span class="lud">${ a.d }</span></div><div><button data-k="${ k }" data-d="-1">−</button> <b>${ G.attrs[k] }</b> <button data-k="${ k }" data-d="1">＋</button></div>`
    r.appendChild(d)
  }
  r.querySelectorAll<LevelUpButton>('button').forEach(b => {
    b.onclick = () => {
      const k = b.dataset.k as AttrKey
      const d = parseInt(b.dataset.d || '0')
      if (d > 0 && G.points > 0) {
        G.attrs[k]++
        G.points--
        sfx('click')
      }
      if (d < 0 && b.__can) {
        G.attrs[k]--
        G.points++
      }
      renderLu()
      refreshHUD()
    }
  })
  r.querySelectorAll<HTMLButtonElement>('button[data-d="-1"]').forEach(b => {
    b.style.opacity = '0.2'
  })
}

export function openHist(): void {
  if (modalOpen()) {
    return
  }
  const l = $('histList')
  if (l) {
    l.innerHTML = G.history.length
      ? G.history.map(h => `<div><span class="hs">${ h.s }：</span>${ h.t }</div>`).join('')
      : '<div class="empty-hint">暂无历史对话记录</div>'
  }
  openModal('historyModal')
}

export function togglePause(): void {
  const pauseModal = $('pauseModal')
  if (pauseModal && pauseModal.classList.contains('on')) {
    closeModal('pauseModal')
  } else if (!modalOpen() && !dlgOpen() && G.started) {
    openModal('pauseModal')
  }
}

export function initOrientationLock(): void {
  const overlay = $('rotateScreen')
  const btn = $('btnRotateFullscreen')
  if (!overlay) return

  const check = () => {
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0
    const isMobile = /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    const isPortrait = window.innerHeight > window.innerWidth
    const needLock = (isTouch || isMobile) && isPortrait
    overlay.classList.toggle('active', needLock)
  }

  if (btn) {
    btn.onclick = async () => {
      try {
        const docEl = document.documentElement as HTMLElement & {
          webkitRequestFullscreen?: () => Promise<void>
          mozRequestFullScreen?: () => Promise<void>
        }
        if (docEl.requestFullscreen) {
          await docEl.requestFullscreen()
        } else if (docEl.webkitRequestFullscreen) {
          await docEl.webkitRequestFullscreen()
        }
      } catch (e) {}

      try {
        if (screen.orientation && 'lock' in screen.orientation) {
          await (screen.orientation as any).lock('landscape')
        }
      } catch (e) {}

      check()
    }
  }

  window.addEventListener('resize', check)
  window.addEventListener('orientationchange', check)
  if (screen.orientation) {
    screen.orientation.addEventListener('change', check)
  }
  check()
}

let caseSwitchHandler: ((caseId: string) => Promise<void>) | null = null
let hubSwitchHandler: (() => Promise<void>) | null = null
let saveApplier: ((d: SaveData) => Promise<void>) | null = null

export function setCaseSwitchHandler(fn: (caseId: string) => Promise<void>): void {
  caseSwitchHandler = fn
}

export function setHubSwitchHandler(fn: () => Promise<void>): void {
  hubSwitchHandler = fn
}

export function setSaveApplier(fn: (d: SaveData) => Promise<void>): void {
  saveApplier = fn
}

export function switchToCase(caseId: string): void {
  if (caseSwitchHandler) {
    void caseSwitchHandler(caseId)
  }
}

export function switchToHub(): void {
  if (hubSwitchHandler) {
    void hubSwitchHandler()
  }
}

export interface SaveState {
  flags: Record<string, FlagValue>
  clues: string[]
  inventory: string[]
  zones: Record<string, number>
  talked: Record<string, number>
  board: BoardState
  history: HistoryItem[]
  verdict: string | null
  flavorXP: Record<string, number>
  checks: number
  assignment: string | null
  pos: [number, number]
}

export interface SaveData {
  v: number
  scene: string
  attrs: AttrStats
  xp: number
  level: number
  points: number
  completedCases: string[]
  daily: DailySaveState
  state: SaveState
}

export function collectSaveData(): SaveData {
  const cur = getCurrentCase()
  return {
    v: 2,
    scene: cur ? cur.id : HUB_CASE_ID,
    attrs: { ...G.attrs },
    xp: G.xp,
    level: G.level,
    points: G.points,
    completedCases: [...G.completedCases],
    daily: JSON.parse(JSON.stringify(G.daily)) as DailySaveState,
    state: {
      flags: { ...G.flags },
      clues: [...G.clues],
      inventory: [...G.inventory],
      zones: { ...G.zones },
      talked: { ...G.talked },
      board: { ...G.board },
      history: [...G.history],
      verdict: G.verdict,
      flavorXP: { ...G.flavorXP },
      checks: G.checks,
      assignment: G.assignment,
      pos: [player.position.x, player.position.z],
    },
  }
}

export function readSaveData(): SaveData | null {
  try {
    const s = localStorage.getItem('wst_save')
    if (!s) {
      return null
    }
    const d = JSON.parse(s) as SaveData
    if (!d || d.v !== 2 || !d.scene || !d.state) {
      return null
    }
    return d
  } catch (e) {
    return null
  }
}

export function clearSave(): void {
  try {
    localStorage.removeItem('wst_save')
  } catch (e) {}
}

export function autoSave(): void {
  if (!G.started) {
    return
  }
  try {
    localStorage.setItem('wst_save', JSON.stringify(collectSaveData()))
  } catch (e) {}
}

export function saveGame(): void {
  autoSave()
  toast('已存档 ✓')
}

export async function applySaveData(d: SaveData): Promise<void> {
  if (!saveApplier) {
    return
  }
  await saveApplier(d)
}

export function loadGame(): void {
  const d = readSaveData()
  if (!d) {
    toast('没有找到可用的存档')
    return
  }
  void applySaveData(d)
}

export function showLoadingScreen(title: string, badge?: string, sub?: string): void {
  const ls = $('loadingScreen')
  if (!ls) return
  const lsBadge = $('lsBadge')
  if (lsBadge) lsBadge.textContent = badge || 'CASE FILE'
  const lsTitle = $('lsTitle')
  if (lsTitle) lsTitle.textContent = title
  const lsSub = $('lsSub')
  if (lsSub) lsSub.textContent = sub || '雾杉镇疑案'
  const lsFill = $('lsFill')
  if (lsFill) lsFill.style.width = '0%'
  const lsPercent = $('lsPercent')
  if (lsPercent) lsPercent.textContent = '0%'
  const lsStatus = $('lsStatus')
  if (lsStatus) lsStatus.textContent = '正在检索案件档案…'
  ls.classList.add('active')
}

export function updateLoadingProgress(pct: number, status: string): void {
  const lsFill = $('lsFill')
  if (lsFill) lsFill.style.width = Math.min(100, Math.max(0, pct)) + '%'
  const lsPercent = $('lsPercent')
  if (lsPercent) lsPercent.textContent = Math.min(100, Math.max(0, pct)) + '%'
  const lsStatus = $('lsStatus')
  if (lsStatus) lsStatus.textContent = status
}

export function hideLoadingScreen(): Promise<void> {
  return new Promise(resolve => {
    const ls = $('loadingScreen')
    if (!ls) {
      resolve()
      return
    }
    ls.classList.remove('active')
    setTimeout(resolve, 400)
  })
}

const HOME_SYNOPSIS = '你是雾杉镇唯一在册的私家侦探。<br>在事务所里接取委托、料理每日差事，走进案发现场勘查物证、走访证人，在告示板拼合证据链，做出最终裁决。<br>每一次结案都会写入你的档案——经验、特质与新的委托，将伴你在这座雾气弥漫的小镇继续走下去。'

export function setupIntroHome(): void {
  document.title = '雾杉镇探案辑录'
  const it = $('introTitle')
  if (it) {
    it.textContent = '雾杉镇探案辑录'
  }
  const isyn = $('introSynopsis')
  if (isyn) {
    isyn.innerHTML = HOME_SYNOPSIS
  }
  refreshIntroButtons()
}

export function refreshIntroButtons(): void {
  const hasSave = !!readSaveData()
  const btnStart = $('btnStart')
  if (btnStart) {
    btnStart.style.display = hasSave ? 'none' : ''
    btnStart.textContent = '进 入 事 务 所'
  }
  const btnContinue = $('btnContinue')
  if (btnContinue) {
    btnContinue.style.display = hasSave ? '' : 'none'
  }
  const btnNewGame = $('btnNewGame')
  if (btnNewGame) {
    btnNewGame.style.display = hasSave ? '' : 'none'
  }
}

export function setupCaseUI(caseDef: CaseDefinition | HubDefinition | null): void {
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
    bdSub.textContent = 'clues' in caseDef
      ? (caseDef.meta.boardSub || caseDef.meta.caseCode || 'CASE FILE')
      : ''
  }

  const trSub = $('trialSub')
  if (trSub) {
    trSub.textContent = 'clues' in caseDef
      ? (caseDef.meta.trialSub || '基于已查明的证据链，做出最终案件定性')
      : ''
  }

  const btnBoard = $('btnHudBoard')
  if (btnBoard) {
    btnBoard.style.display = 'clues' in caseDef ? '' : 'none'
  }

  refreshHUD()
  refreshObjectives()
}

export function openCaseModal(): void {
  renderCaseModal()
  openModal('caseModal')
}

export function renderCaseModal(): void {
  const box = $('caseList')
  if (!box) {
    return
  }
  box.innerHTML = ''
  const manifests = getAllManifests()
  const curCase = getCurrentCase()

  for (const id in manifests) {
    const m = manifests[id]
    const meta = m.meta || {}
    const done = G.completedCases.includes(m.id)
    const unlocked = isCaseUnlocked(m.id)
    const isCur = !!curCase && curCase.id === m.id
    const card = document.createElement('div')
    card.className = 'case-card' + (isCur || done ? ' active' : '')
    const status = isCur ? '调查中' : done ? '已结案' : unlocked ? '可接取' : '🔒 未解锁'
    card.innerHTML = `
      <div class="case-card-head">
        <span class="case-code">${ meta.caseCode || 'CASE' }</span>
        <span class="case-badge">${ status }</span>
      </div>
      <div class="case-title">${ m.title }</div>
      <div class="case-sub">${ m.subtitle || '' }</div>
      <div class="case-desc">${ (meta.synopsis || '').replace(/<br>/g, ' ') }</div>
      <div class="case-action">
        <button class="btn ${ isCur ? 'ghost' : done || unlocked ? 'primary' : 'ghost' }" ${ !isCur && !done && !unlocked ? 'disabled style="opacity:0.4;cursor:not-allowed"' : '' }>${ isCur ? '继续调查' : done ? '重新调查' : unlocked ? '接取并出发' : '需先结案前一章节' }</button>
      </div>
    `
    const btn = card.querySelector<HTMLButtonElement>('button')
    if (btn && (isCur || done || unlocked)) {
      btn.onclick = () => {
        if (isCur) {
          closeModal('caseModal')
          return
        }
        closeModal('caseModal')
        closeModal('pauseModal')
        closeModal('questModal')
        const epi = $('epi')
        if (epi) {
          epi.classList.remove('on')
        }
        const epiStats = $('epiStats')
        if (epiStats) {
          epiStats.classList.remove('on')
        }
        setTimeScaleT(1)
        sfx('click')
        G.assignment = m.id
        if (caseSwitchHandler) {
          void caseSwitchHandler(m.id)
        }
      }
    }
    box.appendChild(card)
  }
}

export function initUIEvents(): void {
  initOrientationLock()
  const lvlbadge = $('lvlbadge')
  if (lvlbadge) {
    lvlbadge.onclick = openLevelup
  }
  const btnPauseCases = $('btnPauseCases')
  if (btnPauseCases) {
    btnPauseCases.onclick = openCaseModal
  }
  const btnBackHub = $('btnBackHub')
  if (btnBackHub) {
    btnBackHub.onclick = () => {
      closeModal('pauseModal')
      confirmBox('返回事务所将重置当前案件的调查进度。<br><br>确定要返回吗？', () => {
        switchToHub()
      })
    }
  }
  const luDone = $('luDone')
  if (luDone) {
    luDone.onclick = () => {
      closeModal('levelupModal')
      refreshHUD()
    }
  }
  const pendPts = $('pendPts')
  if (pendPts) {
    pendPts.onclick = openLevelup
  }

  const btnResume = $('btnResume')
  if (btnResume) {
    btnResume.onclick = () => closeModal('pauseModal')
  }
  const btnRestart = $('btnRestart')
  if (btnRestart) {
    btnRestart.onclick = () => location.reload()
  }
  const btnMusic = $('btnMusic')
  if (btnMusic) {
    btnMusic.onclick = () => {
      setMusic(!G.musicOn)
      btnMusic.textContent = '音乐：' + (G.musicOn ? '开' : '关')
    }
  }
  const btnVoice = $('btnVoice')
  if (btnVoice) {
    btnVoice.onclick = () => {
      setVoice(!G.voiceOn)
      btnVoice.textContent = '角色配音：' + (G.voiceOn ? '开' : '关')
    }
  }
  const btnSave = $('btnSave')
  if (btnSave) {
    btnSave.onclick = saveGame
  }
  const btnLoad = $('btnLoad')
  if (btnLoad) {
    btnLoad.onclick = () => {
      closeModal('pauseModal')
      loadGame()
    }
  }
}
