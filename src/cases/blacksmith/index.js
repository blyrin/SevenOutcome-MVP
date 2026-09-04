import { CLUE_TOTAL, CLUES, itemMesh, ITEMS, questState } from './clues.js'
import { DIALOGUE_LINES, findVoiceUrl, line } from './dialogueLines.js'
import { DLG, NPC_PROFILES } from './dialogueData.js'
import { CORRECT, getDeduceText, SLOTS, WRONGMSG } from './board.js'
import { getEpilogueData, getVerdictCards, TIMELINE } from './trial.js'
import * as map from './map.js'

export const caseBlacksmith = {
  id: 'blacksmith',
  title: '铁匠之死',
  subtitle: '雾杉镇疑案',
  meta: {
    caseCode: 'CASE FILE #01',
    chapterTag: '第一章 · 铁匠之死',
    badgeText: '雾杉镇探案辑录',
    title: '铁匠之死',
    subtitle: '雾杉镇疑案',
    enTitle: 'THE BLACKSMITH\'S DEMISE',
    synopsis: '铁匠汉斯倒在熄灭的锻炉旁，头部受钝器重创。<br>各怀心事的遗孀、学徒与债主——谎言与迷雾笼罩着小镇。<br>勘查现场、走访证人、拼合证据链，做出最终裁决。',
    boardSub: 'CASE FILE #01 · 铁匠汉斯·贝克命案',
    trialSub: '基于已查明的证据链，做出最终案件定性',
    defaultArea: '集市广场',
    startNpc: 'sheriff',
    initialPlayerPos: [0, 0, 10],
    startHint: '点击地面移动 · 按住 Tab 感知周围交互目标',
  },
  audio: {
    bgm: `${ import.meta.env.BASE_URL }cases/blacksmith/audio/bgm.mp3`,
    voiceDir: `${ import.meta.env.BASE_URL }cases/blacksmith/audio/voice/`,
  },
  clues: CLUES,
  clueTotal: CLUE_TOTAL,
  items: ITEMS,
  itemMesh,
  questState,
  dialogue: {
    profiles: NPC_PROFILES,
    trees: DLG,
    lines: DIALOGUE_LINES,
    findVoiceUrl,
    line,
  },
  board: {
    slots: SLOTS,
    correct: CORRECT,
    wrongMsg: WRONGMSG,
    getDeduceText,
  },
  trial: {
    timeline: TIMELINE,
    getVerdictCards,
    getEpilogueData,
  },
  map,
  getObjectives: map.getObjectives,
}
