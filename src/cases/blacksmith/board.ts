import type { BoardCorrect, BoardSlot, BoardState, BoardWrongMsg } from '../../types'

export const SLOTS: BoardSlot[] = [
  { id: 'killer', n: '嫌疑人', h: '确定实施致命行为的涉案人员', code: 'FACTOR 01', icon: '👤' },
  { id: 'weapon', n: '凶 器', h: '造成死者头部重创的直接物证', code: 'FACTOR 02', icon: '🔨' },
  { id: 'motive', n: '动 机', h: '诱发致命冲突的核心诱因背景', code: 'FACTOR 03', icon: '⚖️' },
  { id: 'method', n: '手 法', h: '案发当晚搏斗与致死的具体过程', code: 'FACTOR 04', icon: '⏳' },
]

export const CORRECT: BoardCorrect = {
  killer: ['clue_luke', 'clue_confession'],
  weapon: ['clue_hammer'],
  motive: ['clue_wounds', 'clue_gossip', 'clue_diary'],
  method: ['clue_apron', 'clue_confession'],
}

export const WRONGMSG: BoardWrongMsg = {
  'killer:clue_letter': '恐吓信只能证实巴罗曾粗暴逼债，但老皮特的证言证实其案发前便已离去前往镇外。',
  'killer:clue_insurance': '保险单虽以玛莎为唯一受益人，但不足以直接证明致命行为的实施者——你需要目击证词或核心供述。',
  'killer:clue_debt': '账册批注反证巴罗绝不希望汉斯丧命——死人无法还钱，放贷者缺乏行凶动机。',
  'motive:clue_letter': '恐吓逼债是外部经济纠纷，而非当晚室内爆发殊死反抗的根源。深埋在背后的动机关乎绝境求生。',
  'motive:clue_insurance': '保单系汉斯暗中投保，无法解释案发现场的惨烈搏斗与撕碎衣物。这不是一场谋财害命。',
  'method:clue_body': '尸检报告锁定了致死伤情与逆向创口，但手法要素需要更具现场动态与搏杀撕扯的直接物证。',
  'method:clue_pete': '时间线锁定了案发时序，但手法要素需要还原室内贴身搏斗与反击抗争的物质痕迹。',
}

export function getDeduceText(b: BoardState): string {
  const mtxt = b.motive === 'clue_wounds'
    ? '长年累月遭受暴虐摧残的深渊'
    : (b.motive === 'clue_diary' ? '血泪日记所控诉的八年家庭暴力绝境' : '整条街坊心照不宣的暴虐苦难')
  const ktxt = b.killer === 'clue_luke' ? '学徒卢克的目击证词与遗孀玛莎的现场痕迹' : '玛莎·贝克的自首供述与现场撕斗物证'
  return `综合${ ktxt }，玛莎身陷${ mtxt }，在昨夜汉斯醉酒施暴、濒临窒息的极度危局之中拼死挣扎，摸起炉边铁锤逆向挥出了求生反击——此案系极端暴力威胁下的紧急自卫，绝非蓄意谋杀。`
}
