import type { AttrKey, AttrMeta } from './types'

export const $ = <T extends HTMLElement = HTMLElement>(id: string): T => {
  return document.getElementById(id) as T
}

export const clamp = (v: number, a: number, b: number): number => Math.max(a, Math.min(b, v))
export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t
export const rand = (a: number, b: number): number => a + Math.random() * (b - a)
export const dist2 = (ax: number, az: number, bx: number, bz: number): number => Math.hypot(ax - bx, az - bz)

export const ATTRS: Record<AttrKey, AttrMeta> = {
  int: { n: '智力', i: '🧠', d: '推理·逻辑漏洞' },
  ins: { n: '洞察力', i: '👁', d: '痕迹·细节' },
  psy: { n: '心理学', i: '🎭', d: '动机·谎言' },
  strw: { n: '街头智慧', i: '🗝', d: '交涉·规矩' },
  kno: { n: '学识', i: '📚', d: '尸检·法律' },
}

export const ATTR_LABELS: Record<AttrKey, string> = {
  int: '智力',
  ins: '洞察力',
  psy: '心理学',
  strw: '街头智慧',
  kno: '学识',
}
