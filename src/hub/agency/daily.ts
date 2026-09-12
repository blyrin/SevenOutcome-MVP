import { sfx } from '../../audio'
import { G, gainXP, hasFlag, openModal, toast } from '../../state'
import { autoSave, refreshObjectives } from '../../ui'
import type { DailyQuestDef } from '../../types'

export const DAILY_POOL: DailyQuestDef[] = [
  {
    id: 'dq_tea',
    title: '沏一壶热茶',
    desc: '茶炉上的水应该开了。沏一壶热茶，让事务所暖和起来。',
    xp: 20,
    flag: 'dq_tea',
  },
  { id: 'dq_archive', title: '整理档案柜', desc: '把档案柜里的旧卷宗按年份重新归置一遍。', xp: 20, flag: 'dq_archive' },
  {
    id: 'dq_gazette',
    title: '圈出晨报疑点',
    desc: '细读桌上的《雾杉镇公报》，圈出与案件有关的消息。',
    xp: 25,
    flag: 'dq_gazette',
  },
  { id: 'dq_gramophone', title: '保养留声机', desc: '给那台老留声机上发条、清理唱针。', xp: 20, flag: 'dq_gramophone' },
  { id: 'dq_plant', title: '浇窗台盆栽', desc: '窗台的蕨类快枯死了，记得给它浇点水。', xp: 15, flag: 'dq_plant' },
  {
    id: 'dq_evidence',
    title: '核对证物箱',
    desc: '清点走廊上的证物箱，核对每件物证的封条编号。',
    xp: 25,
    flag: 'dq_evidence',
  },
  { id: 'dq_tim', title: '打听镇上见闻', desc: '报童蒂姆每天在门厅里晃悠，向他打听镇上的消息。', xp: 20, flag: 'dq_tim' },
]

const DAILY_COUNT = 2

function seededRng(seedStr: string): () => number {
  let h = 2166136261
  for (let i = 0; i < seedStr.length; i++) {
    h ^= seedStr.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return () => {
    h += 0x6D2B79F5
    let t = h
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function todayStr(): string {
  const d = new Date()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${ d.getFullYear() }-${ m }-${ day }`
}

function rollDaily(date: string): string[] {
  const rng = seededRng('wst-daily-' + date)
  const pool = [...DAILY_POOL]
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[pool[i], pool[j]] = [pool[j], pool[i]]
  }
  return pool.slice(0, DAILY_COUNT).map(q => q.id)
}

export function ensureDailyFresh(): void {
  const today = todayStr()
  if (G.daily && G.daily.date === today) {
    return
  }
  G.daily = { date: today, offered: rollDaily(today), accepted: [], done: [] }
}

export function getDailyDef(id: string): DailyQuestDef | undefined {
  return DAILY_POOL.find(q => q.id === id)
}

export function markDailyDone(id: string): void {
  if (!G.daily || !G.daily.accepted.includes(id) || G.daily.done.includes(id)) {
    return
  }
  const def = getDailyDef(id)
  G.daily.done.push(id)
  gainXP(def ? def.xp : 15, '每日委托 · ' + (def ? def.title : '杂务'))
  refreshObjectives()
  autoSave()
}

export function notifyDailyFlag(k: string): void {
  if (!G.daily) {
    return
  }
  for (const id of G.daily.accepted) {
    const def = getDailyDef(id)
    if (def && def.flag === k && !G.daily.done.includes(id)) {
      markDailyDone(id)
      toast(`✓ 每日委托完成：${ def.title }`)
    }
  }
}

export function acceptDaily(id: string): void {
  if (!G.daily || G.daily.accepted.includes(id)) {
    return
  }
  G.daily.accepted.push(id)
  const def = getDailyDef(id)
  toast(`已接受委托：${ def ? def.title : id }`)
  sfx('pickup')
  completeDailyIfFlagged(id)
  refreshObjectives()
  autoSave()
  renderQuestBoard()
}

export function isDailyDone(id: string): boolean {
  return !!G.daily && G.daily.done.includes(id)
}

export function isDailyAccepted(id: string): boolean {
  return !!G.daily && G.daily.accepted.includes(id)
}

export function completeDailyIfFlagged(id: string): void {
  const def = getDailyDef(id)
  if (def && hasFlag(def.flag)) {
    markDailyDone(id)
  }
}

export function openQuestBoard(): void {
  if (!G.daily) {
    ensureDailyFresh()
  }
  renderQuestBoard()
  openModal('questModal')
}

export function renderQuestBoard(): void {
  if (!G.daily) {
    return
  }
  const listEl = document.getElementById('questList')
  const dateEl = document.getElementById('questDate')
  if (dateEl) {
    dateEl.textContent = `今日委托 · ${ G.daily.date } · 已完成 ${ G.daily.done.length }/${ G.daily.offered.length }`
  }
  if (!listEl) {
    return
  }
  listEl.innerHTML = ''
  for (const id of G.daily.offered) {
    const def = getDailyDef(id)
    if (!def) {
      continue
    }
    const done = G.daily.done.includes(id)
    const accepted = G.daily.accepted.includes(id)
    const card = document.createElement('div')
    card.className = 'quest-card' + (done ? ' done' : '')
    card.innerHTML = `
      <div class="quest-head">
        <span class="quest-title">📋 ${ def.title }</span>
        <span class="quest-badge">${ done ? '已完成 ✓' : accepted ? '进行中' : `+${ def.xp } 经验` }</span>
      </div>
      <div class="quest-desc">${ def.desc }</div>
      <div class="quest-action">${ done ? '' : accepted ? '<span class="quest-hint">在事务所内完成对应事项</span>' :
      '<button class="btn">接受委托</button>' }</div>`
    const btn = card.querySelector<HTMLButtonElement>('button')
    if (btn) {
      btn.onclick = () => acceptDaily(id)
    }
    listEl.appendChild(card)
  }
  if (!G.daily.offered.length) {
    listEl.innerHTML = '<div class="empty-hint">今日暂无委托</div>'
  }
}
