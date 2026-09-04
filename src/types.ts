import type * as THREE from 'three'

export type ColorLike = THREE.Color | string | number

export type FlagValue = boolean | number | string

export interface NpcConfig {
  n: string
  pos: [number, number]
  coat: ColorLike
  hat?: ColorLike | false
  hair?: ColorLike
  badge?: boolean
  glasses?: boolean
  role?: string
  mesh?: THREE.Group
  ring?: THREE.Mesh
}

export interface NpcEntity {
  n: string
  pos: [number, number]
  coat: ColorLike
  hat?: ColorLike | false
  hair?: ColorLike
  badge?: boolean
  glasses?: boolean
  role?: string
  mesh: THREE.Group
  ring: THREE.Mesh
}

export type AttrKey = 'int' | 'ins' | 'psy' | 'strw' | 'kno'

export type AttrStats = Record<AttrKey, number>

export interface AttrMeta {
  n: string
  i: string
  d: string
}

export type SlotId = 'killer' | 'weapon' | 'motive' | 'method'

export interface ClueGate {
  [attr: string]: number
}

export interface Clue {
  name: string
  icon: string
  tags: string[]
  slots: SlotId[]
  short: string
  detail: string
  d?: string
  gate?: Partial<Record<SlotId, Partial<Record<AttrKey, number>>>>
}

export interface Item {
  name: string
  icon?: string
  d?: string
  detail?: string
  short?: string
  tags?: string[]
  slots?: SlotId[]
}

export interface BoardSlot {
  id: SlotId
  n: string
  h: string
  code: string
  icon: string
}

export type BoardState = Record<SlotId, string | null>
export type BoardCorrect = Record<SlotId, string[]>
export type BoardWrongMsg = Record<string, string>

export interface BoardDefinition {
  slots: BoardSlot[]
  correct: BoardCorrect
  wrongMsg: BoardWrongMsg
  getDeduceText: (b: BoardState) => string
}

export interface TimelineItem {
  t: string
  tx: string
  need: string | null
}

export interface VerdictCard {
  n: string
  d: string
  v?: string
  back?: boolean
  req?: boolean
}

export interface StatItem {
  v: string
  k: string
}

export interface EpilogueData {
  ps: string[]
  endName?: string
  quote?: string
  stats: StatItem[]
  note?: string
}

export interface TrialDefinition {
  timeline: TimelineItem[]
  getVerdictCards: (wrongPath: boolean, G: GameState) => VerdictCard[]
  getEpilogueData: (v: string, G: GameState) => EpilogueData
}

export interface NpcProfile {
  title: string
  role: string
  color?: string
}

export interface DialogueChoice {
  t: string
  next: string | null
  req?: Partial<Record<AttrKey, number>>
  cond?: () => unknown
  act?: () => void
}

export interface DialogueNode {
  sp?: string
  tx: string
  lineId?: string
  voiceUrl?: string | null
  ch?: DialogueChoice[]
}

export interface DialogueTree {
  start: string
  nodes: Record<string, DialogueNode>
}

export interface DialogueLineItem {
  id: string
  npc: string
  speaker: string
  voice?: string
  prompt?: string
  text: string | ((...args: Array<string | number>) => string)
  tts?: string
}

export interface FormattedDialogueLine {
  sp: string
  tx: string
  lineId: string
  voiceUrl: string | null
}

export interface DialogueDefinition {
  profiles: Record<string, NpcProfile>
  trees: Record<string, () => DialogueTree>
  lines?: Record<string, DialogueLineItem>
  findVoiceUrl?: (text: string) => string | null
  line?: (id: string, ...args: Array<string | number>) => FormattedDialogueLine
}

export interface CaseMeta {
  caseCode?: string
  chapterTag?: string
  badgeText?: string
  title?: string
  subtitle?: string
  enTitle?: string
  synopsis?: string
  boardSub?: string
  trialSub?: string
  defaultArea?: string
  startNpc?: string
  initialPlayerPos?: [number, number, number]
  startHint?: string
}

export interface ObjectivesResult {
  list?: Array<{ t: string; d: boolean }>
  notStartedText?: string
}

export interface WorldContext {
  scene: THREE.Scene
  player: THREE.Group
}

export interface InteractContext {
  G: GameState
  player: THREE.Group
  addClue: (id: string, silent?: boolean) => void
  addItem: (id: string) => void
  setFlag: (k: string, v?: FlagValue) => void
  hasFlag: (k: string) => boolean
  checkFX: (attr: AttrKey, dc: number) => void
  failFX: (attr: AttrKey, dc: number, msg?: string) => void
  flavor: (id: string, txt: string) => void
  toast: (txt: string, cls?: string) => void
  sfx: (k: string) => void
  refreshObjectives: () => void
}

export interface FlagChangeContext {
  G: GameState
  setFlag: (k: string, v?: FlagValue) => void
  hasFlag: (k: string) => boolean
  toast: (txt: string, cls?: string) => void
  sfx: (k: string) => void
  refreshObjectives: () => void
}

export interface ClueAddedContext {
  G: GameState
  setFlag: (k: string, v?: FlagValue) => void
  hasFlag: (k: string) => boolean
  toast: (txt: string, cls?: string) => void
  sfx: (k: string) => void
}

export interface CaseMap {
  setupMap: (ctx: WorldContext) => void
  update?: (dt: number, now: number) => void
  onInteract?: (id: string, ctx: InteractContext) => void
  onFlagChange?: (k: string, v: FlagValue, ctx: FlagChangeContext) => void
  onClueAdded?: (clueId: string, ctx: ClueAddedContext) => void
  drawMinimap?: (ctx: CanvasRenderingContext2D, player: THREE.Group) => void
  getObjectives?: (G: GameState) => ObjectivesResult
  openGate?: (G: GameState, setFlagFn: (k: string, v?: FlagValue) => void) => void
  applyWorldFromFlags?: (G: GameState) => void
  zoneAt?: (x: number, z: number) => { id: string; n: string } | null
  getHeightAt?: (x: number, z: number) => number
  NPCS?: Record<string, NpcConfig | NpcEntity>
}

export interface CaseDefinition {
  id: string
  title: string
  subtitle?: string
  meta: CaseMeta
  audio?: {
    bgm?: string
    voiceDir?: string
  }
  clues: Record<string, Clue>
  clueTotal: number
  items?: Record<string, Item>
  itemMesh?: (id: string) => THREE.Object3D
  questState?: (G: GameState) => string
  dialogue: DialogueDefinition
  board: BoardDefinition
  trial: TrialDefinition
  map: CaseMap
  getObjectives?: (G: GameState) => ObjectivesResult
}

export interface HistoryItem {
  s: string
  t: string
}

export interface GameState {
  attrs: AttrStats
  xp: number
  level: number
  points: number
  checks: number
  flags: Record<string, FlagValue>
  clues: string[]
  inventory: string[]
  zones: Record<string, number>
  talked: Record<string, number>
  board: BoardState
  history: HistoryItem[]
  verdict: string | null
  flavorXP: Record<string, number>
  started: boolean
  musicOn: boolean
  voiceOn: boolean
  luSpent?: number
}

export type InteractKind = 'clue' | 'npc' | 'item' | 'prop' | 'system' | 'env' | 'board' | (string & {})

export interface InteractiveItem {
  mesh: THREE.Object3D
  id: string
  name: string
  kind: InteractKind
  hidden?: boolean
}

export interface WorldLabel {
  getPos: () => THREE.Vector3
  html?: string
  cls?: string
  cond?: () => boolean
  el: HTMLElement
}

export interface MistParticle {
  vx: number
  vz: number
  baseY: number
  phase: number
}

export interface SparkParticle {
  vx: number
  vy: number
  vz: number
  life: number
  age: number
  seed: number
}

export interface SmokeParticle {
  vy: number
  life: number
  age: number
  seed: number
}

export interface SplashParticle {
  life: number
  age: number
}

export interface FountainDropParticle {
  vx: number
  vy: number
  vz: number
  age: number
}

export interface MoteParticle {
  lx: number
  lz: number
  rad: number
  ang: number
  spd: number
  bob: number
}

export interface SnowParticle {
  vx: number
  vy: number
  vz: number
}

export interface SolidHouseOptions {
  frontDoor?: boolean
  doorSide?: 'left' | 'right'
}
