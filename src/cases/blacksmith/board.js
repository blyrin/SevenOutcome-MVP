export const SLOTS = [
  { id: 'killer', n: '嫌疑人', h: '确定实施致命行为的涉案人员', code: 'FACTOR 01', icon: '👤' },
  { id: 'weapon', n: '凶 器', h: '造成死者头部重创的直接物证', code: 'FACTOR 02', icon: '🔨' },
  { id: 'motive', n: '动 机', h: '诱发致命冲突的核心诱因背景', code: 'FACTOR 03', icon: '⚖️' },
  { id: 'method', n: '手 法', h: '案发当晚搏斗与致死的具体过程', code: 'FACTOR 04', icon: '⏳' },
]

export const CORRECT = {
  killer: ['clue_luke'],
  weapon: ['clue_hammer'],
  motive: ['clue_wounds', 'clue_gossip', 'clue_diary'],
  method: ['clue_apron', 'clue_confession'],
}

export const WRONGMSG = {
  'killer:clue_letter': '恐吓信只能证明巴罗曾粗暴逼债——但皮特的证词已证实他在案发前就朝镇外走去了。',
  'killer:clue_insurance': '你指认的嫌疑人虽符合逻辑，但保险单本身并非直接行凶凭证——你需要目击行凶现场的关键人证。',
  'killer:clue_debt': '账册批注恰恰证实巴罗绝不希望汉斯丧命——对放贷者而言，死人无法兑现半个铜板。',
  'motive:clue_letter': '恐吓是追讨债务的手段，而非当晚铺中殊死反抗的诱因。深埋在背后的动机关乎生存与尊严。',
  'motive:clue_insurance': '谋财害命？保单是汉斯暗自立下的，且无法解释铺中剧烈搏斗与被撕碎的衣物。',
  'method:clue_body': '尸检报告揭示了死因与伤势，但手法要素需要更具现场动态与搏斗细节的直接物证。',
  'method:clue_pete': '时间线锁定了案发时序，但手法要素需要还原具体搏斗反击的物质痕迹。',
}

export function getDeduceText(b) {
  const mtxt = b.motive === 'clue_wounds'
    ? '长年家庭暴力的阴影'
    : (b.motive === 'clue_diary' ? '血泪日记记录的绝望深渊' : '整条街巷心照不宣的苦难')
  return `玛莎·贝克在${ mtxt }中，于昨夜暴徒施暴的生死危局里拼死自卫，抓起炉边铁锤挥出了绝望的反击——这是悲剧性的紧急自卫，绝非蓄意谋杀。`
}
