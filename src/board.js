import { sfx } from './audio.js'
import {
  checkFX, confirmBox, failFX, G, gainXP, hasFlag, modalOpen, openModal, setFlag, toast, watchForeshadow,
} from './state.js'
import { openTrial } from './trial.js'
import { refreshObjectives } from './ui.js'
import { $ } from './utils.js'
import { getCurrentCase } from './cases/caseManager.js'

let selClue = null

export function openBoard() {
  if (modalOpen()) {
    return
  }
  renderBoard()
  openModal('boardModal')
  if (!hasFlag('boardSeen')) {
    setFlag('boardSeen')
    toast('选择左侧线索卡，点击对应要素插槽完成推演')
  }
}

export function renderBoard() {
  selClue = null
  const curCase = getCurrentCase()
  const CLUES = curCase.clues || {}
  const SLOTS = curCase.board?.slots || []

  const pool = $('cluePool')
  pool.innerHTML = ''
  G.clues.filter(id => !Object.values(G.board).includes(id)).forEach(id => {
    const c = CLUES[id]
    if (!c) {
      return
    }
    const d = document.createElement('div')
    d.className = 'ccard'
    d.innerHTML = `
      <div class="ccard-head">
        <span class="ci">${ c.icon }</span>
        <span class="ccard-badge">物证</span>
      </div>
      <div class="cn">${ c.name }</div>
      <div class="cs">${ c.short }</div>
      <div class="ccard-tags">${ c.tags.map(t => `<span class="tag">${ t }</span>`).join('') }</div>`
    d.title = c.detail
    d.onclick = () => {
      document.querySelectorAll('.ccard').forEach(x => x.classList.remove('sel'))
      d.classList.add('sel')
      selClue = (selClue === id ? null : id)
      if (selClue === id) {
        sfx('click')
      }
    }
    pool.appendChild(d)
  })
  if (!G.clues.length) {
    pool.innerHTML = '<div class="empty-pool">暂无已收录的可用线索</div>'
  }
  const sg = $('slotGrid')
  sg.innerHTML = ''
  SLOTS.forEach(s => {
    const d = document.createElement('div')
    d.className = 'slot' + (G.board[s.id] ? ' filled' : '')
    const cur = G.board[s.id] ? CLUES[G.board[s.id]] : null
    d.innerHTML = cur
      ? `<div class="slot-head"><span class="slot-code">${ s.code }</span><span class="slot-name">${ s.n }</span></div>
         <div class="filledCard">
           <span class="fc-icon">${ cur.icon }</span>
           <div class="fc-info">
             <div class="fc-name">${ cur.name }</div>
             <div class="fc-sub">${ cur.short }</div>
           </div>
         </div>`
      : `<div class="slot-head"><span class="slot-code">${ s.code }</span><span class="slot-name">${ s.n }</span></div>
         <div class="slot-watermark">${ s.icon }</div>
         <div class="sh">${ s.h }</div>`
    d.onclick = () => {
      if (G.board[s.id]) {
        G.board[s.id] = null
        sfx('click')
        renderBoard()
        return
      }
      if (!selClue) {
        $('boardMsg').textContent = '请先在左侧选择需要关联的线索。'
        return
      }
      const c = CLUES[selClue]
      if (!c.slots.includes(s.id)) {
        $('boardMsg').textContent = `「${ c.name }」与『${ s.n }』要素不吻合。`
        sfx('fail')
        return
      }
      const g = c.gate && c.gate[s.id]
      if (g) {
        const [k, v] = Object.entries(g)[0]
        if (G.attrs[k] < v) {
          failFX(k, v)
          return
        }
        checkFX(k, v)
      }
      G.board[s.id] = selClue
      sfx('pickup')
      renderBoard()
    }
    sg.appendChild(d)
  })
  $('deduceCard').classList.toggle('on', !!G.flags.deductionCorrect)
  if (G.flags.deductionCorrect) {
    $('deduceText').textContent = G.flags.deduceText
  }
}

export function initBoardEvents() {
  $('btnClear').onclick = () => {
    G.board = { killer: null, weapon: null, motive: null, method: null }
    sfx('click')
    renderBoard()
  }

  $('btnVerify').onclick = () => {
    const curCase = getCurrentCase()
    const b = G.board
    const SLOTS = curCase.board?.slots || []
    const CORRECT = curCase.board?.correct || {}
    const WRONGMSG = curCase.board?.wrongMsg || {}

    for (const s of SLOTS) {
      if (!b[s.id]) {
        $('boardMsg').textContent = '需填满所有要素卡槽后方可验证。'
        sfx('fail')
        return
      }
    }
    let wrong = null
    for (const s of SLOTS) {
      if (!CORRECT[s.id] || !CORRECT[s.id].includes(b[s.id])) {
        wrong = s.id
        break
      }
    }
    if (!wrong) {
      G.flags.deductionCorrect = 1
      watchForeshadow('deductionCorrect')
      G.flags.deduceText = curCase.board?.getDeduceText ? curCase.board.getDeduceText(b) : '推论成立。'
      $('deduceText').textContent = G.flags.deduceText
      $('deduceCard').classList.add('on')
      $('boardMsg').textContent = '✓ 证据链闭合，推论成立。可提交证据进入审判。'
      gainXP(30, '推理成功')
    } else {
      const key = wrong + ':' + b[wrong]
      const slotObj = SLOTS.find(s => s.id === wrong)
      $('boardMsg').textContent = '✕ ' +
        (WRONGMSG[key] || `此线索与『${ slotObj ? slotObj.n : wrong }』要素存在逻辑矛盾。`)
      sfx('fail')
    }
    refreshObjectives()
  }

  $('btnSubmit').onclick = () => {
    const curCase = getCurrentCase()
    const b = G.board
    const SLOTS = curCase.board?.slots || []
    if (G.flags.deductionCorrect) {
      openTrial(false)
      return
    }
    for (const s of SLOTS) {
      if (!b[s.id]) {
        $('boardMsg').textContent = '要素卡槽尚未填满。'
        return
      }
    }
    confirmBox('当前推论尚未通过闭环验证。<br><br>在证据链不完整的情况下结案可能导致误判。<br>确认要直接提请裁决吗？',
      () => openTrial(true))
  }
}
