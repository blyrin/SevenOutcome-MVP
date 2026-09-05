import { clearWorldObjects, player, renderer, resetGrid, scene, camera } from '../world'
import { playBgm, stopVoice } from '../audio'
import { G, resetCaseState } from '../state'
import { setupCaseUI } from '../ui'
import { collectCaseAssetUrls, preloadAssetFiles } from '../assetLoader'
import type { CaseDefinition, CaseManifest } from '../types'

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
let selectedCaseId = 'blacksmith'

export function getSelectedCaseId(): string {
  return selectedCaseId
}

export function setSelectedCaseId(id: string): void {
  if (caseManifests[id]) {
    selectedCaseId = id
  }
}

export function getAllManifests(): Record<string, CaseManifest> {
  return caseManifests
}

export function getManifest(id: string): CaseManifest | undefined {
  return caseManifests[id]
}

export function getCurrentCase(): CaseDefinition {
  return (currentCase || registry[selectedCaseId]) as CaseDefinition
}

export function getAllCases(): Record<string, CaseDefinition> {
  return registry
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

export function loadCase(caseDef: CaseDefinition | string): CaseDefinition | null {
  if (typeof caseDef === 'string') {
    caseDef = registry[caseDef]
  }
  if (!caseDef) {
    return null
  }
  clearWorldObjects()
  resetGrid()

  if (caseDef.meta && caseDef.meta.initialPlayerPos) {
    player.position.set(...caseDef.meta.initialPlayerPos)
    player.visible = true
  }

  if (caseDef.map && caseDef.map.setupMap) {
    caseDef.map.setupMap({ scene, player })
  }

  resetCaseState()
  currentCase = caseDef
  registry[caseDef.id] = caseDef
  selectedCaseId = caseDef.id

  if (caseDef.audio && caseDef.audio.bgm) {
    playBgm(caseDef.audio.bgm)
  }
  setupCaseUI(currentCase)
  return currentCase
}

export async function loadCaseWithAssets(
  caseId: string,
  onProgress?: (pct: number, status: string) => void,
): Promise<CaseDefinition> {
  if (onProgress) {
    onProgress(5, '正在检索案件卷宗档案…')
  }

  const caseDef = await loadCaseModule(caseId)
  if (onProgress) {
    onProgress(18, '已解析案卷档案，正在检索录音与物证清单…')
  }

  const assetUrls = collectCaseAssetUrls(caseDef)
  const totalAssets = assetUrls.length

  if (totalAssets > 0) {
    await preloadAssetFiles(assetUrls, (loaded, total) => {
      const pct = Math.round(20 + (loaded / total) * 62)
      if (onProgress) {
        onProgress(pct, `正在预载案情录音与关键证言 (${ loaded }/${ total })…`)
      }
    })
  }

  if (onProgress) {
    onProgress(86, '正在构筑案发现场 3D 空间与物理阻挡…')
  }

  stopVoice()
  clearWorldObjects()
  resetGrid()

  if (caseDef.meta && caseDef.meta.initialPlayerPos) {
    player.position.set(...caseDef.meta.initialPlayerPos)
    player.visible = true
  }

  if (caseDef.map && caseDef.map.setupMap) {
    caseDef.map.setupMap({ scene, player })
  }

  resetCaseState()
  currentCase = caseDef
  registry[caseDef.id] = caseDef
  selectedCaseId = caseDef.id

  if (G.started && caseDef.audio && caseDef.audio.bgm) {
    playBgm(caseDef.audio.bgm)
  }

  setupCaseUI(currentCase)

  if (renderer && scene && camera) {
    try {
      renderer.compile(scene, camera)
    } catch (e) {}
  }

  if (onProgress) {
    onProgress(100, '调查现场已准备就绪！')
  }

  return caseDef
}
