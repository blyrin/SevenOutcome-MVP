import { sfx } from './audio.js'
import { CLUES } from './clues.js'
import { checkFX, confirmBox, failFX, G, gainXP, hasFlag, modalOpen, openModal, setFlag, toast, watchForeshadow } from './state.js'
import { openTrial } from './trial.js'
import { refreshObjectives } from './ui.js'
import { $ } from './utils.js'

export const SLOTS = [
  { id: 'killer', n: '嫌疑人', h: '确定实施致命行为的涉案人员', code: 'FACTOR 01', icon: '👤' },
  { id: 'weapon', n: '凶 器', h: '造成死者头部重创的直接物证', code: 'FACTOR 02', icon: '🔨' },
  { id: 'motive', n: '动 机', h: '诱发致命冲突的核心诱因背景', code: 'FACTOR 03', icon: '⚖️' },
  { id: 'method', n: '手 法', h: '案发当晚搏斗与致死的具体过程', code: 'FACTOR 04', icon: '⏳' },
]

export const CORRECT = {
  killer: ['clue_luke'],
  weapon: ['clue_hammer'],
  motive: ['clue_wounds', 'clue_gossip', 'clue_diary'],
  method: ['clue_apron', 'clue_confession'],
}

export const WRONGMSG = {
  'killer:clue_letter': '恐吓信只能证明巴罗曾粗暴逼债——但皮特的证词已证实他在案发前就朝镇外走去了。',
  'killer:clue_insurance': '你指认的嫌疑人虽符合逻辑，但保险单本身并非直接行凶凭证——你需要目击行凶现场的关键人证。',
  'killer:clue_debt': '账册批注恰恰证实巴罗绝不希望汉斯丧命——对放贷者而言，死人无法兑现半个铜板。',
  'motive:clue_letter': '恐吓是追讨债务的手段，而非当晚铺中殊死反抗的诱因。深埋在背后的动机关乎生存与尊严。',
  'motive:clue_insurance': '谋财害命？保单是汉斯暗自立下的，且无法解释铺中剧烈搏斗与被撕碎的衣物。',
  'method:clue_body': '尸检报告揭示了死因与伤势，但手法要素需要更具现场动态与搏斗细节的直接物证。',
  'method:clue_pete': '时间线锁定了案发时序，但手法要素需要还原具体搏斗反击的物质痕迹。',
}

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
  const pool = $('cluePool')
  pool.innerHTML = ''
  G.clues.filter(id => !Object.values(G.board).includes(id)).forEach(id => {
    const c = CLUES[id]
    const d = document.createElement('div')
    d.className = 'ccard'
    d.innerHTML = `
      <div class="ccard-head">
        <span class="ci">${c.icon}</span>
        <span class="ccard-badge">物证</span>
      </div>
      <div class="cn">${c.name}</div>
      <div class="cs">${c.short}</div>
      <div class="ccard-tags">${c.tags.map(t => `<span class="tag">${t}</span>`).join('')}</div>`
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
      ? `<div class="slot-head"><span class="slot-code">${s.code}</span><span class="slot-name">${s.n}</span></div>
         <div class="filledCard">
           <span class="fc-icon">${cur.icon}</span>
           <div class="fc-info">
             <div class="fc-name">${cur.name}</div>
             <div class="fc-sub">${cur.short}</div>
           </div>
         </div>`
      : `<div class="slot-head"><span class="slot-code">${s.code}</span><span class="slot-name">${s.n}</span></div>
         <div class="slot-watermark">${s.icon}</div>
         <div class="sh">${s.h}</div>`
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
        $('boardMsg').textContent = `「${c.name}」与『${s.n}』要素不吻合。`
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
    const b = G.board
    if (!b.killer || !b.weapon || !b.motive || !b.method) {
      $('boardMsg').textContent = '需填满四个要素卡槽后方可验证。'
      sfx('fail')
      return
    }
    let wrong = null
    for (const s of SLOTS) {
      if (!CORRECT[s.id].includes(b[s.id])) {
        wrong = s.id
        break
      }
    }
    if (!wrong) {
      const mtxt = b.motive === 'clue_wounds'
        ? '长年家庭暴力的阴影'
        : (b.motive === 'clue_diary' ? '血泪日记记录的绝望深渊' : '整条街巷心照不宣的苦难')
      G.flags.deductionCorrect = 1
      watchForeshadow('deductionCorrect')
      G.flags.deduceText = `玛莎·贝克在${mtxt}中，于昨夜暴徒施暴的生死危局里拼死自卫，抓起炉边铁锤挥出了绝望的反击——这是悲剧性的紧急自卫，绝非蓄意谋杀。`
      $('deduceText').textContent = G.flags.deduceText
      $('deduceCard').classList.add('on')
      $('boardMsg').textContent = '✓ 证据链闭合，推论成立。可提交证据进入审判。'
      gainXP(30, '推理成功')
    } else {
      const key = wrong + ':' + b[wrong]
      $('boardMsg').textContent = '✕ ' +
        (WRONGMSG[key] || `此线索与『${SLOTS.find(s => s.id === wrong).n}』要素存在逻辑矛盾。`)
      sfx('fail')
    }
    refreshObjectives()
  }

  $('btnSubmit').onclick = () => {
    const b = G.board
    if (G.flags.deductionCorrect) {
      openTrial(false)
      return
    }
    if (!b.killer || !b.weapon || !b.motive || !b.method) {
      $('boardMsg').textContent = '要素卡槽尚未填满。'
      return
    }
    confirmBox('当前推论尚未通过闭环验证。<br><br>在证据链不完整的情况下结案可能导致误判。<br>确认要直接提请裁决吗？', () => openTrial(true))
  }
}
