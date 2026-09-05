import { CLUE_TOTAL, CLUES, itemMesh, ITEMS, questState } from './clues'
import { DIALOGUE_LINES, findVoiceUrl, line, NPC_VOICE_DESIGNS } from './dialogueLines'
import { DLG, NPC_PROFILES } from './dialogueData'
import { CORRECT, getDeduceText, SLOTS, WRONGMSG } from './board'
import { getEpilogueData, getVerdictCards, TIMELINE } from './trial'
import { manorCutscene } from './cutscene'
import * as map from './map'
import type { CaseDefinition } from '../../types'

export const caseManor: CaseDefinition = {
  id: 'manor',
  title: '鸦羽庄园的秘毒',
  subtitle: '雾杉镇疑案',
  meta: {
    caseCode: 'CASE FILE #02',
    chapterTag: '第二章 · 鸦羽庄园的秘毒',
    badgeText: '雾杉镇探案辑录',
    title: '鸦羽庄园的秘毒',
    subtitle: '雾杉镇疑案',
    enTitle: 'THE RAVEN MANOR ENIGMA',
    synopsis: '暴风雪封断了通往鸦羽庄园的孤桥。午夜钟鸣之刻，手握全郡矿权的男爵暴毙于反锁书房。<br>胸口无血的纯银刺刀、壁炉未烬的绝情遗嘱、散发苦扁桃味的摔碎茶杯、暗藏针孔的沉香蜡烛。<br>心怀仇怨的遗孀、背负巨债的长子、绝对音感的盲眼琴师、侍奉半生的老管家与家庭医生——当全员皆有杀意，真正的死神究竟以何种面目降临？',
    boardSub: 'CASE FILE #02 · 艾尔弗雷德·维恩男爵密室暴毙案',
    trialSub: '基于已查明的证据链，做出最终案件定性',
    defaultArea: '庄园玄关门廊',
    startNpc: 'thomas',
    initialPlayerPos: [0, 0, 14],
    startHint: '点击地面移动 · 按住 Tab 感知周围交互目标',
  },
  audio: {
    bgm: `${ import.meta.env.BASE_URL }cases/manor/audio/bgm.ogg`,
    voiceDir: `${ import.meta.env.BASE_URL }cases/manor/audio/voice/`,
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
  cutscene: manorCutscene,
  getObjectives: map.getObjectives,
}
