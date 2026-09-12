import { G, hasFlag, setFlag } from '../../state'
import { CASE_ORDER, getManifest, isCaseUnlocked } from '../../cases/caseManager'
import { acceptCase, departNow } from './map'
import { isDailyAccepted, isDailyDone } from './daily'
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

function gossipText(): string {
  const done = G.completedCases
  if (done.includes('manor')) {
    return '庄园的案子结了之后，维恩家的矿场暂时由郡里接管。镇上人见了面，说的都是你的名字。'
  }
  if (done.includes('blacksmith')) {
    return '铁匠铺的案子传开以后，送来的委托突然多了起来——连庄园那边都递了条子。不过夜里还是少出门为妙。'
  }
  return '近来镇上不太平。北边铁匠铺两天前刚出了命案，警长忙得脚不沾地；听说鸦羽庄园那头也不安稳。'
}

export const DLG: Record<string, () => DialogueTree> = {
  evelyn() {
    const start = G.assignment ? 'pending' : (!hasFlag('hubIntroDone') ? 'intro' : 'hub')
    return {
      start,
      nodes: {
        intro: {
          tx: '你终于来了，侦探。我是伊芙，事务所的助手——卷宗登记、委托受理、还有这座屋子里所有的茶，都归我管。往后的雾杉镇疑案，就从这张办公桌出发。',
          ch: [
            { t: '这间事务所是什么来头？', next: 'about' },
            { t: '带我去看看有哪些委托。', next: 'introCases' },
          ],
        },
        about: {
          tx: '事务所空了半年，桌上还留着上一位侦探没喝完的茶。如今镇警署和各路委托人都把信寄到这里——雾杉镇的疑难杂案，从今天起由你接手。',
          ch: [
            { t: '有哪些委托？', next: 'introCases' },
            { t: '每日委托是什么？', next: 'daily' },
          ],
        },
        introCases: {
          tx: `告示板上贴着镇里各处递来的委托。眼下最要紧的一份，是「${ nextCaseTitle() }」。接下委托后，从大门出发前往调查——结案回来，我们再谈下一份。`,
          ch: [
            ...openCaseChoices(),
            { t: '每日委托又是怎么回事？', next: 'daily' },
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
          tx: G.assignment
            ? '卷宗已经备好了。随时可以出发。'
            : (hasOpenCase()
              ? '有新的事要汇报吗？还是来挑委托的？'
              : '暂时没有新的委托了。告示板上的每日差事倒是每天都会刷新。'),
          ch: [
            { t: '我想接一份委托。', cond: () => !G.assignment && hasOpenCase(), next: 'cases' },
            { t: '每日委托是怎么回事？', next: 'daily' },
            { t: '最近镇上如何？', next: 'gossip' },
            { t: '没什么，先这样。', next: null },
          ],
        },
        cases: {
          tx: '登记簿上还空着的委托有这些。案件卷宗都在档案柜里，随时可以翻阅——不过结一案，才能开下一案。',
          ch: [
            ...openCaseChoices(),
            { t: '先不了。', next: null },
          ],
        },
        accept: {
          tx: '好眼力。我把卷宗和许可都给你备好了——记住，进了现场，你看到的一切都可能是证据，你说的每句话也可能是。路上小心。',
          ch: [
            { t: '现在就出发。', act: () => departNow(), next: null },
            { t: '我再准备一下。', next: null },
          ],
        },
        daily: {
          tx: '告示板右半边是每日差事——整理档案、沏茶、核对证物之类的杂务。钱不多，但对新手侦探是不错的练手活，每天早上我会换一批新的。',
          ch: [
            { t: '我去告示板看看。', next: null },
            { t: '说回委托的事。', next: hasOpenCase() || G.assignment ? 'hub' : 'introCases' },
          ],
        },
        gossip: {
          tx: gossipText(),
          ch: [
            { t: '谈谈委托。', cond: () => !G.assignment && hasOpenCase(), next: 'cases' },
            { t: '告辞。', next: null },
          ],
        },
        pending: {
          tx: '你还有一桩委托没办完——出门正对的就是大门，雾杉镇的夜色不会等你。走之前想练练手的话，告示板上也有今天的差事。',
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
          tx: '哟，新来的大侦探！我是蒂姆，全雾杉镇跑得最快的报童——只要给个铜板，上到郡长晚宴下到码头斗殴，没有我不知道的事。',
          ch: [
            { t: '镇上有什么新鲜事？', next: 'news' },
            { t: '回见，蒂姆。', next: null },
          ],
        },
        hub: {
          tx: '侦探！今天的报纸要不要？头版可是有故事的。',
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
          tx: gossipText(),
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
          tx: '成交！今晚是铁匠铺的后续报道，明天是庄园的特刊——你要是又破了案，记得给我留一句独家。',
          ch: [{ t: '（记下了）', next: null }],
        },
      },
    }
  },
}
