import type { BoardCorrect, BoardSlot, BoardState, BoardWrongMsg } from '../../types'

export const SLOTS: BoardSlot[] = [
  { id: 'killer', n: '嫌疑人', h: '确定实施致命毒杀与机关设计的真凶', code: 'FACTOR 01', icon: '👤' },
  { id: 'weapon', n: '凶 器', h: '造成死者急性中毒呼吸麻痹的致命载体', code: 'FACTOR 02', icon: '🕯️' },
  { id: 'motive', n: '动 机', h: '驱使行凶者设局复仇的核心诱因背景', code: 'FACTOR 03', icon: '⚖️' },
  { id: 'method', n: '手 法', h: '封闭书房内完成延时毒杀与密室锁闭的诡计', code: 'FACTOR 04', icon: '⏳' },
]

export const CORRECT: BoardCorrect = {
  killer: ['clue_syringe', 'clue_piano_witness', 'clue_footprints'],
  weapon: ['clue_candle'],
  motive: ['clue_mine_ledger', 'clue_will_remnant'],
  method: ['clue_clock_device', 'clue_autopsy_vane'],
}

export const WRONGMSG: BoardWrongMsg = {
  'killer:clue_julian_gloves': '朱利安的血手套与家徽银刀只是幌子——法医证实银刀系死后补刺，长子并非夺命真凶。',
  'killer:clue_eleanor_herbs': '艾莲娜夫人的苦扁桃手记证明她曾企图在茶中下毒，但男爵嫌烫打翻茶杯，未曾咽下一滴。',
  'weapon:clue_silver_knife': '银质拆信刀虽然深刺胸口，但创口边缘全无生活反应与渗血——它是死后刺入的伪造凶器。',
  'weapon:clue_tea_cup': '骨瓷茶杯中虽有氰化物残液，但男爵胃部与食道没有任何灼伤充血，毒茶并非致命武器。',
  'motive:clue_eleanor_herbs': '夫人的草药手记揭露了家庭暴力的痛苦，但无法解释医用器械与精巧机械时钟机关的深远布局。',
  'motive:clue_julian_gloves': '赌债恐慌是长子朱利安半夜潜入盗窃的由头，而非这场精密毒杀与二十年仇恨的根源。',
  'method:clue_tea_cup': '茶水只是现场打翻的意外物证，无法解释死者如何在门窗紧锁的封闭密室中突然窒息毙命。',
  'method:clue_silver_knife': '胸前刺刀是长子为了伪造盗贼行凶而补上的败笔，而非构筑反锁密室的技术手法。',
}

export function getDeduceText(b: BoardState): string {
  const ktxt = b.killer === 'clue_syringe'
    ? '医用铜注射器上提取到的指纹与乌头碱熔蜡残余'
    : (b.killer === 'clue_piano_witness'
      ? '盲女琴师在风雪夜辨认出的医生轻靴步幅与发条崩弦声'
      : '通往温室与书房走廊上沾染特殊花泥的皮靴痕迹')
  const mtxt = b.motive === 'clue_mine_ledger'
    ? '二十年前黑杉银矿三十四名矿工惨遭沉井的滔天血债'
    : '剥夺全家继承权、将全员逼入绝路的残酷遗嘱'
  const methtxt = b.method === 'clue_clock_device'
    ? '机械挂钟重锤下坠、利用熔锡与丝弦自动锁死黄铜门栓的密室延时机关'
    : '在密闭书房内蒸发扩散的雪上乌头碱剧毒气溶胶，配合死后伪刺的障眼法'

  return `全案真相大白：综合${ ktxt }，凡森特医生背负着${ mtxt }，利用男爵夜间必点沉香缓解肺疾的习惯，将高纯度雪上乌头碱暗中注入蜡烛基座；当火焰灼烧到底部时毒雾瞬间充斥书房导致死者窒息暴毙，再借助${ methtxt }，完美伪造出从内锁死的绝对密室——朱利安死后的慌乱补刀与艾莲娜被打翻的毒茶，皆成了掩护这场复仇行刑的迷雾。`
}
