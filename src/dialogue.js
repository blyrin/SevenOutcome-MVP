import { isVoicePlaying, playVoice, sfx, stopVoice } from './audio.js'
import { setTimeScaleT } from './controls.js'
import { G, toast } from './state.js'
import { refreshObjectives } from './ui.js'
import { $, ATTR_LABELS } from './utils.js'
import { NPCS } from './world.js'
import { getCurrentCase } from './cases/caseManager.js'

export let dlgState = null
let typeTimer = null
let typeFull = ''
let typeIdx = 0
export let lastDlgNpc = ''

export const NPC_PROFILES = new Proxy({}, {
  get(target, prop) {
    const cur = getCurrentCase()
    if (cur && cur.dialogue && cur.dialogue.profiles) {
      return cur.dialogue.profiles[prop]
    }
    return target[prop]
  },
  has(target, prop) {
    const cur = getCurrentCase()
    if (cur && cur.dialogue && cur.dialogue.profiles) {
      return prop in cur.dialogue.profiles
    }
    return prop in target
  },
})

export function hist(sp, tx) {
  G.history.push({ s: sp, t: tx })
  if (G.history.length > 20) {
    G.history.shift()
  }
}

export function startDialogue(id) {
  lastDlgNpc = id
  dlgState = { npc: id, isTyping: false, choices: [] }
  document.body.classList.add('dlg')
  setTimeScaleT(0.15)
  const curCase = getCurrentCase()
  const trees = curCase && curCase.dialogue ? curCase.dialogue.trees : null
  const D = trees && trees[id] ? trees[id]() : null
  if (!D) {
    endDialogue()
    return
  }
  goNode(D, D.start)
}

export function goNode(D, nid) {
  const node = D.nodes[nid]
  if (!node) {
    endDialogue()
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

  const sp = node.sp || NPCS[dlgState.npc].n
  $('dlgSpeaker').textContent = sp

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
  $('dlgText').textContent = ''

  const curCase = getCurrentCase()
  const findVoiceUrl = curCase?.dialogue?.findVoiceUrl
  const voiceUrl = node.voiceUrl || (findVoiceUrl ? findVoiceUrl(node.tx) : null)
  if (voiceUrl) {
    playVoice(voiceUrl)
  } else {
    stopVoice()
  }

  clearInterval(typeTimer)
  typeTimer = setInterval(() => {
    typeIdx += 2
    $('dlgText').textContent = typeFull.slice(0, typeIdx)
    if (typeIdx % 6 === 0 && !isVoicePlaying()) {
      sfx('tick')
    }
    if (typeIdx >= typeFull.length) {
      clearInterval(typeTimer)
      finishType(node)
    }
  }, 24)
}

function finishType(node) {
  dlgState.isTyping = false
  $('dlgText').textContent = typeFull
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

export function skipType() {
  if (dlgState && dlgState.isTyping) {
    clearInterval(typeTimer)
    typeIdx = typeFull.length
    finishType(dlgState.node)
  }
}

export function advanceDialogue() {
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

function selectChoice(c) {
  if (c.req) {
    const [k, v] = Object.entries(c.req)[0]
    if (G.attrs[k] < v) {
      sfx('fail')
      toast(`【${ ATTR_LABELS[k] }】检定未达标（需 ${ v }）`)
      return
    }
  }
  sfx('click')
  stopVoice()
  const cleanTx = c.t.replace(/【.*?】/g, '').replace(/^\(.*?\)\s*/, '')
  hist('你', cleanTx)
  if (c.act) {
    c.act()
  }
  if (c.next) {
    goNode(dlgState.D, c.next)
  } else {
    endDialogue()
  }
}

export function renderChoices(node) {
  const box = $('dlgChoices')
  box.innerHTML = ''
  const list = (node.ch || []).filter(c => !c.cond || c.cond())
  list.forEach((c, i) => {
    const d = document.createElement('div')
    d.className = 'chc'
    let reqHtml = ''
    if (c.req) {
      const [k, v] = Object.entries(c.req)[0]
      const ok = G.attrs[k] >= v
      reqHtml = `<span class="req ${ ok ? 'ok' : '' }">[ ${ ATTR_LABELS[k] } ${ G.attrs[k] }/${ v } ]</span>`
      if (!ok) {
        d.classList.add('locked')
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

export function endDialogue() {
  stopVoice()
  clearInterval(typeTimer)
  document.body.classList.remove('dlg')
  setTimeScaleT(1)
  dlgState = null
  G.talked[lastDlgNpc] = 1
  refreshObjectives()
  const box = $('dlgChoices')
  if (box) {
    box.innerHTML = ''
  }
}

export function handleDialogueKey(num) {
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

export function initDialogueDOMEvents() {
  const box = $('dlgBox')
  if (box) {
    box.addEventListener('click', (e) => {
      if (e.target.closest('.chc')) {
        return
      }
      advanceDialogue()
    })
  }
}
