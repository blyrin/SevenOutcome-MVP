import './style.css'
import * as THREE from 'three'
import { auInit } from './audio.js'
import { initBoardEvents } from './board.js'
import { initControlsEvents, path, scanning, setTimeScale, timeScale, timeScaleT, updatePlayer } from './controls.js'
import { initDialogueDOMEvents, startDialogue } from './dialogue.js'
import { dlgOpen, G, initModalEvents, modalOpen, toast } from './state.js'
import { drawMinimap, initUIEvents, refreshHUD, refreshObjectives, updateInv } from './ui.js'
import { $, dist2, lerp } from './utils.js'
import {
  applyWorldFromFlags, camera, composer, embers, ensureScanLabel, forgeLight, fwater, hamRing, ITAB, labels, NPCS, player, renderer, scene, updateAtmosphere,
} from './world.js'

initModalEvents()
initBoardEvents()
initUIEvents()
initControlsEvents()
initDialogueDOMEvents()

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
    d.mesh.children[0].position.y = 0.9 + Math.sin(now / 900 + d.mesh.userData.bob) * 0.02
    const dd = dist2(player.position.x, player.position.z, d.pos[0], d.pos[1])
    if (dd < 7) {
      const ty = Math.atan2(player.position.x - d.pos[0], player.position.z - d.pos[1])
      d.mesh.rotation.y += (ty - d.mesh.rotation.y) * 0.06
    }
  }

  const pu = (Math.sin(now / 300) + 1) / 2
  hamRing.material.opacity = ITAB.hammer.hidden ? 0 : 0.25 + pu * 0.35
  hamRing.scale.setScalar(1 + pu * 0.12)
  embers.material.color.setHSL(0.05, 0.95, 0.42 + pu * 0.14)
  if (embers.material.emissiveIntensity !== undefined) {
    embers.material.emissiveIntensity = 2.0 + pu * 0.9
  }
  forgeLight.intensity = 0.7 + pu * 0.4
  fwater.material.color.setHSL(0.55, 0.4, 0.26 + Math.sin(now / 700) * 0.03)

  updateAtmosphere(dt, now)

  for (const id in ITAB) {
    const it = ITAB[id]
    if (it.hidden || it.kind === 'npc') {
      continue
    }
    const el = ensureScanLabel(id)
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
  setTimeout(() => {
    startDialogue('sheriff')
  }, 1200)
  setTimeout(() => {
    if (!path.length) {
      toast('点击地面移动 · 按住 Tab 感知周围交互目标')
    }
  }, 600)
}

refreshHUD()
refreshObjectives()
applyWorldFromFlags()
animate()
