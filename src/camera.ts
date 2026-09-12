import * as THREE from 'three'
import { camera, NPCS, player } from './world'
import { $, clamp } from './utils'
import { getCurrentScene } from './cases/caseManager'
import type { CutsceneDefinition, CutsceneShot, InspectShot } from './types'

export type CameraMode = 'follow' | 'dialogue' | 'cutscene' | 'transition' | 'inspection'

export const camOff = new THREE.Vector3(0, 23, 14)
export let camZoom = 1

export function setCamZoom(z: number): void {
  camZoom = clamp(z, 0.65, 1.7)
}

export const currentLookTarget = new THREE.Vector3(0, 1, 10)

let camMode: CameraMode = 'follow'
let dialogueNpcId: string | null = null

const inspectCamTarget = new THREE.Vector3()
const inspectLookTarget = new THREE.Vector3()
let inspectAutoTimer: ReturnType<typeof setTimeout> | null = null

let activeCutscene: CutsceneDefinition | null = null
let cutsceneShotIdx = 0
let shotElapsed = 0
let cutsceneOnComplete: (() => void) | null = null

let transitionElapsed = 0
let transitionDuration = 0.45
const transitionFromPos = new THREE.Vector3()
const transitionFromLook = new THREE.Vector3()

export function getCameraMode(): CameraMode {
  return camMode
}

export function isCutsceneActive(): boolean {
  return camMode === 'cutscene' || (camMode === 'transition' && activeCutscene !== null)
}

export function isDialogueActive(): boolean {
  return camMode === 'dialogue'
}

export function isInspectionActive(): boolean {
  return camMode === 'inspection'
}

export function snapCamera(): void {
  const target = new THREE.Vector3().copy(player.position)
    .add(new THREE.Vector3(camOff.x * camZoom, camOff.y * camZoom, camOff.z * camZoom))
  camera.position.copy(target)
  currentLookTarget.set(player.position.x, player.position.y + 1, player.position.z)
  camera.lookAt(currentLookTarget)
}

export function focusDialogue(npcId: string): void {
  if (inspectAutoTimer) {
    clearTimeout(inspectAutoTimer)
    inspectAutoTimer = null
  }
  dialogueNpcId = npcId
  camMode = 'dialogue'
  const npc = NPCS[npcId]
  if (npc) {
    const npcWorldPos = new THREE.Vector3()
    if (npc.mesh) {
      npc.mesh.getWorldPosition(npcWorldPos)
    } else {
      npcWorldPos.set(npc.pos[0], player.position.y, npc.pos[1])
    }
    const dx = npcWorldPos.x - player.position.x
    const dz = npcWorldPos.z - player.position.z
    if (Math.hypot(dx, dz) > 0.05) {
      player.rotation.y = Math.atan2(dx, dz)
      if (npc.mesh) {
        npc.mesh.rotation.y = Math.atan2(-dx, -dz)
      }
    }
  }
}

export function unfocusDialogue(): void {
  dialogueNpcId = null
  if (camMode === 'dialogue') {
    startTransitionToFollow(1.15)
  }
}

export function focusInspection(targetPos: THREE.Vector3, shot?: InspectShot): void {
  if (inspectAutoTimer) {
    clearTimeout(inspectAutoTimer)
    inspectAutoTimer = null
  }

  const offset = shot?.offset || [0, 1.8, 2.0]
  const lookOffset = shot?.lookOffset || [0, 0.1, 0]

  inspectLookTarget.set(
    targetPos.x + lookOffset[0],
    targetPos.y + lookOffset[1],
    targetPos.z + lookOffset[2],
  )
  inspectCamTarget.set(
    targetPos.x + offset[0],
    targetPos.y + offset[1],
    targetPos.z + offset[2],
  )

  const dx = targetPos.x - player.position.x
  const dz = targetPos.z - player.position.z
  if (Math.hypot(dx, dz) > 0.05) {
    player.rotation.y = Math.atan2(dx, dz)
  }

  camMode = 'inspection'

  inspectAutoTimer = setTimeout(() => {
    if (camMode === 'inspection') {
      unfocusInspection()
    }
  }, 4200)
}

export function unfocusInspection(): void {
  if (inspectAutoTimer) {
    clearTimeout(inspectAutoTimer)
    inspectAutoTimer = null
  }
  if (camMode === 'inspection') {
    startTransitionToFollow(1.15)
  }
}

function showShotUI(shot: CutsceneShot): void {
  const content = document.querySelector('.cinematic-content')
  const badgeEl = $('cinematicBadge')
  const titleEl = $('cinematicTitle')
  const locEl = $('cinematicLocation')
  const capEl = $('cinematicCaption')

  if (content) {
    content.classList.remove('visible')
  }

  setTimeout(() => {
    if (badgeEl) {
      const cur = getCurrentScene()
      badgeEl.textContent = cur?.meta?.chapterTag || 'CASE FILE'
    }
    if (titleEl) {
      if (shot.title) {
        titleEl.textContent = shot.title
        titleEl.style.display = 'block'
      } else {
        titleEl.style.display = 'none'
      }
    }
    if (locEl) {
      if (shot.location) {
        locEl.textContent = shot.location
        locEl.style.display = 'inline-flex'
      } else {
        locEl.style.display = 'none'
      }
    }
    if (capEl) {
      if (shot.caption) {
        capEl.textContent = shot.caption
        capEl.style.display = 'block'
      } else {
        capEl.style.display = 'none'
      }
    }
    if (content) {
      content.classList.add('visible')
    }
  }, 100)
}

function hideCutsceneUI(): void {
  const content = document.querySelector('.cinematic-content')
  if (content) {
    content.classList.remove('visible')
  }
  const overlay = $('cinematicOverlay')
  if (overlay) {
    overlay.style.opacity = '0'
    setTimeout(() => {
      overlay.style.opacity = ''
    }, 380)
  }
}

function startTransitionToFollow(duration = 0.95): void {
  camMode = 'transition'
  transitionElapsed = 0
  transitionDuration = duration
  transitionFromPos.copy(camera.position)
  transitionFromLook.copy(currentLookTarget)
  document.body.classList.remove('cinematic')
}

export function playOpeningCutscene(def: CutsceneDefinition, onComplete?: () => void): void {
  if (!def || !def.shots || def.shots.length === 0) {
    if (onComplete) onComplete()
    return
  }
  activeCutscene = def
  cutsceneShotIdx = 0
  shotElapsed = 0
  cutsceneOnComplete = onComplete || null
  camMode = 'cutscene'
  document.body.classList.add('cinematic')

  const shot = def.shots[0]
  camera.position.set(...shot.posFrom)
  currentLookTarget.set(...shot.lookFrom)
  camera.lookAt(currentLookTarget)

  showShotUI(shot)
}

export function skipCutscene(): void {
  if (camMode !== 'cutscene') {
    return
  }
  hideCutsceneUI()
  startTransitionToFollow(0.65)
}

export function updateCamera(dt: number, now: number): void {
  if (camMode === 'transition') {
    transitionElapsed += dt
    const rawT = clamp(transitionElapsed / transitionDuration, 0, 1)
    const t = rawT * rawT * (3 - 2 * rawT)

    const followTargetPos = new THREE.Vector3().copy(player.position)
      .add(new THREE.Vector3(camOff.x * camZoom, camOff.y * camZoom, camOff.z * camZoom))
    const followTargetLook = new THREE.Vector3(player.position.x, player.position.y + 1, player.position.z)

    camera.position.lerpVectors(transitionFromPos, followTargetPos, t)
    currentLookTarget.lerpVectors(transitionFromLook, followTargetLook, t)
    camera.lookAt(currentLookTarget)

    if (rawT >= 1) {
      camMode = 'follow'
      const cb = cutsceneOnComplete
      cutsceneOnComplete = null
      activeCutscene = null
      if (cb) {
        cb()
      }
    }
    return
  }

  if (camMode === 'cutscene' && activeCutscene) {
    shotElapsed += dt
    const shot = activeCutscene.shots[cutsceneShotIdx]
    const rawT = clamp(shotElapsed / shot.duration, 0, 1)

    let t = rawT
    if (shot.easing === 'linear') {
      t = rawT
    } else if (shot.easing === 'easeOut') {
      t = 1 - Math.pow(1 - rawT, 3)
    } else if (shot.easing === 'easeIn') {
      t = Math.pow(rawT, 3)
    } else {
      t = rawT * rawT * (3 - 2 * rawT)
    }

    const pFrom = new THREE.Vector3(...shot.posFrom)
    const pTo = new THREE.Vector3(...shot.posTo)
    const lFrom = new THREE.Vector3(...shot.lookFrom)
    const lTo = new THREE.Vector3(...shot.lookTo)

    camera.position.lerpVectors(pFrom, pTo, t)
    currentLookTarget.lerpVectors(lFrom, lTo, t)
    camera.lookAt(currentLookTarget)

    if (rawT >= 1) {
      cutsceneShotIdx++
      if (cutsceneShotIdx < activeCutscene.shots.length) {
        shotElapsed = 0
        showShotUI(activeCutscene.shots[cutsceneShotIdx])
      } else {
        hideCutsceneUI()
        startTransitionToFollow(0.9)
      }
    }
    return
  }

  if (camMode === 'dialogue' && dialogueNpcId && NPCS[dialogueNpcId]) {
    const npc = NPCS[dialogueNpcId]
    const npcWorldPos = new THREE.Vector3()
    if (npc.mesh) {
      npc.mesh.getWorldPosition(npcWorldPos)
    } else {
      npcWorldPos.set(npc.pos[0], player.position.y, npc.pos[1])
    }
    const pPos = player.position

    const dx = npcWorldPos.x - pPos.x
    const dz = npcWorldPos.z - pPos.z
    const dist = Math.hypot(dx, dz)
    const dirX = dist > 0.05 ? dx / dist : 0
    const dirZ = dist > 0.05 ? dz / dist : 1
    const sideX = -dirZ
    const sideZ = dirX

    const baseY = Math.max(npcWorldPos.y, pPos.y)
    const camY = baseY + 1.48
    const lookY = npcWorldPos.y + 1.25

    const breath = Math.sin(now * 0.001) * 0.025
    const breathY = Math.cos(now * 0.0008) * 0.012

    const camDist = 2.75
    const sideOffset = 0.82

    const targetPos = new THREE.Vector3(
      npcWorldPos.x - dirX * camDist + sideX * (sideOffset + breath),
      camY + breathY,
      npcWorldPos.z - dirZ * camDist + sideZ * (sideOffset + breath),
    )

    const targetLook = new THREE.Vector3(
      npcWorldPos.x - dirX * 0.15,
      lookY + breathY * 0.5,
      npcWorldPos.z - dirZ * 0.15,
    )

    camera.position.lerp(targetPos, 1 - Math.exp(-6.5 * dt))
    currentLookTarget.lerp(targetLook, 1 - Math.exp(-7.5 * dt))
    camera.lookAt(currentLookTarget)
    return
  }

  if (camMode === 'inspection') {
    const breath = Math.sin(now * 0.0009) * 0.02
    const breathY = Math.cos(now * 0.0007) * 0.012

    const targetPos = new THREE.Vector3(
      inspectCamTarget.x + breath,
      inspectCamTarget.y + breathY,
      inspectCamTarget.z + breath,
    )
    const targetLook = new THREE.Vector3(
      inspectLookTarget.x,
      inspectLookTarget.y + breathY * 0.4,
      inspectLookTarget.z,
    )

    camera.position.lerp(targetPos, 1 - Math.exp(-5.2 * dt))
    currentLookTarget.lerp(targetLook, 1 - Math.exp(-6.2 * dt))
    camera.lookAt(currentLookTarget)
    return
  }

  const target = new THREE.Vector3().copy(player.position)
    .add(new THREE.Vector3(camOff.x * camZoom, camOff.y * camZoom, camOff.z * camZoom))
  if (camera.position.distanceTo(target) > 35) {
    camera.position.copy(target)
    currentLookTarget.set(player.position.x, player.position.y + 1, player.position.z)
  } else {
    camera.position.lerp(target, 1 - Math.exp(-4.5 * dt))
    const lookTarget = new THREE.Vector3(player.position.x, player.position.y + 1, player.position.z)
    currentLookTarget.lerp(lookTarget, 1 - Math.exp(-6.5 * dt))
  }
  camera.lookAt(currentLookTarget)
}

export function initCameraEvents(): void {
  const overlay = $('cinematicOverlay')
  if (overlay) {
    overlay.onclick = (e) => {
      e.stopPropagation()
      skipCutscene()
    }
  }
}
