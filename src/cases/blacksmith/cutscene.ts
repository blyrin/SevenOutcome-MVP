import type { CutsceneDefinition } from '../../types'

export const blacksmithCutscene: CutsceneDefinition = {
  id: 'blacksmith_intro',
  shots: [
    {
      posFrom: [-24, 38, 32],
      posTo: [-12, 28, 22],
      lookFrom: [-5, 0, -5],
      lookTo: [0, 0, 0],
      duration: 3.5,
      title: '雾杉镇疑案 · 铁匠之死',
      location: '雾杉镇 · 宵禁清晨',
      caption: '浓雾锁镇，晨钟未鸣。一桩疑点重重的命案打破了边陲小镇的死寂。',
      easing: 'smooth',
    },
    {
      posFrom: [-12, 8.5, -6],
      posTo: [-17, 5.0, -10],
      lookFrom: [-18, 0.5, -14],
      lookTo: [-19, 0.6, -14.5],
      duration: 3.6,
      location: '西区 · 铁匠铺案发现场',
      caption: '铁匠汉斯倒在冷透的锻炉旁，颅骨受钝器重击碎裂……',
      easing: 'smooth',
    },
    {
      posFrom: [6, 8.0, -6],
      posTo: [3, 5.8, 2],
      lookFrom: [0, 1.0, -2],
      lookTo: [0, 1.0, 3],
      duration: 3.0,
      location: '中央 · 集市广场与喷泉',
      caption: '遗孀、学徒、债主、酒客，每个人都在迷雾中隐藏着不可言说的秘密。',
      easing: 'smooth',
    },
    {
      posFrom: [-1.2, 3.8, 14.5],
      posTo: [0, 19.0, 22.0],
      lookFrom: [-2.5, 1.3, 5.2],
      lookTo: [0, 1.0, 10],
      duration: 2.8,
      location: '集市警戒线 · 警长雷诺',
      caption: '现场已全面封锁，警长雷诺正等待着你的侦查判断……',
      easing: 'smooth',
    },
  ],
}
