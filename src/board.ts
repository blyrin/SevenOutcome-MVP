import { sfx } from './audio'
import {
  checkFX, confirmBox, failFX, G, gainXP, hasFlag, modalOpen, openModal, setFlag, toast, watchForeshadow,
} from './state'
import { openTrial } from './trial'
import { refreshObjectives } from './ui'
import { $ } from './utils'
import { getCurrentCase } from './cases/caseManager'
import type { AttrKey, SlotId } from './types'

let selClue: string | null = null

function invalidateDeduction(): void {
  if (G.flags.deductionCorrect) {
    delete G.flags.deductionCorrect
    const boardMsg = $('boardMsg')
    if (boardMsg) {
      boardMsg.textContent = '推论组合已变动，证据链需重新验证。'
    }
  }
}

export function openBoard(): void {
  if (modalOpen()) {
    return
  }
  if (!getCurrentCase()) {
    return
  }
  renderBoard()
  openModal('boardModal')
  if (!hasFlag('boardSeen')) {
    setFlag('boardSeen')
    toast('选择左侧线索卡，点击对应要素插槽完成推演')
  }
}

export function renderBoard(): void {
  selClue = null
  const curCase = getCurrentCase()
  if (!curCase) {
    return
  }
  const CLUES = curCase.clues || {}
  const SLOTS = curCase.board?.slots || []

  const pool = $('cluePool')
  if (pool) {
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
  }

  const sg = $('slotGrid')
  if (sg) {
    sg.innerHTML = ''
    SLOTS.forEach(s => {
      const d = document.createElement('div')
      d.className = 'slot' + (G.board[s.id] ? ' filled' : '')
      const curClueId = G.board[s.id]
      const cur = curClueId ? CLUES[curClueId] : null
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
        const boardMsg = $('boardMsg')
        if (G.board[s.id]) {
          G.board[s.id] = null
          sfx('click')
          invalidateDeduction()
          renderBoard()
          return
        }
        if (!selClue) {
          if (boardMsg) boardMsg.textContent = '请先在左侧选择需要关联的线索。'
          return
        }
        const c = CLUES[selClue]
        if (!c.slots.includes(s.id)) {
          if (boardMsg) boardMsg.textContent = `「${ c.name }」与『${ s.n }』要素不吻合。`
          sfx('fail')
          return
        }
        const g = c.gate && c.gate[s.id]
        if (g) {
          const entries = Object.entries(g) as Array<[AttrKey, number]>
          if (entries.length > 0) {
            const [k, v] = entries[0]
            if (G.attrs[k] < v) {
              failFX(k, v)
              return
            }
            checkFX(k, v)
          }
        }
        G.board[s.id] = selClue
        sfx('pickup')
        invalidateDeduction()
        renderBoard()
      }
      sg.appendChild(d)
    })
  }

  const deduceCard = $('deduceCard')
  if (deduceCard) {
    deduceCard.classList.toggle('on', !!G.flags.deductionCorrect)
  }
  if (G.flags.deductionCorrect) {
    const deduceText = $('deduceText')
    if (deduceText) {
      deduceText.textContent = String(G.flags.deduceText)
    }
  }
}

export function initBoardEvents(): void {
  const btnClear = $('btnClear')
  if (btnClear) {
    btnClear.onclick = () => {
      G.board = { killer: null, weapon: null, motive: null, method: null }
      sfx('click')
      invalidateDeduction()
      renderBoard()
    }
  }

  const btnVerify = $('btnVerify')
  if (btnVerify) {
    btnVerify.onclick = () => {
      const curCase = getCurrentCase()
      if (!curCase) {
        return
      }
      const b = G.board
      const SLOTS = curCase.board?.slots || []
      const CORRECT = curCase.board?.correct || {}
      const WRONGMSG = curCase.board?.wrongMsg || {}
      const boardMsg = $('boardMsg')

      for (const s of SLOTS) {
        if (!b[s.id]) {
          if (boardMsg) boardMsg.textContent = '需填满所有要素卡槽后方可验证。'
          sfx('fail')
          return
        }
      }
      let wrong: SlotId | null = null
      for (const s of SLOTS) {
        const slotVal = b[s.id]
        if (!CORRECT[s.id] || !slotVal || !CORRECT[s.id].includes(slotVal)) {
          wrong = s.id
          break
        }
      }
      if (!wrong) {
        G.flags.deductionCorrect = 1
        watchForeshadow('deductionCorrect')
        G.flags.deduceText = curCase.board?.getDeduceText ? curCase.board.getDeduceText(b) : '推论成立。'
        const dt = $('deduceText')
        if (dt) dt.textContent = G.flags.deduceText
        const dc = $('deduceCard')
        if (dc) dc.classList.add('on')
        if (boardMsg) boardMsg.textContent = '✓ 证据链闭合，推论成立。可提交证据进入审判。'
        gainXP(30, '推理成功')
      } else {
        const key = wrong + ':' + b[wrong]
        const slotObj = SLOTS.find(s => s.id === wrong)
        if (boardMsg) {
          boardMsg.textContent = '✕ ' +
            (WRONGMSG[key] || `此线索与『${ slotObj ? slotObj.n : wrong }』要素存在逻辑矛盾。`)
        }
        sfx('fail')
      }
      refreshObjectives()
    }
  }

  const btnSubmit = $('btnSubmit')
  if (btnSubmit) {
    btnSubmit.onclick = () => {
      const curCase = getCurrentCase()
      if (!curCase) {
        return
      }
      const b = G.board
      const SLOTS = curCase.board?.slots || []
      const boardMsg = $('boardMsg')
      if (G.flags.deductionCorrect) {
        openTrial(false)
        return
      }
      for (const s of SLOTS) {
        if (!b[s.id]) {
          if (boardMsg) boardMsg.textContent = '要素卡槽尚未填满。'
          return
        }
      }
      confirmBox('当前推论尚未通过闭环验证。<br><br>在证据链不完整的情况下结案可能导致误判。<br>确认要直接提请裁决吗？',
        () => openTrial(true))
    }
  }
}
