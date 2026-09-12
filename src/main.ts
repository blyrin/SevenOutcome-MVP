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
import { dlgOpen, G, initModalEvents, modalOpen, toast } from './state'
import {
  hideLoadingScreen, initUIEvents, refreshHUD, refreshObjectives, renderIntroCaseList, setCaseSwitchHandler,
  setupIntroFromManifest, showLoadingScreen, updateInv, updateLoadingProgress,
} from './ui'
import { $, dist2, lerp } from './utils'
import {
  applyWorldFromFlags, camera, composer, labels, NPCS, player, pulseScanGlow, renderer, scene,
} from './world'
import { getCurrentCase, getManifest, getSelectedCaseId, loadCaseWithAssets } from './cases/caseManager'

initModalEvents()
initBoardEvents()
initUIEvents()
initControlsEvents()
initCameraEvents()
initDialogueDOMEvents()

const initialManifest = getManifest(getSelectedCaseId())
if (initialManifest) {
  setupIntroFromManifest(initialManifest)
}
renderIntroCaseList()

let lastT = performance.now()
const v = new THREE.Vector3()

function animate(): void {
  requestAnimationFrame(animate)
  if (!G.started || !getCurrentCase()) {
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

  const curCase = getCurrentCase()
  if (curCase && curCase.map && curCase.map.update) {
    curCase.map.update(dt, now)
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

async function launchCase(caseId: string): Promise<void> {
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

  snapCamera()
  applyWorldFromFlags()
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
  if (caseDef.audio && caseDef.audio.bgm) {
    playBgm(caseDef.audio.bgm)
  }

  const startNpc = caseDef.meta?.startNpc
  const startHint = caseDef.meta?.startHint || '点击地面移动 · 按住 Tab 感知周围交互目标'

  const onIntroComplete = () => {
    if (startNpc) {
      setTimeout(() => {
        startDialogue(startNpc)
      }, 200)
    }
    let hintWait = 0
    const showStartHint = (): void => {
      if ((dlgOpen() || modalOpen()) && hintWait < 10) {
        hintWait++
        setTimeout(showStartHint, 1500)
        return
      }
      if (!path.length) {
        toast(startHint)
      }
    }
    setTimeout(showStartHint, 600)
  }

  if (caseDef.cutscene && caseDef.cutscene.shots && caseDef.cutscene.shots.length > 0) {
    playOpeningCutscene(caseDef.cutscene, onIntroComplete)
  } else {
    onIntroComplete()
  }
}

setCaseSwitchHandler(launchCase)

const btnStart = $('btnStart')
if (btnStart) {
  btnStart.onclick = () => {
    auInit()
    launchCase(getSelectedCaseId())
  }
}

animate()
