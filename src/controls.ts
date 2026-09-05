import * as THREE from 'three'
import { setMusic, sfx } from './audio'
import { openBoard } from './board'
import { advanceDialogue, endDialogue, handleDialogueKey, startDialogue } from './dialogue'
import {
  addClue, addItem, checkFX, closeModal, dlgOpen, failFX, G, gainXP, hasFlag, modalOpen, setFlag, toast, uiStack,
} from './state'
import { openHist, openInv, refreshObjectives, togglePause } from './ui'
import { $, clamp, dist2, lerp } from './utils'
import { camera, findPath, interactMeshes, isBlocked, ITAB, NPCS, player, renderer, toG, zoneAt } from './world'
import { getCurrentCase } from './cases/caseManager'
import {
  camOff, camZoom, focusInspection, isCutsceneActive, isInspectionActive, setCamZoom, skipCutscene, snapCamera,
  unfocusInspection,
} from './camera'
import type { AttrKey } from './types'

export { camOff, camZoom, snapCamera }

export let path: Array<[number, number]> = []
export let walkT = 0
export let pendingI: string | null = null
export const wKeys: Record<string, number> = {}
export let timeScale = 1
export let timeScaleT = 1

export function setTimeScaleT(v: number): void {
  timeScaleT = v
}

export function setTimeScale(v: number): void {
  timeScale = v
}

export function canStandAt(x: number, z: number, r = 0.32): boolean {
  const npcRadius = 0.44
  const minNpcDistSq = (npcRadius + r) * (npcRadius + r)
  for (const k in NPCS) {
    const d = NPCS[k]
    if (!d || !d.pos) continue
    const dx = x - d.pos[0]
    const dz = z - d.pos[1]
    if (dx * dx + dz * dz < minNpcDistSq) {
      return false
    }
  }

  const [minGx, minGy] = toG(x - r, z - r)
  const [maxGx, maxGy] = toG(x + r, z + r)
  for (let gy = minGy; gy <= maxGy; gy++) {
    for (let gx = minGx; gx <= maxGx; gx++) {
      if (isBlocked(gx, gy)) {
        return false
      }
    }
  }
  return true
}

export function canWalkDirectly(x1: number, z1: number, x2: number, z2: number, r = 0.32): boolean {
  const dx = x2 - x1, dz = z2 - z1
  const dist = Math.hypot(dx, dz)
  if (dist < 0.05) {
    return true
  }
  const steps = Math.ceil(dist / 0.25)
  for (let i = 1; i <= steps; i++) {
    const t = i / steps
    const px = x1 + dx * t
    const pz = z1 + dz * t
    if (!canStandAt(px, pz, r)) {
      return false
    }
  }
  return true
}

export function smoothPath(rawPath: Array<[number, number]>): Array<[number, number]> {
  if (rawPath.length <= 2) {
    return rawPath
  }
  const result: Array<[number, number]> = []
  let curX = player.position.x, curZ = player.position.z
  let i = 0
  while (i < rawPath.length) {
    let furthest = i
    for (let j = rawPath.length - 1; j > i; j--) {
      if (canWalkDirectly(curX, curZ, rawPath[j][0], rawPath[j][1], 0.3)) {
        furthest = j
        break
      }
    }
    result.push(rawPath[furthest])
    curX = rawPath[furthest][0]
    curZ = rawPath[furthest][1]
    i = furthest + 1
  }
  return result
}

export function moveTo(wx: number, wz: number): void {
  if (canWalkDirectly(player.position.x, player.position.z, wx, wz, 0.32)) {
    path = [[wx, wz]]
    pendingI = null
    return
  }
  const p = findPath(player.position.x, player.position.z, wx, wz)
  if (p.length) {
    path = smoothPath(p)
    pendingI = null
  }
}

export function tryWalk(dx: number, dz: number, dt: number): boolean {
  const dist = Math.hypot(dx, dz)
  if (dist < 0.0001) {
    return false
  }
  const ndx = (dx / dist) * 5.8 * dt
  const ndz = (dz / dist) * 5.8 * dt
  const r = 0.32
  if (canStandAt(player.position.x + ndx, player.position.z + ndz, r)) {
    player.position.x += ndx
    player.position.z += ndz
    return true
  }
  if (canStandAt(player.position.x + ndx, player.position.z, r)) {
    player.position.x += ndx
    return true
  }
  if (canStandAt(player.position.x, player.position.z + ndz, r)) {
    player.position.z += ndz
    return true
  }
  return false
}

let targetRot = 0
let curVelX = 0, curVelZ = 0

export function updatePlayer(dt: number): void {
  if (isCutsceneActive()) {
    path = []
    walkT = 0
    curVelX = 0
    curVelZ = 0
    if (player.userData.leftArm && player.userData.rightArm) {
      player.userData.leftArm.rotation.x *= 0.82
      player.userData.rightArm.rotation.x *= 0.82
    }
    if (player.userData.leftLeg && player.userData.rightLeg) {
      player.userData.leftLeg.rotation.x *= 0.82
      player.userData.rightLeg.rotation.x *= 0.82
    }
    return
  }

  if (dlgOpen()) {
    path = []
    walkT = 0
    curVelX = 0
    curVelZ = 0
    if (player.userData.leftArm && player.userData.rightArm) {
      player.userData.leftArm.rotation.x *= 0.82
      player.userData.rightArm.rotation.x *= 0.82
    }
    if (player.userData.leftLeg && player.userData.rightLeg) {
      player.userData.leftLeg.rotation.x *= 0.82
      player.userData.rightLeg.rotation.x *= 0.82
    }
    const npcRadius = 0.44
    const minDist = npcRadius + 0.32
    const minDistSq = minDist * minDist
    for (const k in NPCS) {
      const d = NPCS[k]
      if (!d || !d.pos) continue
      const dx = player.position.x - d.pos[0]
      const dz = player.position.z - d.pos[1]
      const d2 = dx * dx + dz * dz
      if (d2 < minDistSq && d2 > 0.00001) {
        const dist = Math.sqrt(d2)
        const push = minDist - dist
        player.position.x += (dx / dist) * push
        player.position.z += (dz / dist) * push
      }
    }
    return
  }

  const prevX = player.position.x
  const prevZ = player.position.z

  let inputX = 0, inputZ = 0
  if (wKeys.w) inputZ -= 1
  if (wKeys.s) inputZ += 1
  if (wKeys.a) inputX -= 1
  if (wKeys.d) inputX += 1

  const hasKeyboard = inputX !== 0 || inputZ !== 0

  if (hasKeyboard) {
    path = []
    pendingI = null
    const len = Math.hypot(inputX, inputZ)
    inputX /= len
    inputZ /= len

    const targetSpeed = 5.8
    const targetVx = inputX * targetSpeed
    const targetVz = inputZ * targetSpeed

    const accel = 1 - Math.exp(-22 * dt)
    curVelX = lerp(curVelX, targetVx, accel)
    curVelZ = lerp(curVelZ, targetVz, accel)

    const stepX = curVelX * dt
    const stepZ = curVelZ * dt

    if (Math.hypot(stepX, stepZ) > 0.0001) {
      targetRot = Math.atan2(curVelX, curVelZ)
      const r = 0.32
      const px = player.position.x
      const pz = player.position.z

      if (canStandAt(px + stepX, pz + stepZ, r)) {
        player.position.x += stepX
        player.position.z += stepZ
      } else {
        let moved = false
        if (Math.abs(stepX) > 0.0001 && canStandAt(px + stepX, pz, r)) {
          player.position.x += stepX
          moved = true
        }
        if (Math.abs(stepZ) > 0.0001 && canStandAt(px, pz + stepZ, r)) {
          player.position.z += stepZ
          moved = true
        }
        if (!moved) {
          if (canStandAt(px + stepX * 0.4, pz, r)) player.position.x += stepX * 0.4
          if (canStandAt(px, pz + stepZ * 0.4, r)) player.position.z += stepZ * 0.4
        }
      }
    }
    pendingCheck()
  } else if (path.length) {
    curVelX = 0
    curVelZ = 0
    let remainingStep = 5.8 * dt
    while (remainingStep > 0 && path.length) {
      const wp = path[0]
      const dx = wp[0] - player.position.x
      const dz = wp[1] - player.position.z
      const d = Math.hypot(dx, dz)
      if (d <= remainingStep) {
        player.position.x = wp[0]
        player.position.z = wp[1]
        remainingStep -= d
        path.shift()
      } else {
        player.position.x += (dx / d) * remainingStep
        player.position.z += (dz / d) * remainingStep
        targetRot = Math.atan2(dx, dz)
        remainingStep = 0
      }
    }
    pendingCheck()
  } else {
    curVelX = lerp(curVelX, 0, 1 - Math.exp(-18 * dt))
    curVelZ = lerp(curVelZ, 0, 1 - Math.exp(-18 * dt))
    if (Math.hypot(curVelX, curVelZ) > 0.05) {
      const stepX = curVelX * dt
      const stepZ = curVelZ * dt
      if (canStandAt(player.position.x + stepX, player.position.z + stepZ, 0.32)) {
        player.position.x += stepX
        player.position.z += stepZ
      }
    }
  }

  const npcRadius = 0.44
  const minDist = npcRadius + 0.32
  const minDistSq = minDist * minDist
  for (const k in NPCS) {
    const d = NPCS[k]
    if (!d || !d.pos) continue
    const dx = player.position.x - d.pos[0]
    const dz = player.position.z - d.pos[1]
    const d2 = dx * dx + dz * dz
    if (d2 < minDistSq && d2 > 0.00001) {
      const dist = Math.sqrt(d2)
      const push = minDist - dist
      player.position.x += (dx / dist) * push
      player.position.z += (dz / dist) * push
    }
  }

  const distMoved = Math.hypot(player.position.x - prevX, player.position.z - prevZ)
  const actualSpeed = distMoved / Math.max(dt, 0.001)
  const isMoving = actualSpeed > 0.15

  if (isMoving) {
    let diff = targetRot - player.rotation.y
    while (diff > Math.PI) diff -= Math.PI * 2
    while (diff < -Math.PI) diff += Math.PI * 2
    player.rotation.y += diff * (1 - Math.exp(-20 * dt))

    walkT += dt * Math.min(actualSpeed * 1.8, 12)
    const baseTorsoY = player.userData.baseTorsoY || 0.82
    player.children[0].position.y = baseTorsoY + Math.abs(Math.sin(walkT)) * 0.05
    if (player.userData.leftArm && player.userData.rightArm) {
      const sw = Math.sin(walkT) * 0.42
      player.userData.leftArm.rotation.x = sw
      player.userData.rightArm.rotation.x = -sw
    }
    if (player.userData.leftLeg && player.userData.rightLeg) {
      const lsw = Math.sin(walkT) * 0.52
      player.userData.leftLeg.rotation.x = -lsw
      player.userData.rightLeg.rotation.x = lsw
    }
  } else {
    walkT = 0
    const baseTorsoY = player.userData.baseTorsoY || 0.82
    const idleY = baseTorsoY + Math.sin(performance.now() / 900) * 0.02
    player.children[0].position.y = lerp(player.children[0].position.y, idleY, 1 - Math.exp(-10 * dt))
    if (player.userData.leftArm && player.userData.rightArm) {
      player.userData.leftArm.rotation.x *= 0.82
      player.userData.rightArm.rotation.x *= 0.82
    }
    if (player.userData.leftLeg && player.userData.rightLeg) {
      player.userData.leftLeg.rotation.x *= 0.82
      player.userData.rightLeg.rotation.x *= 0.82
    }
  }

  const curCase = getCurrentCase()
  const targetY = curCase?.map?.getHeightAt ? curCase.map.getHeightAt(player.position.x, player.position.z) : 0
  player.position.y = lerp(player.position.y, targetY, 1 - Math.exp(-24 * dt))

  const zn = zoneAt(player.position.x, player.position.z)
  const prefix = (getCurrentCase()?.subtitle || '雾杉镇') + ' · '
  const curArea = zn ? zn.n : '郊野'
  const fullArea = prefix + curArea
  const areaName = $('areaName')
  if (areaName && areaName.textContent !== fullArea) {
    areaName.textContent = fullArea
    if (zn && !G.zones[zn.id]) {
      G.zones[zn.id] = 1
      gainXP(10, '发现新区域 · ' + zn.n)
    }
  }
}

export function pendingCheck(): void {
  if (pendingI) {
    const it = ITAB[pendingI]
    if (!it) {
      pendingI = null
      return
    }
    const p = it.mesh.getWorldPosition(new THREE.Vector3())
    const maxD = pendingI === 'fountain' ? 3.6 : 2.8
    if (dist2(player.position.x, player.position.z, p.x, p.z) < maxD) {
      const id = pendingI
      pendingI = null
      path = []
      useInteract(id)
    }
  }
}

export const ray = new THREE.Raycaster()
export const mouseV = new THREE.Vector2()
export let hoverId: string | null = null
export let scanning = false
export const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)

export function setScanning(val: boolean): void {
  scanning = val
  const scanTint = $('scanTint')
  const scanTip = $('scanTip')
  const btnScan = $('btnHudScan')
  if (scanTint) scanTint.classList.toggle('on', val)
  if (scanTip) scanTip.classList.toggle('on', val)
  if (btnScan) btnScan.classList.toggle('active', val)
}

export function pickInteract(e: MouseEvent | PointerEvent): string | null {
  mouseV.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1)
  ray.setFromCamera(mouseV, camera)
  const vis = interactMeshes.filter(m => m.visible && ITAB[m.userData.iid] && !ITAB[m.userData.iid].hidden)
  const hits = ray.intersectObjects(vis, true)
  for (const h of hits) {
    let o: THREE.Object3D | null = h.object
    while (o && !o.userData.iid) {
      o = o.parent
    }
    if (o) {
      return o.userData.iid
    }
  }
  return null
}

export function flavor(id: string, txt: string): void {
  if (!G.flavorXP[id]) {
    G.flavorXP[id] = 1
    gainXP(5, '探索发现')
  }
  toast(txt)
}

export function useInteract(id: string): void {
  sfx('click')
  if (id in NPCS) {
    const d = NPCS[id]
    d.mesh.rotation.y = Math.atan2(player.position.x - d.pos[0], player.position.z - d.pos[1])
    startDialogue(id)
    return
  }
  if (id === 'board') {
    unfocusInspection()
    openBoard()
    return
  }

  const it = ITAB[id]
  if (it && it.mesh && it.kind !== 'board') {
    const p = it.mesh.getWorldPosition(new THREE.Vector3())
    const curCase = getCurrentCase()
    const shots = curCase?.map?.inspectShots
    const shot = shots ? shots[id] : undefined
    focusInspection(p, shot)
  }

  const curCase = getCurrentCase()
  if (curCase && curCase.map && curCase.map.onInteract) {
    curCase.map.onInteract(id, {
      G,
      player,
      addClue,
      addItem,
      setFlag,
      hasFlag,
      checkFX: (attr: AttrKey, dc: number) => checkFX(attr, dc),
      failFX: (attr: AttrKey, dc: number, msg?: string) => failFX(attr, dc, msg),
      flavor,
      toast,
      sfx,
      refreshObjectives,
    })
  }
}

export function initControlsEvents(): void {
  camera.position.set(0, 28, 26)
  renderer.domElement.addEventListener('pointermove', (e: PointerEvent) => {
    if (modalOpen()) {
      return
    }
    hoverId = pickInteract(e)
    renderer.domElement.style.cursor = hoverId ? 'pointer' : 'default'
    for (const k in NPCS) {
      const ring = NPCS[k]?.ring
      if (ring) {
        const mt = ring.material
        if (!Array.isArray(mt) && 'opacity' in mt) {
          mt.opacity = hoverId === k ? 0.6 : 0
        }
      }
    }
  })

  renderer.domElement.addEventListener('contextmenu', e => e.preventDefault())

  renderer.domElement.addEventListener('pointerdown', (e: PointerEvent) => {
    if (isCutsceneActive()) {
      skipCutscene()
      return
    }
    if (!G.started || modalOpen()) {
      return
    }
    if (dlgOpen()) {
      advanceDialogue()
      return
    }
    if (isInspectionActive()) {
      unfocusInspection()
    }
    const iid = pickInteract(e)
    if (iid) {
      const it = ITAB[iid]
      if (it) {
        const p = it.mesh.getWorldPosition(new THREE.Vector3())
        const maxD = iid === 'fountain' ? 3.6 : 2.8
        if (dist2(player.position.x, player.position.z, p.x, p.z) < maxD) {
          useInteract(iid)
        } else {
          pendingI = iid
          if (iid in NPCS) {
            const dx = p.x - player.position.x
            const dz = p.z - player.position.z
            const dist = Math.hypot(dx, dz)
            const stopDist = 1.35
            const tx = dist > stopDist ? p.x - (dx / dist) * stopDist : player.position.x
            const tz = dist > stopDist ? p.z - (dz / dist) * stopDist : player.position.z
            moveTo(tx, tz)
          } else {
            moveTo(p.x, p.z)
          }
        }
        return
      }
    }
    if (e.button === 0 || e.button === 2) {
      mouseV.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1)
      ray.setFromCamera(mouseV, camera)
      const pt = new THREE.Vector3()
      const clickPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -player.position.y)
      if (ray.ray.intersectPlane(clickPlane, pt)) {
        moveTo(pt.x, pt.z)
      }
    }
  })

  addEventListener('wheel', e => {
    if (modalOpen() || G.verdict || isCutsceneActive() || dlgOpen() || isInspectionActive()) {
      return
    }
    setCamZoom(camZoom + e.deltaY * 0.0008)
  })

  addEventListener('keydown', e => {
    if (isCutsceneActive()) {
      if (e.key === ' ' || e.key === 'Enter' || e.key === 'Escape') {
        e.preventDefault()
        skipCutscene()
      }
      return
    }
    if (e.key === 'Escape') {
      if (isInspectionActive()) {
        unfocusInspection()
      }
      if (modalOpen()) {
        closeModal(uiStack[uiStack.length - 1])
      } else if (dlgOpen()) {
        endDialogue()
      } else {
        togglePause()
      }
      return
    }
    if (e.key === 'Tab') {
      e.preventDefault()
      setScanning(true)
      return
    }
    if (modalOpen() || !G.started) {
      return
    }
    if (dlgOpen()) {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault()
        advanceDialogue()
        return
      }
      const n = parseInt(e.key)
      if (n >= 1 && n <= 9) {
        handleDialogueKey(n)
        return
      }
      return
    }
    const k = e.key.toLowerCase()
    if ('wasd'.includes(k)) {
      if (isInspectionActive()) {
        unfocusInspection()
      }
      wKeys[k] = 1
      path = []
      pendingI = null
    }
    if (k === 'b') {
      if (uiStack[uiStack.length - 1] === 'boardModal') {
        closeModal('boardModal')
      } else {
        openBoard()
      }
    }
    if (k === 'i') {
      if (uiStack[uiStack.length - 1] === 'invModal') {
        closeModal('invModal')
      } else {
        openInv()
      }
    }
    if (k === 'h') {
      if (uiStack[uiStack.length - 1] === 'historyModal') {
        closeModal('historyModal')
      } else {
        openHist()
      }
    }
    if (k === 'm') {
      setMusic(!G.musicOn)
      toast(G.musicOn ? '音乐：开' : '音乐：关')
    }
  })

  addEventListener('keyup', e => {
    if (e.key === 'Tab') {
      setScanning(false)
    }
    const k = e.key.toLowerCase()
    if ('wasd'.includes(k)) {
      wKeys[k] = 0
    }
  })

  const btnScan = $('btnHudScan')
  if (btnScan) {
    btnScan.onclick = e => {
      e.stopPropagation()
      setScanning(!scanning)
    }
  }

  const btnBoard = $('btnHudBoard')
  if (btnBoard) {
    btnBoard.onclick = e => {
      e.stopPropagation()
      if (uiStack[uiStack.length - 1] === 'boardModal') {
        closeModal('boardModal')
      } else {
        openBoard()
      }
    }
  }

  const btnInv = $('btnHudInv')
  if (btnInv) {
    btnInv.onclick = e => {
      e.stopPropagation()
      if (uiStack[uiStack.length - 1] === 'invModal') {
        closeModal('invModal')
      } else {
        openInv()
      }
    }
  }

  const btnHist = $('btnHudHist')
  if (btnHist) {
    btnHist.onclick = e => {
      e.stopPropagation()
      if (uiStack[uiStack.length - 1] === 'historyModal') {
        closeModal('historyModal')
      } else {
        openHist()
      }
    }
  }

  const btnMenu = $('btnHudMenu')
  if (btnMenu) {
    btnMenu.onclick = e => {
      e.stopPropagation()
      if (modalOpen()) {
        closeModal(uiStack[uiStack.length - 1])
      } else if (dlgOpen()) {
        endDialogue()
      } else {
        togglePause()
      }
    }
  }
}
