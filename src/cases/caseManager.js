import { caseBlacksmith } from './blacksmith/index.js'
import { clearWorldObjects, player, resetGrid, scene } from '../world.js'
import { playBgm } from '../audio.js'
import { resetCaseState } from '../state.js'
import { setupCaseUI } from '../ui.js'

export const registry = {
  blacksmith: caseBlacksmith,
}

export let currentCase = null

export function getCurrentCase() {
  return currentCase || caseBlacksmith
}

export function getAllCases() {
  return registry
}

export function loadCase(caseDef) {
  if (typeof caseDef === 'string') {
    caseDef = registry[caseDef]
  }
  if (!caseDef) {
    return null
  }
  clearWorldObjects()
  resetGrid()

  if (caseDef.meta && caseDef.meta.initialPlayerPos) {
    player.position.set(...caseDef.meta.initialPlayerPos)
  }

  if (caseDef.map && caseDef.map.setupMap) {
    caseDef.map.setupMap({ scene, player })
  }

  resetCaseState()
  currentCase = caseDef
  if (caseDef.audio && caseDef.audio.bgm) {
    playBgm(caseDef.audio.bgm)
  }
  setupCaseUI(currentCase)
  return currentCase
}
