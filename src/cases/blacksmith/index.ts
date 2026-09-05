import { CLUE_TOTAL, CLUES, itemMesh, ITEMS, questState } from './clues'
import { DIALOGUE_LINES, findVoiceUrl, line, NPC_VOICE_DESIGNS } from './dialogueLines'
import { DLG, NPC_PROFILES } from './dialogueData'
import { CORRECT, getDeduceText, SLOTS, WRONGMSG } from './board'
import { getEpilogueData, getVerdictCards, TIMELINE } from './trial'
import * as map from './map'
import type { CaseDefinition } from '../../types'

export const caseBlacksmith: CaseDefinition = {
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
    synopsis: '铁匠汉斯倒在冷透的锻炉旁，颅骨遭钝器重击碎裂。<br>沉默战栗的遗孀、惶恐闪烁的学徒、冷眼旁观的债主——风雪欲来的小镇，谎言与苦难在迷雾中无声撕扯。<br>勘查现场、走访证人、拼合证据链，叩问法理与人心。',
    boardSub: 'CASE FILE #01 · 铁匠汉斯·贝克命案',
    trialSub: '基于已查明的证据链，做出最终案件定性',
    defaultArea: '集市广场',
    startNpc: 'sheriff',
    initialPlayerPos: [0, 0, 10],
    startHint: '点击地面移动 · 按住 Tab 感知周围交互目标',
  },
  audio: {
    bgm: `${ import.meta.env.BASE_URL }cases/blacksmith/audio/bgm.ogg`,
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
    voiceDesigns: NPC_VOICE_DESIGNS,
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
