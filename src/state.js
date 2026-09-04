import { sfx } from './audio.js'
import { openLevelup, refreshHUD, refreshObjectives } from './ui.js'
import { $, ATTR_LABELS } from './utils.js'
import { getCurrentCase } from './cases/caseManager.js'

export const G = {
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
  started: false,
  musicOn: true,
  voiceOn: true,
}

export const xpNeed = l => 50 + (l - 1) * 45

export function hasFlag(k) {
  return !G.flags[k] ? false : !!G.flags[k]
}

export function setFlag(k, v) {
  G.flags[k] = v === undefined ? true : v
  watchForeshadow(k)
}

export let uiStack = []

export function openModal(id) {
  $(id).classList.add('on')
  if (!uiStack.includes(id)) {
    uiStack.push(id)
  }
}

export function closeModal(id) {
  $(id).classList.remove('on')
  uiStack = uiStack.filter(x => x !== id)
}

export function initModalEvents() {
  document.querySelectorAll('.pclose').forEach(e => {
    e.onclick = () => closeModal(e.dataset.close)
  })
}

export const modalOpen = () => uiStack.length > 0
export const dlgOpen = () => document.body.classList.contains('dlg')

export function toast(txt, cls) {
  const d = document.createElement('div')
  d.className = 'toast' + (cls ? ' ' + cls : '')
  d.textContent = txt
  $('toasts').appendChild(d)
  setTimeout(() => d.remove(), 4200)
}

export function banner(t1, t2, dur) {
  const b = $('banner')
  b.querySelector('.b1').textContent = t1
  b.querySelector('.b2').textContent = t2 || ''
  b.classList.add('on')
  setTimeout(() => b.classList.remove('on'), dur || 3200)
}

export function confirmBox(txt, onYes) {
  $('cfText').innerHTML = txt
  openModal('confirmModal')
  $('cfYes').onclick = () => {
    closeModal('confirmModal')
    onYes()
  }
  $('cfNo').onclick = () => closeModal('confirmModal')
}

export function checkFX(attr, dc) {
  G.checks++
  const cr = $('checkRoll')
  cr.querySelector('.cr1').textContent = `${ ATTR_LABELS[attr] } 检定（需求 ${ dc }）`
  cr.querySelector('.cr2').textContent = `${ G.attrs[attr] } · 检定通过`
  cr.classList.remove('on')
  void cr.offsetWidth
  cr.classList.add('on')
  sfx('check')
}

export function failFX(attr, dc, msg) {
  toast(msg || `【${ ATTR_LABELS[attr] }】未达标（需 ${ dc }）`)
  sfx('fail')
}

export function gainXP(n, why) {
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

export function addClue(id, silent) {
  if (G.clues.includes(id)) {
    return
  }
  G.clues.push(id)
  const curCase = getCurrentCase()
  const c = curCase && curCase.clues ? curCase.clues[id] : null
  if (!silent && c) {
    sfx('clue')
    showClueCard(c)
    gainXP(15, '获得线索')
    if (curCase.items && curCase.items[id] && !G.inventory.includes(id)) {
      G.inventory.push(id)
    }
  }
  foreshadowOnClue(id)
  refreshObjectives()
}

export function addItem(id) {
  if (!G.inventory.includes(id)) {
    G.inventory.push(id)
  }
}

export function removeItem(id) {
  G.inventory = G.inventory.filter(x => x !== id)
}

let cluePopT = null

export function showClueCard(c) {
  const p = $('cluePop')
  p.querySelector('.ct').textContent = c.icon + ' ' + c.name
  p.querySelector('.cd').textContent = c.short
  p.querySelector('.tags').innerHTML = c.tags.map(t => `<span class="tag">${ t }</span>`).join('')
  p.classList.add('on')
  clearTimeout(cluePopT)
  cluePopT = setTimeout(() => p.classList.remove('on'), 3600)
}

export function watchForeshadow(k) {
  const curCase = getCurrentCase()
  if (curCase && curCase.map && curCase.map.onFlagChange) {
    curCase.map.onFlagChange(k, G.flags[k], { G, setFlag, hasFlag, toast, sfx, refreshObjectives })
  }
}

export function foreshadowOnClue(clueId) {
  const curCase = getCurrentCase()
  if (curCase && curCase.map && curCase.map.onClueAdded) {
    curCase.map.onClueAdded(clueId, { G, setFlag, hasFlag, toast, sfx })
  }
}

export function resetCaseState() {
  G.flags = {}
  G.clues = []
  G.inventory = []
  G.zones = {}
  G.talked = {}
  G.board = { killer: null, weapon: null, motive: null, method: null }
  G.history = []
  G.verdict = null
  G.flavorXP = {}
  G.checks = 0
}
