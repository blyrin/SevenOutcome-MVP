import { sfx } from './audio'
import { openLevelup, refreshHUD, refreshObjectives } from './ui'
import { $, ATTR_LABELS } from './utils'
import { getCurrentCase, getCurrentScene } from './cases/caseManager'
import type { AttrKey, Clue, FlagValue, GameState } from './types'

export const G: GameState = {
  attrs: { int: 4, ins: 3, psy: 3, strw: 2, kno: 2 },
  xp: 0,
  level: 1,
  points: 0,
  checks: 0,
  flags: {},
  clues: [],
  inventory: [],
  zones: {},
  talked: {},
  board: { killer: null, weapon: null, motive: null, method: null },
  history: [],
  verdict: null,
  flavorXP: {},
  assignment: null,
  completedCases: [],
  daily: { date: '', offered: [], accepted: [], done: [] },
  started: false,
  musicOn: true,
  voiceOn: true,
}

export const xpNeed = (l: number): number => 50 + (l - 1) * 45

export function hasFlag(k: string): boolean {
  return !G.flags[k] ? false : !!G.flags[k]
}

export function setFlag(k: string, v?: FlagValue): void {
  G.flags[k] = v === undefined ? true : v
  watchForeshadow(k)
}

export let uiStack: string[] = []

export function openModal(id: string): void {
  const el = $(id)
  if (el) {
    el.classList.add('on')
  }
  if (!uiStack.includes(id)) {
    uiStack.push(id)
  }
}

export function closeModal(id: string): void {
  const el = $(id)
  if (el) {
    el.classList.remove('on')
  }
  uiStack = uiStack.filter(x => x !== id)
}

export function initModalEvents(): void {
  document.querySelectorAll<HTMLElement>('.pclose').forEach(e => {
    e.onclick = () => {
      const target = e.dataset.close
      if (target) {
        closeModal(target)
      }
    }
  })
}

export const modalOpen = (): boolean => uiStack.length > 0
export const dlgOpen = (): boolean => document.body.classList.contains('dlg')

export function toast(txt: string, cls?: string): void {
  const d = document.createElement('div')
  d.className = 'toast' + (cls ? ' ' + cls : '')
  d.textContent = txt
  const toasts = $('toasts')
  if (toasts) {
    toasts.appendChild(d)
  }
  setTimeout(() => d.remove(), 4200)
}

export function banner(t1: string, t2?: string, dur?: number): void {
  const b = $('banner')
  if (!b) return
  const b1 = b.querySelector('.b1')
  const b2 = b.querySelector('.b2')
  if (b1) b1.textContent = t1
  if (b2) b2.textContent = t2 || ''
  b.classList.add('on')
  setTimeout(() => b.classList.remove('on'), dur || 3200)
}

export function confirmBox(txt: string, onYes: () => void): void {
  const cfText = $('cfText')
  if (cfText) {
    cfText.innerHTML = txt
  }
  openModal('confirmModal')
  const cfYes = $('cfYes')
  if (cfYes) {
    cfYes.onclick = () => {
      closeModal('confirmModal')
      onYes()
    }
  }
  const cfNo = $('cfNo')
  if (cfNo) {
    cfNo.onclick = () => closeModal('confirmModal')
  }
}

export function checkFX(attr: AttrKey, dc: number): void {
  G.checks++
  const cr = $('checkRoll')
  if (!cr) return
  const cr1 = cr.querySelector('.cr1')
  const cr2 = cr.querySelector('.cr2')
  if (cr1) cr1.textContent = `${ ATTR_LABELS[attr] } 检定（需求 ${ dc }）`
  if (cr2) cr2.textContent = `${ G.attrs[attr] } · 检定通过`
  cr.classList.remove('on')
  void cr.offsetWidth
  cr.classList.add('on')
  sfx('check')
}

export function failFX(attr: AttrKey, dc: number, msg?: string): void {
  toast(msg || `【${ ATTR_LABELS[attr] }】未达标（需 ${ dc }）`)
  sfx('fail')
}

export function gainXP(n: number, why: string): void {
  G.xp += n
  toast(`+${ n } 经验 · ${ why }`, 'xp')
  let leveled = false
  while (G.xp >= xpNeed(G.level)) {
    G.xp -= xpNeed(G.level)
    G.level++
    G.points += 2
    leveled = true
  }
  if (leveled) {
    sfx('levelup')
    banner('特质提升', `已升至 Lv.${ G.level } · 获得 2 点属性点`, 2800)
    setTimeout(() => {
      if (!modalOpen()) {
        openLevelup()
      }
    }, 2900)
  }
  refreshHUD()
}

export function addClue(id: string, silent?: boolean): void {
  if (G.clues.includes(id)) {
    return
  }
  G.clues.push(id)
  const curCase = getCurrentCase()
  if (curCase && curCase.map && curCase.map.applyWorldFromFlags) {
    curCase.map.applyWorldFromFlags(G)
  }
  const c = curCase && curCase.clues ? curCase.clues[id] : null
  if (!silent && c) {
    sfx('clue')
    showClueCard(c)
    gainXP(15, '获得线索')
    if (curCase && curCase.items && curCase.items[id] && !G.inventory.includes(id)) {
      G.inventory.push(id)
    }
  }
  foreshadowOnClue(id)
  refreshObjectives()
}

export function addItem(id: string): void {
  if (!G.inventory.includes(id)) {
    G.inventory.push(id)
  }
}

export function removeItem(id: string): void {
  G.inventory = G.inventory.filter(x => x !== id)
}

let cluePopT: ReturnType<typeof setTimeout> | null = null

export function showClueCard(c: Clue): void {
  const p = $('cluePop')
  if (!p) return
  const ct = p.querySelector('.ct')
  const cd = p.querySelector('.cd')
  const tags = p.querySelector('.tags')
  if (ct) ct.textContent = c.icon + ' ' + c.name
  if (cd) cd.textContent = c.short
  if (tags) tags.innerHTML = c.tags.map(t => `<span class="tag">${ t }</span>`).join('')
  p.classList.add('on')
  if (cluePopT) {
    clearTimeout(cluePopT)
  }
  cluePopT = setTimeout(() => p.classList.remove('on'), 3600)
}

export function watchForeshadow(k: string): void {
  const curScene = getCurrentScene()
  if (curScene && curScene.map && curScene.map.onFlagChange) {
    curScene.map.onFlagChange(k, G.flags[k], { G, setFlag, hasFlag, toast, sfx, refreshObjectives })
  }
}

export function foreshadowOnClue(clueId: string): void {
  const curCase = getCurrentCase()
  if (curCase && curCase.map && curCase.map.onClueAdded) {
    curCase.map.onClueAdded(clueId, { G, setFlag, hasFlag, toast, sfx })
  }
}

export function resetCaseState(): void {
  const keepZones: Record<string, number> = {}
  for (const k in G.zones) {
    if (k.startsWith('hub_')) {
      keepZones[k] = G.zones[k]
    }
  }
  G.zones = keepZones
  const keepFlavor: Record<string, number> = {}
  for (const k in G.flavorXP) {
    if (k.startsWith('hub_')) {
      keepFlavor[k] = G.flavorXP[k]
    }
  }
  G.flavorXP = keepFlavor
  G.flags = {}
  G.clues = []
  G.inventory = []
  G.talked = {}
  G.board = { killer: null, weapon: null, motive: null, method: null }
  G.history = []
  G.verdict = null
  G.checks = 0
  G.assignment = null
}
