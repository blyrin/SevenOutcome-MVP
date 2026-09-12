import { camera, clearWorldObjects, player, renderer, resetGrid, scene } from '../world'
import { playBgm, stopVoice } from '../audio'
import { G, resetCaseState } from '../state'
import { setupCaseUI } from '../ui'
import { collectCaseAssetUrls, preloadAssetFiles } from '../assetLoader'
import type { CaseDefinition, CaseManifest, HubDefinition } from '../types'

export const HUB_CASE_ID = 'agency'

export const CASE_ORDER: string[] = ['blacksmith', 'manor']

export const caseManifests: Record<string, CaseManifest> = {
  blacksmith: {
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
    load: () => import('./blacksmith').then(m => m.caseBlacksmith),
  },
  manor: {
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
    load: () => import('./manor').then(m => m.caseManor),
  },
}

export const registry: Record<string, CaseDefinition> = {}

export let currentCase: CaseDefinition | null = null
export let currentHub: HubDefinition | null = null

export function getCurrentCase(): CaseDefinition | null {
  return currentCase
}

export function getCurrentHub(): HubDefinition | null {
  return currentHub
}

export type GameScene = CaseDefinition | HubDefinition

export function getCurrentScene(): GameScene | null {
  return currentCase || currentHub
}

export function getAllManifests(): Record<string, CaseManifest> {
  return caseManifests
}

export function getManifest(id: string): CaseManifest | undefined {
  return caseManifests[id]
}

export function isCaseUnlocked(id: string): boolean {
  const idx = CASE_ORDER.indexOf(id)
  if (idx < 0) {
    return false
  }
  if (idx === 0) {
    return true
  }
  return G.completedCases.includes(CASE_ORDER[idx - 1])
}

export function nextCaseId(): string | null {
  for (const id of CASE_ORDER) {
    if (isCaseUnlocked(id) && !G.completedCases.includes(id)) {
      return id
    }
  }
  return null
}

export async function loadCaseModule(caseId: string): Promise<CaseDefinition> {
  if (registry[caseId]) {
    return registry[caseId]
  }
  const manifest = caseManifests[caseId]
  if (!manifest) {
    throw new Error(`Unknown case: ${ caseId }`)
  }
  const caseDef = await manifest.load()
  registry[caseId] = caseDef
  return caseDef
}

async function preloadSceneAudio(
  def: CaseDefinition | HubDefinition,
  onProgress?: (pct: number, status: string) => void,
): Promise<void> {
  if (onProgress) {
    onProgress(5, '正在检索卷宗档案…')
  }

  const assetUrls = collectCaseAssetUrls(def as CaseDefinition)
  const totalAssets = assetUrls.length

  if (totalAssets > 0) {
    await preloadAssetFiles(assetUrls, (loaded, total) => {
      const pct = Math.round(20 + (loaded / total) * 62)
      if (onProgress) {
        onProgress(pct, `正在预载录音与关键证言 (${ loaded }/${ total })…`)
      }
    })
  }

  if (onProgress) {
    onProgress(86, '正在构筑场景 3D 空间与物理阻挡…')
  }
}

function activateScene(def: CaseDefinition | HubDefinition): void {
  stopVoice()
  clearWorldObjects()
  resetGrid()

  const pos = def.meta && def.meta.initialPlayerPos
  if (pos) {
    player.position.set(...pos)
    player.visible = true
  }

  if (def.map && def.map.setupMap) {
    def.map.setupMap({ scene, player })
  }

  resetCaseState()

  if ('clues' in def) {
    currentCase = def
    currentHub = null
    registry[def.id] = def
  } else {
    currentHub = def
    currentCase = null
  }

  if (G.started && def.audio && def.audio.bgm) {
    playBgm(def.audio.bgm)
  }

  setupCaseUI(def)

  if (renderer && scene && camera) {
    try {
      renderer.compile(scene, camera)
    } catch (e) {}
  }
}

export async function loadCaseWithAssets(
  caseId: string,
  onProgress?: (pct: number, status: string) => void,
): Promise<CaseDefinition> {
  if (onProgress) {
    onProgress(5, '正在检索案件卷宗档案…')
  }

  const caseDef = await loadCaseModule(caseId)
  await preloadSceneAudio(caseDef, onProgress)
  activateScene(caseDef)

  if (onProgress) {
    onProgress(100, '调查现场已准备就绪！')
  }

  return caseDef
}

export async function loadHubWithAssets(
  onProgress?: (pct: number, status: string) => void,
): Promise<HubDefinition> {
  const hubDef = await import('../hub/agency').then(m => m.agencyHub)
  await preloadSceneAudio(hubDef, onProgress)
  activateScene(hubDef)

  if (onProgress) {
    onProgress(100, '事务所已准备就绪！')
  }

  return hubDef
}
