import { sfx } from './audio.js'
import { openBoard } from './board.js'
import { setTimeScaleT } from './controls.js'
import { closeModal, confirmBox, G, openModal, toast } from './state.js'
import { refreshObjectives } from './ui.js'
import { $ } from './utils.js'
import { getCurrentCase } from './cases/caseManager.js'

export function openTrial(wrongPath) {
  closeModal('boardModal')
  const curCase = getCurrentCase()
  const tl = $('tlList')
  tl.innerHTML = ''
  const timeline = curCase.trial?.timeline || []
  timeline.forEach(e => {
    const known = !e.need || G.clues.includes(e.need)
    tl.innerHTML += `
      <div class="tlitem ${ known ? 'known' : 'unknown' }">
        <div class="tl-left">
          <span class="tt">${ e.t }</span>
          <span class="t-dot"></span>
        </div>
        <div class="tl-right">
          <span class="tx">${ known ? e.tx : '未查明线索（线索缺失）' }</span>
        </div>
      </div>`
  })

  const vl = $('verdictList')
  vl.innerHTML = ''
  const cards = curCase.trial?.getVerdictCards ? curCase.trial.getVerdictCards(wrongPath, G) : []
  cards.forEach(c => {
    const d = document.createElement('div')
    d.className = 'vcard' + (c.req ? ' locked' : '')
    d.innerHTML = `
      <div class="vcard-body">
        <div class="vn">${ c.n }</div>
        <div class="vd">${ c.d }</div>
        ${ c.req ? '<div class="vreq">🔒 缺少核心物证</div>' : '' }
      </div>
      <div class="vcard-action">${ c.back ? '返回' : '裁定' }</div>`
    d.onclick = () => {
      if (c.req) {
        toast('缺少核心物证，暂无法提请该项裁决')
        sfx('fail')
        return
      }
      if (c.back) {
        closeModal('trialModal')
        openBoard()
        return
      }
      confirmBox('裁决呈交后案卷将正式封存，无法撤销。<br><br>确认执行此项最终裁决吗？', () => applyVerdict(c.v))
    }
    vl.appendChild(d)
  })
  openModal('trialModal')
}

export function applyVerdict(v) {
  closeModal('trialModal')
  G.verdict = v
  sfx('verdict')
  setTimeScaleT(0)
  refreshObjectives()
  setTimeout(() => showEpilogue(v), 900)
}

export function showEpilogue(v) {
  const curCase = getCurrentCase()
  const epi = $('epi')
  epi.classList.add('on')
  const box = $('epiText')
  box.innerHTML = ''

  const epiData = curCase.trial?.getEpilogueData ? curCase.trial.getEpilogueData(v, G) : { ps: [], stats: [] }
  const ps = epiData.ps || []

  ps.forEach((p, i) => {
    const el = document.createElement('p')
    if (p.startsWith('🦋')) {
      el.className = 'butterfly'
    }
    el.textContent = p
    box.appendChild(el)
    setTimeout(() => el.classList.add('show'), 800 + i * 1900)
  })

  setTimeout(() => {
    const st = $('epiStats')
    st.classList.add('on')
    const statsHtml = (epiData.stats || []).map(
      s => `<div class="stat"><div class="sv">${ s.v }</div><div class="sk">${ s.k }</div></div>`).join('')
    st.innerHTML = `<div id="endName">${ epiData.endName || '' }</div><div id="endQuote">${ epiData.quote || '' }</div>
  <div id="statGrid">
    ${ statsHtml }
  </div>
  <div class="epi-note">${ epiData.note || '案件侦查已归档' }</div>
  <button class="btn" onclick="location.reload()">重新调查</button>`
  }, 800 + ps.length * 1900 + 1200)
}
