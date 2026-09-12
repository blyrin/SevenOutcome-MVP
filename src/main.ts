import './style.css'
import * as THREE from 'three'
import { auInit, playBgm } from './audio'
import { initBoardEvents } from './board'
import {
  initControlsEvents, path, setScanning, setTimeScale, snapCamera, timeScale, timeScaleT, updatePlayer,
} from './controls'
import { initDialogueDOMEvents, startDialogue } from './dialogue'
import {
  initCameraEvents, isCutsceneActive, isInspectionActive, playOpeningCutscene, updateCamera,
} from './camera'
import { confirmBox, dlgOpen, G, initModalEvents, modalOpen, toast } from './state'
import {
  applySaveData, autoSave, clearSave, hideLoadingScreen, initUIEvents, readSaveData, refreshHUD,
  refreshObjectives, setCaseSwitchHandler, setHubSwitchHandler, setSaveApplier,
  setupIntroHome, showLoadingScreen, updateInv, updateLoadingProgress,
} from './ui'
import type { SaveState } from './ui'
import { $, dist2, lerp } from './utils'
import {
  applyWorldFromFlags, camera, composer, labels, NPCS, player, pulseScanGlow, renderer, scene,
} from './world'
import {
  getManifest, getCurrentScene, HUB_CASE_ID, loadCaseWithAssets, loadHubWithAssets,
} from './cases/caseManager'
import { ensureDailyFresh } from './hub/agency/daily'

initModalEvents()
initBoardEvents()
initUIEvents()
initControlsEvents()
initCameraEvents()
initDialogueDOMEvents()

setupIntroHome()

let lastT = performance.now()
const v = new THREE.Vector3()

function animate(): void {
  requestAnimationFrame(animate)
  if (!G.started || !getCurrentScene()) {
    return
  }
  const now = performance.now()
  const dt = Math.min((now - lastT) / 1000, 0.05)
  lastT = now
  const nextTimeScale = lerp(timeScale, timeScaleT, 0.08)
  setTimeScale(nextTimeScale)
  const sdt = dt * nextTimeScale
  if (!modalOpen() && !G.verdict) {
    updatePlayer(sdt * (dlgOpen() ? 0.35 : 1))
  }

  for (const k in NPCS) {
    const d = NPCS[k]
    if (!d || !d.mesh || !d.mesh.children || !d.mesh.children[0]) {
      continue
    }
    const baseY = d.mesh.userData.baseTorsoY || 0.82
    d.mesh.children[0].position.y = baseY + Math.sin(now / 900 + (d.mesh.userData.bob || 0)) * 0.02
    const dd = dist2(player.position.x, player.position.z, d.pos[0], d.pos[1])
    if (dd < 7) {
      const ty = Math.atan2(player.position.x - d.pos[0], player.position.z - d.pos[1])
      d.mesh.rotation.y += (ty - d.mesh.rotation.y) * 0.06
    }
  }

  const curScene = getCurrentScene()
  if (curScene && curScene.map && curScene.map.update) {
    curScene.map.update(dt, now)
  }

  pulseScanGlow(now)

  labels.forEach(L => {
    let show = !isCutsceneActive() && !dlgOpen() && !isInspectionActive() && L.cond && L.cond()
    if (show) {
      const p = L.getPos()
      v.copy(p).project(camera)
      if (v.z > 1) {
        show = false
      } else {
        L.el.style.left = ((v.x + 1) / 2) * innerWidth + 'px'
        L.el.style.top = ((-v.y + 1) / 2) * innerHeight + 'px'
      }
    }
    L.el.style.opacity = show ? '1' : '0'
  })

  updateInv(dt)
  updateCamera(dt, now)
  composer.render()
}

function applyProfile(d: {
  attrs?: typeof G.attrs
  xp?: number
  level?: number
  points?: number
  completedCases?: string[]
  daily?: typeof G.daily
}): void {
  if (d.attrs) {
    Object.assign(G.attrs, d.attrs)
  }
  G.xp = d.xp || 0
  G.level = d.level || 1
  G.points = d.points || 0
  G.completedCases = d.completedCases || []
  G.daily = d.daily || { date: '', offered: [], accepted: [], done: [] }
}

function applyRestore(s: SaveState): void {
  G.flags = s.flags || {}
  G.clues = s.clues || []
  G.inventory = s.inventory || []
  G.zones = s.zones || {}
  G.talked = s.talked || {}
  G.board = s.board || { killer: null, weapon: null, motive: null, method: null }
  G.history = s.history || []
  G.verdict = null
  G.flavorXP = s.flavorXP || {}
  G.checks = s.checks || 0
  G.assignment = s.assignment !== undefined ? s.assignment : null
  if (s.pos) {
    player.position.set(s.pos[0], 0, s.pos[1])
  }
  applyWorldFromFlags()
  refreshHUD()
  refreshObjectives()
}

async function revealScene(): Promise<void> {
  snapCamera()
  lastT = performance.now()
  G.started = true
  document.body.classList.add('game-started')
  refreshHUD()
  refreshObjectives()

  scene.updateMatrixWorld(true)
  renderer.shadowMap.needsUpdate = true
  renderer.compile(scene, camera)
  composer.render()
  await new Promise(r => requestAnimationFrame(r))
  composer.render()

  await new Promise(r => setTimeout(r, 220))
  await hideLoadingScreen()
  auInit()
}

function showStartHint(hint: string): void {
  let hintWait = 0
  const tryShow = (): void => {
    if ((dlgOpen() || modalOpen()) && hintWait < 10) {
      hintWait++
      setTimeout(tryShow, 1500)
      return
    }
    if (!path.length) {
      toast(hint)
    }
  }
  setTimeout(tryShow, 600)
}

async function launchCase(caseId: string, restore?: SaveState): Promise<void> {
  const manifest = getManifest(caseId)
  if (!manifest) return

  const intro = $('intro')
  if (intro) {
    intro.classList.add('off')
  }

  setScanning(false)

  showLoadingScreen(manifest.title, manifest.meta.caseCode || 'CASE FILE', manifest.subtitle || '雾杉镇疑案')

  const caseDef = await loadCaseWithAssets(caseId, (pct, status) => {
    updateLoadingProgress(pct, status)
  })

  if (restore) {
    applyRestore(restore)
  }

  await revealScene()

  if (caseDef.audio && caseDef.audio.bgm) {
    playBgm(caseDef.audio.bgm)
  }

  autoSave()

  if (restore) {
    return
  }

  const startNpc = caseDef.meta?.startNpc
  const startHint = caseDef.meta?.startHint || '点击地面移动 · 按住 Tab 感知周围交互目标'

  const onIntroComplete = () => {
    if (startNpc) {
      setTimeout(() => {
        startDialogue(startNpc)
      }, 200)
    }
    showStartHint(startHint)
  }

  if (caseDef.cutscene && caseDef.cutscene.shots && caseDef.cutscene.shots.length > 0) {
    playOpeningCutscene(caseDef.cutscene, onIntroComplete)
  } else {
    onIntroComplete()
  }
}

async function launchHub(first: boolean, restore?: SaveState): Promise<void> {
  const intro = $('intro')
  if (intro) {
    intro.classList.add('off')
  }

  setScanning(false)

  showLoadingScreen('侦探事务所', 'HOME', '雾杉镇探案辑录')

  const caseDef = await loadHubWithAssets((pct, status) => {
    updateLoadingProgress(pct, status)
  })

  if (restore) {
    applyRestore(restore)
  }

  ensureDailyFresh()

  await revealScene()

  if (caseDef.audio && caseDef.audio.bgm) {
    playBgm(caseDef.audio.bgm)
  }

  autoSave()

  if (restore) {
    toast('已回到事务所 · 进度已恢复')
    return
  }

  if (first) {
    setTimeout(() => {
      startDialogue('evelyn')
    }, 400)
  } else {
    toast('已回到事务所')
  }
  showStartHint(caseDef.meta?.startHint || '与伊芙交谈接取委托')
}

setCaseSwitchHandler(launchCase)
setHubSwitchHandler(() => launchHub(false))
setSaveApplier(async d => {
  applyProfile(d)
  if (d.scene === HUB_CASE_ID) {
    await launchHub(false, d.state)
  } else {
    await launchCase(d.scene, d.state)
  }
  closeModalAll()
  refreshHUD()
  refreshObjectives()
  autoSave()
  toast('已读档 ✓')
})

function closeModalAll(): void {
  const ids = ['pauseModal', 'caseModal', 'questModal', 'boardModal', 'trialModal', 'invModal', 'historyModal',
    'levelupModal', 'confirmModal']
  for (const id of ids) {
    const el = $(id)
    if (el) {
      el.classList.remove('on')
    }
  }
}

const btnStart = $('btnStart')
if (btnStart) {
  btnStart.onclick = () => {
    auInit()
    void launchHub(true)
  }
}

const btnContinue = $('btnContinue')
if (btnContinue) {
  btnContinue.onclick = () => {
    const d = readSaveData()
    if (!d) {
      toast('没有找到可用的存档')
      return
    }
    auInit()
    void applySaveData(d)
  }
}

const btnNewGame = $('btnNewGame')
if (btnNewGame) {
  btnNewGame.onclick = () => {
    confirmBox('这将清除当前存档，所有章节进度与侦探特质都会重置。<br><br>确定要开始全新的调查吗？', () => {
      clearSave()
      auInit()
      void launchHub(true)
    })
  }
}

animate()
