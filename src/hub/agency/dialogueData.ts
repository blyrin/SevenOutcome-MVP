import { G, hasFlag, setFlag } from '../../state'
import { CASE_ORDER, getManifest, isCaseUnlocked } from '../../cases/caseManager'
import { acceptCase, departNow } from './map'
import { isDailyAccepted, isDailyDone } from './daily'
import { line } from './dialogueLines'
import type { DialogueChoice, DialogueTree, NpcProfile } from '../../types'

export const NPC_PROFILES: Record<string, NpcProfile> = {
  evelyn: { title: '事务所助手', role: '委托受理 · 档案管理', color: '#6ab8a0' },
  tim: { title: '报童', role: '雾杉镇消息最灵通的少年', color: '#c8a87c' },
}

function openCaseChoices(): DialogueChoice[] {
  const ch: DialogueChoice[] = []
  for (const id of CASE_ORDER) {
    if (!isCaseUnlocked(id) || G.completedCases.includes(id)) {
      continue
    }
    const m = getManifest(id)
    if (!m) {
      continue
    }
    ch.push({ t: `「${ m.title }」卷宗`, act: () => acceptCase(id), next: 'accept' })
  }
  return ch
}

function hasOpenCase(): boolean {
  return openCaseChoices().length > 0
}

function nextCaseTitle(): string {
  for (const id of CASE_ORDER) {
    if (isCaseUnlocked(id) && !G.completedCases.includes(id)) {
      return getManifest(id)?.title || id
    }
  }
  return ''
}

function gossipKey(): string {
  if (G.completedCases.includes('manor')) {
    return 'manor'
  }
  if (G.completedCases.includes('blacksmith')) {
    return 'blacksmith'
  }
  return 'init'
}

export const DLG: Record<string, () => DialogueTree> = {
  evelyn() {
    const start = G.assignment ? 'pending' : (!hasFlag('hubIntroDone') ? 'intro' : 'hub')
    return {
      start,
      nodes: {
        intro: {
          ...line('evelyn_intro'),
          ch: [
            { t: '带我去看看有哪些委托。', next: 'introCases' },
            { t: '每日委托是什么？', next: 'daily' },
            {
              t: '先这样吧。',
              act: () => {
                setFlag('hubIntroDone')
              },
              next: null,
            },
          ],
        },
        introCases: {
          ...line('evelyn_intro_cases', nextCaseTitle()),
          ch: [
            ...openCaseChoices(),
            { t: '每日委托是什么？', next: 'daily' },
            {
              t: '明白了，开始工作吧。',
              act: () => {
                setFlag('hubIntroDone')
              },
              next: null,
            },
          ],
        },
        hub: {
          ...(G.assignment
            ? line('evelyn_hub_assignment')
            : hasOpenCase() ? line('evelyn_hub_open') : line('evelyn_hub_none')),
          ch: [
            { t: '我想接一份委托。', cond: () => !G.assignment && hasOpenCase(), next: 'cases' },
            { t: '每日委托是怎么回事？', next: 'daily' },
            { t: '最近镇上如何？', next: 'gossip' },
            { t: '没什么，先这样。', next: null },
          ],
        },
        cases: {
          ...line('evelyn_cases'),
          ch: [
            ...openCaseChoices(),
            { t: '先不了。', next: null },
          ],
        },
        accept: {
          ...line('evelyn_accept'),
          ch: [
            { t: '现在就出发。', act: () => departNow(), next: null },
            { t: '我再准备一下。', next: null },
          ],
        },
        daily: {
          ...line('evelyn_daily'),
          ch: [
            { t: '我去告示板看看。', next: null },
            { t: '说回委托的事。', next: hasOpenCase() || G.assignment ? 'hub' : 'introCases' },
          ],
        },
        gossip: {
          ...line(`evelyn_gossip_${ gossipKey() }`),
          ch: [
            { t: '谈谈委托。', cond: () => !G.assignment && hasOpenCase(), next: 'cases' },
            { t: '告辞。', next: null },
          ],
        },
        pending: {
          ...line('evelyn_pending'),
          ch: [
            { t: '现在就出发。', act: () => departNow(), next: null },
            { t: '我再准备一下。', next: null },
          ],
        },
      },
    }
  },
  tim() {
    const start = G.talked.tim ? 'hub' : 'intro'
    return {
      start,
      nodes: {
        intro: {
          ...line('tim_intro'),
          ch: [
            { t: '镇上有什么新鲜事？', next: 'news' },
            { t: '回见，蒂姆。', next: null },
          ],
        },
        hub: {
          ...line('tim_hub'),
          ch: [
            {
              t: '聊聊今天的见闻。', cond: () => isDailyAccepted('dq_tim') && !isDailyDone('dq_tim'),
              act: () => {
                setFlag('dq_tim')
              }, next: 'dqDone',
            },
            { t: '镇上有什么新鲜事？', next: 'news' },
            { t: '回见。', next: null },
          ],
        },
        news: {
          ...line(`tim_news_${ gossipKey() }`),
          ch: [
            {
              t: '帮我盯着点风声。', cond: () => isDailyAccepted('dq_tim') && !isDailyDone('dq_tim'),
              act: () => {
                setFlag('dq_tim')
              }, next: 'dqDone',
            },
            { t: '回见。', next: null },
          ],
        },
        dqDone: {
          ...line('tim_dq_done'),
          ch: [{ t: '（记下了）', next: null }],
        },
      },
    }
  },
}
