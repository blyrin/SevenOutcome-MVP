import { caseBlacksmith } from './blacksmith'
import { caseManor } from './manor'
import { clearWorldObjects, player, resetGrid, scene } from '../world'
import { playBgm } from '../audio'
import { resetCaseState } from '../state'
import { setupCaseUI } from '../ui'
import type { CaseDefinition } from '../types'

export const registry: Record<string, CaseDefinition> = {
  blacksmith: caseBlacksmith,
  manor: caseManor,
}

export let currentCase: CaseDefinition | null = null

export function getCurrentCase(): CaseDefinition {
  return currentCase || caseBlacksmith
}

export function getAllCases(): Record<string, CaseDefinition> {
  return registry
}

export function loadCase(caseDef: CaseDefinition | string): CaseDefinition | null {
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
