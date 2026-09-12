import type { DialogueLineItem, FormattedDialogueLine } from '../../types'

export const NPC_VOICE_DESIGNS: Record<string, string> = {
  evelyn: 'A composed, capable female agency assistant in her late twenties. A clear, warm, steady voice with crisp, efficient diction—calm, reliable and subtly wry, like a seasoned office keeper who keeps every file and kettle in order in natural English.',
  tim: 'An energetic teenage newspaper boy around fourteen. A bright, high-spirited, slightly cracking adolescent voice, fast-paced and eager, brimming with cheeky streetwise enthusiasm in natural English.',
}

const gossipInitText = '近来镇上不太平。北边铁匠铺两天前刚出了命案，警长忙得脚不沾地；听说鸦羽庄园那头也不安稳。'
const gossipInitTts = "The town has been restless lately. A murder at the blacksmith's forge up north two days ago has the sheriff run off his feet, and even Ravenfeather Manor seems uneasy."
const gossipBlacksmithText = '铁匠铺的案子传开以后，送来的委托突然多了起来——连庄园那边都递了条子。不过夜里还是少出门为妙。'
const gossipBlacksmithTts = 'Since word of the forge case spread, commissions have been pouring in—even the manor sent a note. Still, better stay indoors at night.'
const gossipManorText = '庄园的案子结了之后，维恩家的矿场暂时由郡里接管。镇上人见了面，说的都是你的名字。'
const gossipManorTts = 'Since the manor case closed, the Wren family\'s mine has been taken over by the county for the time being. Everyone in town speaks your name now.'

export const DIALOGUE_LINES: Record<string, DialogueLineItem> = {
  evelyn_intro: {
    id: 'evelyn_intro',
    npc: 'evelyn',
    speaker: '助手 伊芙',
    prompt: 'A poised assistant warmly greeting the new detective on his first morning at the agency.',
    text: '你来了，侦探。我是伊芙，事务所的助手——卷宗、委托、还有这屋里的茶，都归我管。这里空了半年，从今天起，镇上的疑案由你接手。',
    tts: "You are here at last, detective. I am Eve, the agency's assistant—files, commissions, and all the tea in this house are my responsibility. This place stood empty for half a year. From today, the town's mysteries are yours to handle.",
  },
  evelyn_intro_cases: {
    id: 'evelyn_intro_cases',
    npc: 'evelyn',
    speaker: '助手 伊芙',
    prompt: 'An efficient assistant directing the detective to the notice board with the case files.',
    text: (title = '') => `告示板上贴着各处递来的委托。眼下最要紧的一份，是「${ title }」。接下后从大门出发，结一案，再开下一案。`,
    tts: 'The notice board holds commissions from all over town, and the most urgent one is waiting right now. Accept it and depart through the front door—solve one case, and the next will open.',
  },
  evelyn_hub_assignment: {
    id: 'evelyn_hub_assignment',
    npc: 'evelyn',
    speaker: '助手 伊芙',
    prompt: 'A brisk assistant confirming everything is ready for departure.',
    text: '卷宗已经备好了，随时可以出发。',
    tts: 'Your case file is ready. You may depart at any time.',
  },
  evelyn_hub_open: {
    id: 'evelyn_hub_open',
    npc: 'evelyn',
    speaker: '助手 伊芙',
    prompt: 'A friendly assistant greeting the detective with a light question.',
    text: '有新的事要汇报吗？还是来挑委托的？',
    tts: 'Anything new to report? Or are you here for a commission?',
  },
  evelyn_hub_none: {
    id: 'evelyn_hub_none',
    npc: 'evelyn',
    speaker: '助手 伊芙',
    prompt: 'A gentle assistant delivering quiet, unhurried news.',
    text: '暂时没有新的委托了。告示板上的每日差事，倒是每天都会刷新。',
    tts: 'No new commissions for now. The daily chores on the notice board refresh every morning, though.',
  },
  evelyn_cases: {
    id: 'evelyn_cases',
    npc: 'evelyn',
    speaker: '助手 伊芙',
    prompt: 'An orderly assistant presenting the open commissions in the ledger.',
    text: '登记簿上还空着的委托有这些。结一案，才能开下一案。',
    tts: 'Here are the commissions still open in the ledger. Solve one case, and the next will open.',
  },
  evelyn_accept: {
    id: 'evelyn_accept',
    npc: 'evelyn',
    speaker: '助手 伊芙',
    prompt: 'A sincere assistant handing over the case file with an earnest reminder.',
    text: '卷宗和许可都备好了。记住，进了现场，一切皆可能是证据。路上小心。',
    tts: 'Your file and permit are ready. Remember—at the scene, everything can be evidence. Take care out there.',
  },
  evelyn_daily: {
    id: 'evelyn_daily',
    npc: 'evelyn',
    speaker: '助手 伊芙',
    prompt: 'A matter-of-fact assistant explaining the daily chores.',
    text: '告示板右半边是每日差事——整理档案、沏茶、核对证物之类的杂务。钱不多，胜在每天早上都会换一批。',
    tts: 'The right half of the notice board lists the daily chores—filing papers, brewing tea, checking evidence. The pay is modest, but the list refreshes every morning.',
  },
  evelyn_gossip_init: {
    id: 'evelyn_gossip_init',
    npc: 'evelyn',
    speaker: '助手 伊芙',
    prompt: 'A well-informed assistant lowering her voice to share the latest town news.',
    text: gossipInitText,
    tts: gossipInitTts,
  },
  evelyn_gossip_blacksmith: {
    id: 'evelyn_gossip_blacksmith',
    npc: 'evelyn',
    speaker: '助手 伊芙',
    prompt: 'A satisfied assistant recounting how the solved case stirred up the town.',
    text: gossipBlacksmithText,
    tts: gossipBlacksmithTts,
  },
  evelyn_gossip_manor: {
    id: 'evelyn_gossip_manor',
    npc: 'evelyn',
    speaker: '助手 伊芙',
    prompt: 'A quietly proud assistant noting the detective\'s growing fame.',
    text: gossipManorText,
    tts: gossipManorTts,
  },
  evelyn_pending: {
    id: 'evelyn_pending',
    npc: 'evelyn',
    speaker: '助手 伊芙',
    prompt: 'A patient assistant reminding the detective of the unfinished commission.',
    text: '你还有一桩委托没办完。想出发就从大门走；想练手，告示板上有今天的差事。',
    tts: "You still have an open commission. Depart through the front door when you are ready—or try today's chores on the notice board for practice.",
  },

  tim_intro: {
    id: 'tim_intro',
    npc: 'tim',
    speaker: '报童 蒂姆',
    prompt: 'A cheeky paperboy energetically pitching his services to the newcomer.',
    text: '哟，新来的大侦探！我是报童蒂姆——只要给个铜板，全镇的事没有我不知道的。',
    tts: "Yo, the new famous detective! I'm Tim, the paperboy—for a single copper, there is nothing in this town I don't know.",
  },
  tim_hub: {
    id: 'tim_hub',
    npc: 'tim',
    speaker: '报童 蒂姆',
    prompt: 'An eager paperboy hawking today\'s edition.',
    text: '侦探！今天的报纸要不要？头版可是有故事的。',
    tts: "Detective! Want today's paper? The front page has quite a story.",
  },
  tim_news_init: {
    id: 'tim_news_init',
    npc: 'tim',
    speaker: '报童 蒂姆',
    prompt: 'An excited paperboy dishing out the freshest town gossip.',
    text: gossipInitText,
    tts: gossipInitTts,
  },
  tim_news_blacksmith: {
    id: 'tim_news_blacksmith',
    npc: 'tim',
    speaker: '报童 蒂姆',
    prompt: 'A thrilled paperboy relishing the sensation around the solved case.',
    text: gossipBlacksmithText,
    tts: gossipBlacksmithTts,
  },
  tim_news_manor: {
    id: 'tim_news_manor',
    npc: 'tim',
    speaker: '报童 蒂姆',
    prompt: 'An admiring paperboy celebrating the detective\'s fame.',
    text: gossipManorText,
    tts: gossipManorTts,
  },
  tim_dq_done: {
    id: 'tim_dq_done',
    npc: 'tim',
    speaker: '报童 蒂姆',
    prompt: 'A delighted paperboy striking a deal for future exclusives.',
    text: '成交！你要是又破了案，记得给我留一句独家。',
    tts: 'Deal! Next time you crack a case, save an exclusive for me.',
  },
}

export function line(id: string, ...params: Array<string | number>): FormattedDialogueLine {
  const item = DIALOGUE_LINES[id]
  if (!item) {
    return { sp: '', tx: '', lineId: id, voiceUrl: null }
  }
  const tx = typeof item.text === 'function' ? item.text(...params) : item.text
  return {
    sp: item.speaker,
    tx,
    lineId: item.id,
    voiceUrl: `${ import.meta.env.BASE_URL }hub/agency/audio/voice/${ item.id }.ogg`,
  }
}

export function findVoiceUrl(text: string): string | null {
  if (!text) {
    return null
  }
  for (const item of Object.values(DIALOGUE_LINES)) {
    const raw = typeof item.text === 'function' ? item.text() : item.text
    if (text === raw || (raw && text.includes(raw.slice(0, 14)))) {
      return `${ import.meta.env.BASE_URL }hub/agency/audio/voice/${ item.id }.ogg`
    }
  }
  return null
}
