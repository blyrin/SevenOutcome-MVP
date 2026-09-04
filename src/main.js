import './style.css'
import * as THREE from 'three'
import { auInit } from './audio.js'
import { initBoardEvents } from './board.js'
import { initControlsEvents, path, scanning, setTimeScale, timeScale, timeScaleT, updatePlayer } from './controls.js'
import { initDialogueDOMEvents, startDialogue } from './dialogue.js'
import { dlgOpen, G, initModalEvents, modalOpen, toast } from './state.js'
import { drawMinimap, initUIEvents, refreshHUD, refreshObjectives, updateInv } from './ui.js'
import { $, dist2, lerp } from './utils.js'
import { applyWorldFromFlags, camera, composer, ensureScanLabel, ITAB, labels, NPCS, player } from './world.js'
import { caseBlacksmith } from './cases/blacksmith/index.js'
import { getCurrentCase, loadCase } from './cases/caseManager.js'

initModalEvents()
initBoardEvents()
initUIEvents()
initControlsEvents()
initDialogueDOMEvents()

loadCase(caseBlacksmith)

let lastT = performance.now()
const v = new THREE.Vector3()

function animate() {
  requestAnimationFrame(animate)
  const now = performance.now()
  const dt = Math.min((now - lastT) / 1000, 0.05)
  lastT = now
  const nextTimeScale = lerp(timeScale, timeScaleT, 0.08)
  setTimeScale(nextTimeScale)
  const sdt = dt * nextTimeScale
  if (G.started && !modalOpen() && !G.verdict) {
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

  for (const id in ITAB) {
    const it = ITAB[id]
    if (it.hidden || it.kind === 'npc') {
      continue
    }
    const el = ensureScanLabel(id)
    if (!el) {
      continue
    }
    if (scanning && G.started) {
      const p = it.mesh.getWorldPosition(new THREE.Vector3())
      const dd = dist2(player.position.x, player.position.z, p.x, p.z)
      el.style.opacity = dd < 16 ? 1 : 0
    } else {
      el.style.opacity = 0
    }
  }

  labels.forEach(L => {
    let show = L.cond && L.cond()
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
    L.el.style.opacity = show ? 1 : 0
  })

  updateInv(dt)
  composer.render()
  drawMinimap()
}

$('btnStart').onclick = () => {
  auInit()
  $('intro').classList.add('off')
  G.started = true
  refreshHUD()
  refreshObjectives()
  const curCase = getCurrentCase()
  const startNpc = curCase?.meta?.startNpc
  if (startNpc) {
    setTimeout(() => {
      startDialogue(startNpc)
    }, 1200)
  }
  const startHint = curCase?.meta?.startHint || '点击地面移动 · 按住 Tab 感知周围交互目标'
  setTimeout(() => {
    if (!path.length) {
      toast(startHint)
    }
  }, 600)
}

refreshHUD()
refreshObjectives()
applyWorldFromFlags()
animate()
