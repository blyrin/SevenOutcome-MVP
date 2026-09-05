import type { CutsceneDefinition } from '../../types'

export const manorCutscene: CutsceneDefinition = {
  id: 'manor_intro',
  shots: [
    {
      posFrom: [22, 36, 32],
      posTo: [6, 26, 20],
      lookFrom: [0, 2.0, 0],
      lookTo: [-4, 2.0, -2],
      duration: 3.5,
      title: '雾杉镇疑案 · 鸦羽庄园的秘毒',
      location: '维恩男爵府邸 · 暴风雪之夜',
      caption: '暴风雪切断了孤桥。午夜钟鸣之刻，手握全郡矿权的男爵暴毙于反锁书房。',
      easing: 'smooth',
    },
    {
      posFrom: [-13, 9.5, -4],
      posTo: [-18, 6.4, -7],
      lookFrom: [-20, 2.5, -11],
      lookTo: [-21, 2.5, -12],
      duration: 3.6,
      location: '西翼二楼 · 男爵反锁书房',
      caption: '胸口无血的纯银刺刀、未烬的绝情遗嘱、散发苦扁桃味的摔碎茶杯……',
      easing: 'smooth',
    },
    {
      posFrom: [4, 7.2, -2],
      posTo: [-1, 4.2, -5],
      lookFrom: [-2, 1.2, -9],
      lookTo: [-2, 1.0, -9],
      duration: 3.0,
      location: '中央挑空大厅 · 琴廊',
      caption: '盲眼琴师的琴音在空旷豪宅回荡，同屋异梦的嫌疑人们各怀杀心。',
      easing: 'smooth',
    },
    {
      posFrom: [0, 3.6, 18.5],
      posTo: [0, 20.0, 26.0],
      lookFrom: [-2.0, 1.3, 14.5],
      lookTo: [0, 1.0, 14],
      duration: 2.8,
      location: '正门玄关 · 封控门廊',
      caption: '巡士托马斯已封锁庄园大门，等待着你勘破这间密室死斗。',
      easing: 'smooth',
    },
  ],
}
