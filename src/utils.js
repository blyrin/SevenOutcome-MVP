export const $ = id => document.getElementById(id)
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v))
export const lerp = (a, b, t) => a + (b - a) * t
export const rand = (a, b) => a + Math.random() * (b - a)
export const dist2 = (ax, az, bx, bz) => Math.hypot(ax - bx, az - bz)

export const ATTRS = {
  int: { n: '智力', i: '🧠', d: '推理·逻辑漏洞' },
  ins: { n: '洞察力', i: '👁', d: '痕迹·细节' },
  psy: { n: '心理学', i: '🎭', d: '动机·谎言' },
  strw: { n: '街头智慧', i: '🗝', d: '交涉·规矩' },
  kno: { n: '学识', i: '📚', d: '尸检·法律' },
}

export const ATTR_LABELS = { int: '智力', ins: '洞察力', psy: '心理学', strw: '街头智慧', kno: '学识' }
