import { isVoicePlaying, playVoice, sfx, stopVoice } from './audio'
import { setTimeScaleT } from './controls'
import { G, toast } from './state'
import { refreshObjectives } from './ui'
import { $, ATTR_LABELS } from './utils'
import { NPCS } from './world'
import { getCurrentCase } from './cases/caseManager'
import { focusDialogue, unfocusDialogue } from './camera'
import type { AttrKey, DialogueChoice, DialogueNode, DialogueTree, NpcProfile } from './types'

export interface DialogueSessionState {
  npc: string
  isTyping: boolean
  choices: DialogueChoice[]
  D?: DialogueTree
  node?: DialogueNode
}

export let dlgState: DialogueSessionState | null = null
let typeTimer: ReturnType<typeof setInterval> | null = null
let typeFull = ''
let typeIdx = 0
export let lastDlgNpc = ''

export const NPC_PROFILES: Record<string, NpcProfile> = new Proxy({} as Record<string, NpcProfile>, {
  get(target, prop: string) {
    const cur = getCurrentCase()
    if (cur && cur.dialogue && cur.dialogue.profiles) {
      return cur.dialogue.profiles[prop]
    }
    return target[prop]
  },
  has(target, prop: string) {
    const cur = getCurrentCase()
    if (cur && cur.dialogue && cur.dialogue.profiles) {
      return prop in cur.dialogue.profiles
    }
    return prop in target
  },
})

export function hist(sp: string, tx: string): void {
  G.history.push({ s: sp, t: tx })
  if (G.history.length > 20) {
    G.history.shift()
  }
}

export function startDialogue(id: string): void {
  lastDlgNpc = id
  dlgState = { npc: id, isTyping: false, choices: [] }
  document.body.classList.add('dlg')
  setTimeScaleT(0.15)
  focusDialogue(id)
  const curCase = getCurrentCase()
  const trees = curCase && curCase.dialogue ? curCase.dialogue.trees : null
  const D = trees && trees[id] ? trees[id]() : null
  if (!D) {
    endDialogue()
    return
  }
  goNode(D, D.start)
}

export function goNode(D: DialogueTree, nid: string): void {
  const node = D.nodes[nid]
  if (!node) {
    endDialogue()
    return
  }
  if (!dlgState) {
    return
  }
  dlgState.D = D
  dlgState.node = node
  dlgState.isTyping = true
  dlgState.choices = []

  const box = $('dlgChoices')
  if (box) {
    box.innerHTML = ''
  }

  const sp = node.sp || (NPCS[dlgState.npc] ? NPCS[dlgState.npc].n : dlgState.npc)
  const dlgSpeaker = $('dlgSpeaker')
  if (dlgSpeaker) {
    dlgSpeaker.textContent = sp
  }

  const roleEl = $('dlgSpeakerRole')
  if (roleEl) {
    const prof = NPC_PROFILES[dlgState.npc]
    if (prof) {
      roleEl.textContent = `[ ${ prof.title } ]`
      roleEl.style.display = 'inline'
    } else {
      roleEl.style.display = 'none'
    }
  }

  const hintEl = $('dlgSkipHint')
  if (hintEl) {
    hintEl.textContent = '[ 空格 / 点击快进 ]'
    hintEl.classList.remove('ready')
  }

  hist(sp, node.tx)
  typeFull = node.tx
  typeIdx = 0
  const dlgText = $('dlgText')
  if (dlgText) {
    dlgText.textContent = ''
  }

  const curCase = getCurrentCase()
  const findVoiceUrl = curCase?.dialogue?.findVoiceUrl
  const voiceUrl = node.voiceUrl || (findVoiceUrl ? findVoiceUrl(node.tx) : null)
  if (voiceUrl) {
    playVoice(voiceUrl)
  } else {
    stopVoice()
  }

  if (typeTimer !== null) {
    clearInterval(typeTimer)
  }
  typeTimer = setInterval(() => {
    typeIdx += 2
    const dtEl = $('dlgText')
    if (dtEl) {
      dtEl.textContent = typeFull.slice(0, typeIdx)
    }
    if (typeIdx % 6 === 0 && !isVoicePlaying()) {
      sfx('tick')
    }
    if (typeIdx >= typeFull.length) {
      if (typeTimer !== null) {
        clearInterval(typeTimer)
        typeTimer = null
      }
      finishType(node)
    }
  }, 24)
}

function finishType(node: DialogueNode): void {
  if (!dlgState) return
  dlgState.isTyping = false
  const dlgText = $('dlgText')
  if (dlgText) {
    dlgText.textContent = typeFull
  }
  renderChoices(node)

  const hintEl = $('dlgSkipHint')
  if (hintEl) {
    const chLen = (dlgState.choices || []).length
    if (chLen === 0) {
      hintEl.textContent = '[ 空格 / 点击结束 ]'
    } else if (chLen === 1) {
      hintEl.textContent = '[ 空格 / 回车继续 ]'
    } else {
      hintEl.textContent = '[ 选项 1 - ' + chLen + ' ]'
    }
    hintEl.classList.add('ready')
  }
}

export function skipType(): void {
  if (dlgState && dlgState.isTyping && dlgState.node) {
    if (typeTimer !== null) {
      clearInterval(typeTimer)
      typeTimer = null
    }
    typeIdx = typeFull.length
    finishType(dlgState.node)
  }
}

export function advanceDialogue(): void {
  if (!dlgState) {
    return
  }
  if (dlgState.isTyping) {
    skipType()
    return
  }
  const chs = dlgState.choices || []
  if (chs.length === 0) {
    endDialogue()
  } else if (chs.length === 1) {
    selectChoice(chs[0])
  }
}

function selectChoice(c: DialogueChoice): void {
  if (!dlgState) return
  if (c.req) {
    const entries = Object.entries(c.req) as Array<[AttrKey, number]>
    if (entries.length > 0) {
      const [k, v] = entries[0]
      if (G.attrs[k] < v) {
        sfx('fail')
        toast(`【${ ATTR_LABELS[k] }】检定未达标（需 ${ v }）`)
        return
      }
    }
  }
  sfx('click')
  stopVoice()
  const cleanTx = c.t.replace(/【.*?】/g, '').replace(/^\(.*?\)\s*/, '')
  hist('你', cleanTx)
  if (c.act) {
    c.act()
  }
  if (c.next && dlgState.D) {
    goNode(dlgState.D, c.next)
  } else {
    endDialogue()
  }
}

export function renderChoices(node: DialogueNode): void {
  if (!dlgState) return
  const box = $('dlgChoices')
  if (!box) return
  box.innerHTML = ''
  const list = (node.ch || []).filter(c => !c.cond || c.cond())
  list.forEach((c, i) => {
    const d = document.createElement('div')
    d.className = 'chc'
    let reqHtml = ''
    if (c.req) {
      const entries = Object.entries(c.req) as Array<[AttrKey, number]>
      if (entries.length > 0) {
        const [k, v] = entries[0]
        const ok = G.attrs[k] >= v
        reqHtml = `<span class="req ${ ok ? 'ok' : '' }">[ ${ ATTR_LABELS[k] } ${ G.attrs[k] }/${ v } ]</span>`
        if (!ok) {
          d.classList.add('locked')
        }
      }
    }
    const cleanText = c.t.replace(/^【.*?】\s*/, '').replace(/^\(.*?\)\s*/, '')
    d.innerHTML = `
      <span class="num">${ i + 1 }.</span>
      <span class="chc-txt">${ cleanText }</span>
      ${ reqHtml }`
    d.onclick = (e) => {
      e.stopPropagation()
      if (d.classList.contains('locked')) {
        sfx('fail')
        toast('属性检定未达标，此项已锁定')
        return
      }
      selectChoice(c)
    }
    box.appendChild(d)
  })
  dlgState.choices = list
}

export function endDialogue(): void {
  stopVoice()
  if (typeTimer !== null) {
    clearInterval(typeTimer)
    typeTimer = null
  }
  document.body.classList.remove('dlg')
  setTimeScaleT(1)
  unfocusDialogue()
  dlgState = null
  if (lastDlgNpc) {
    G.talked[lastDlgNpc] = 1
  }
  refreshObjectives()
  const box = $('dlgChoices')
  if (box) {
    box.innerHTML = ''
  }
}

export function handleDialogueKey(num: number): boolean {
  if (!dlgState) {
    return false
  }
  if (dlgState.isTyping) {
    skipType()
  }
  if (dlgState.choices && num >= 1 && num <= dlgState.choices.length) {
    const c = dlgState.choices[num - 1]
    selectChoice(c)
    return true
  }
  return false
}

export function initDialogueDOMEvents(): void {
  const box = $('dlgBox')
  if (box) {
    box.addEventListener('click', (e) => {
      const target = e.target as HTMLElement | null
      if (target && target.closest('.chc')) {
        return
      }
      advanceDialogue()
    })
  }
}
