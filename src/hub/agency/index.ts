import { DLG as DIALOGUE_TREES, NPC_PROFILES } from './dialogueData'
import { DIALOGUE_LINES, findVoiceUrl, line, NPC_VOICE_DESIGNS } from './dialogueLines'
import * as map from './map'
import type { HubDefinition } from '../../types'

export const agencyHub: HubDefinition = {
  id: 'agency',
  title: '侦探事务所',
  subtitle: '雾杉镇探案辑录',
  meta: {
    chapterTag: '侦探事务所',
    badgeText: '雾杉镇探案辑录',
    title: '侦探事务所',
    subtitle: '雾杉镇探案辑录',
    enTitle: 'THE AGENCY',
    synopsis: '事务所的登记簿上墨迹未干：新到的委托、待办差事与镇上的传闻，都在等你落笔。',
    defaultArea: '事务所大厅',
    startNpc: 'evelyn',
    initialPlayerPos: [0, 0, 4.5],
    startHint: '与伊芙交谈接取委托 · 告示板上有每日差事',
  },
  audio: {
    bgm: `${ import.meta.env.BASE_URL }hub/agency/audio/bgm.ogg`,
    voiceDir: `${ import.meta.env.BASE_URL }hub/agency/audio/voice/`,
  },
  dialogue: {
    profiles: NPC_PROFILES,
    trees: DIALOGUE_TREES,
    lines: DIALOGUE_LINES,
    voiceDesigns: NPC_VOICE_DESIGNS,
    findVoiceUrl,
    line,
  },
  map,
}
