import type { DialogueLineItem, FormattedDialogueLine } from '../../types'

export const DIALOGUE_LINES: Record<string, DialogueLineItem> = {
  // 1. 见习巡士 托马斯 (thomas)
  thomas_intro: {
    id: 'thomas_intro',
    npc: 'thomas',
    speaker: '巡士 托马斯',
    prompt: '年轻巡警，在暴风雪呼啸的门廊下焦虑而警惕地汇报。',
    text: '谢天谢地您终于穿过黑松林赶到了，侦探！暴风雪把下山的吊桥全压垮了，庄园现在成了彻底的孤岛。老男爵死在西北角二楼的书房，门是从里面反锁的！',
    tts: '谢天谢地您终于赶到了，侦探！暴风雪把下山的吊桥压垮了，庄园成了彻底的孤岛。老男爵死在二楼书房，门是从里面反锁的！',
  },
  thomas_t1: {
    id: 'thomas_t1',
    npc: 'thomas',
    speaker: '巡士 托马斯',
    prompt: '年轻巡警，压低声音讲述密室现场与尸体异状。',
    text: '午夜零点钟响时，莫里斯管家去送夜宵，发现房门反锁且毫无应答。我们强行撞开橡木门后……男爵胸口插着一柄纯银拆信刀倒在书桌旁，地毯上全是摔碎的茶杯和苦杏仁怪味。',
    tts: '午夜零点莫里斯管家去送夜宵，发现房门反锁。撞开门后，男爵胸口插着纯银拆信刀倒在书桌旁，地毯上有摔碎的茶杯和苦杏仁怪味。',
  },
  thomas_t2: {
    id: 'thomas_t2',
    npc: 'thomas',
    speaker: '巡士 托马斯',
    prompt: '年轻巡警，神情紧张地清点涉案人员。',
    text: '暴风雪将所有人都关在了庄园内：续弦的艾莲娜夫人、背负巨债的长子朱利安少爷、家庭医生凡森特博士、老管家莫里斯，还有二楼那位盲女琴师塞西莉亚小姐。人人都在互相指责！',
    tts: '续弦的艾莲娜夫人、长子朱利安少爷、凡森特医生、老管家莫里斯，还有盲女琴师塞西莉亚。所有人都在互相指责！',
  },
  thomas_t3: {
    id: 'thomas_t3',
    npc: 'thomas',
    speaker: '巡士 托马斯',
    prompt: '年轻巡警，倒吸一口凉气，赞叹侦探的洞察。',
    text: '您说的没错！门栓是极其厚重的实心黄铜条，两扇大窗也从内部死死扣牢。如果凶手是在室内动的手，他是怎么在门窗全锁死的情况下凭空蒸发的？',
    tts: '门栓是极厚的黄铜条，窗户也从内部扣牢。凶手是怎么在门窗全锁死的情况下凭空蒸发的？',
  },
  thomas_hub_default: {
    id: 'thomas_hub_default',
    npc: 'thomas',
    speaker: '巡士 托马斯',
    prompt: '年轻巡警守在门厅待命。',
    text: '我已经封锁了前廊。书房在西北主楼二楼，温室在西南侧，东翼是客房与医务室。您需要任何协助请随时吩咐。',
    tts: '我已经封锁了前廊。书房在主楼二楼，温室在西南，东翼是客房与医务室。请随时吩咐。',
  },
  thomas_hub_clues: {
    id: 'thomas_hub_clues',
    npc: 'thomas',
    speaker: '巡士 托马斯',
    prompt: '年轻巡警钦佩地注视侦探记录本。',
    text: (count = '') => `您已经梳理出${ count }件核心物证了！这深宅大院里的谎言和迷雾，正在被您一点点撕开。`,
    tts: '物证已经陆续被梳理出来了。这深宅大院里的谎言和迷雾，正在被您一点点撕开。',
  },
  thomas_hub_verdict: {
    id: 'thomas_hub_verdict',
    npc: 'thomas',
    speaker: '巡士 托马斯',
    prompt: '年轻巡警神色庄严。',
    text: '全案证据链已经彻底闭合了吗？所有人都聚集在大厅等候您的最终判定。这场风雪夜的审判，全由您来定夺！',
    tts: '全案证据链已经彻底闭合了吗？所有人都聚集在大厅等候您的最终判定。',
  },
  thomas_weather: {
    id: 'thomas_weather',
    npc: 'thomas',
    speaker: '巡士 托马斯',
    prompt: '年轻巡警望向窗外的狂暴风雪。',
    text: '巡逻马车在断桥边彻底陷进了雪坑。天亮前绝不会有任何援军能登上山顶——在暴风雪平息之前，正义只能靠我们自己伸张。',
    tts: '天亮前绝不会有任何援军能登上山顶，在暴风雪平息之前，正义只能靠我们自己伸张。',
  },

  // 2. 老管家 莫里斯 (morris)
  morris_init: {
    id: 'morris_init',
    npc: 'morris',
    speaker: '老管家 莫里斯',
    prompt: '暮年老管家，身着一丝不苟的燕尾黑服，神色肃穆冰冷。',
    text: '侦探先生，我在这座庄园侍奉了四十年。男爵阁下的暴毙令人扼腕，但若是有人妄图借此构陷无辜之人，老朽绝不会坐视不理。',
    tts: '侦探先生，我在这座庄园侍奉了四十年。男爵阁下的暴毙令人扼腕，但若是有人妄图构陷无辜，老朽绝不坐视。',
  },
  morris_again: {
    id: 'morris_again',
    npc: 'morris',
    speaker: '老管家 莫里斯',
    prompt: '老管家手扶黄铜拐杖，眼神深邃。',
    text: '庄园的每一把黄铜钥匙都在我腰间。您还想向老朽打听什么？',
    tts: '庄园的每一把黄铜钥匙都在我腰间。您还想向老朽打听什么？',
  },
  morris_midnight: {
    id: 'morris_midnight',
    npc: 'morris',
    speaker: '老管家 莫里斯',
    prompt: '老管家条理分明地陈述撞门过程。',
    text: '23:50，我照例端着男爵每晚所需的药茶走上二楼。敲门三次毫无应答，但门缝下透着微弱烛火。直到午夜钟声骤停，我察觉不祥，才唤来托马斯巡士一同合力破门。',
    tts: '23点50我端药茶走上二楼，敲门毫无应答。直到午夜钟声骤停，我察觉不祥，才唤来托马斯巡士合力破门。',
  },
  morris_will: {
    id: 'morris_will',
    npc: 'morris',
    speaker: '老管家 莫里斯',
    prompt: '老管家嘴角泛起冷笑，眼神充满压抑的厌弃。',
    text: '壁炉里的残卷？哼……男爵生前狂妄贪婪，他得知自己肺疾无救后，便立誓死后也不给任何人留下一枚铜板。他要将庄园捐给教会，把全家人沦为乞丐——这就是他所谓的男爵威严。',
    tts: '男爵生前狂妄贪婪，得知自己肺疾无救后，立誓死后也不给任何人留下一枚铜板。他要把全家人沦为乞丐。',
  },
  morris_mine: {
    id: 'morris_mine',
    npc: 'morris',
    speaker: '老管家 莫里斯',
    prompt: '老管家身躯微震，眼神颤抖，吐露尘封二十年的血泪。',
    text: '您……您竟然翻出了当年的矿难血账？！二十年前在黑杉矿井下，三十四条汉子活活被炸断的坑道闷死！理查德先生原本要向法庭控告男爵私吞银矿，却被男爵一并炸死在井底……这是作孽啊！',
    tts: '您竟然翻出了当年的矿难血账？！二十年前三十四条汉子被活活闷死在井下！这是男爵造的滔天孽债啊！',
  },
  morris_key: {
    id: 'morris_key',
    npc: 'morris',
    speaker: '老管家 莫里斯',
    prompt: '老管家递出一把黄铜钥匙。',
    text: '既然您查到了这份上……这是东翼医务室与药柜暗格的黄铜钥匙。凡森特医生平日行事谨小慎微，或许您该亲自去他的药箱里看个明白。',
    tts: '既然您查到了这份上，这是东翼医务室与药柜的钥匙。或许您该亲自去凡森特医生的药箱里看个明白。',
  },

  // 3. 续弦夫人 艾莲娜 (eleanor)
  eleanor_init: {
    id: 'eleanor_init',
    npc: 'eleanor',
    speaker: '艾莲娜 夫人',
    prompt: '年轻美貌的遗孀，面容惨白，披着黑貂绒披风，眼神闪烁着惊恐。',
    text: '侦探先生……他们都说是我在茶里下了毒。可我发誓，我昨晚只是照常将安神茶放在书桌上，我离开时男爵还活得好好的！',
    tts: '侦探先生，他们都说是我在茶里下了毒。可我发誓，我离开书房时男爵还活得好好的！',
  },
  eleanor_again: {
    id: 'eleanor_again',
    npc: 'eleanor',
    speaker: '艾莲娜 夫人',
    prompt: '艾莲娜在温室的花架旁，手指无意识地摩挲着花茎。',
    text: '温室里的雪花莲开了，可在这座牢笼里，美丽不过是腐烂的序幕。您还想向我求证什么？',
    tts: '温室里的雪花莲开了，可在这座牢笼里，美丽不过是腐烂的序幕。您还想求证什么？',
  },
  eleanor_tea: {
    id: 'eleanor_tea',
    npc: 'eleanor',
    speaker: '艾莲娜 夫人',
    prompt: '艾莲娜情绪失控，露出手腕上发紫的陈年鞭痕。',
    text: '是！我承认我在茶里混了苦扁桃汁！三年了，他把我关在庄园当做玩物和出气筒，喝醉了就拿马鞭抽我！可昨晚我把茶端过去时，他正因哮喘剧烈呛咳，嫌茶水太烫，一巴掌就把杯子打翻在厚地毯上！他根本没喝啊！',
    tts: '我承认我在茶里混了苦扁桃汁！可昨晚他嫌茶烫，一巴掌打翻了杯子！他根本没喝啊！',
  },
  eleanor_candle: {
    id: 'eleanor_candle',
    npc: 'eleanor',
    speaker: '艾莲娜 夫人',
    prompt: '艾莲娜回忆烛台制作细节，语气困惑。',
    text: '书桌上的沉香止痛蜡烛？那确实是我在温室用天然蜂蜡熔铸的，但配方是凡森特医生亲自调配的草药油。医生说沉香能平复男爵夜间的痉挛哮喘……我从未碰过蜡芯基座！',
    tts: '沉香蜡烛确实是我在温室用天然蜂蜡熔铸的，但配方是凡森特医生调配的。我从未碰过蜡芯基座！',
  },
  eleanor_relief: {
    id: 'eleanor_relief',
    npc: 'eleanor',
    speaker: '艾莲娜 夫人',
    prompt: '艾莲娜虚脱地捂住脸颊，泪水浸透手绢。',
    text: '男爵死了……无论凶手是谁，这片笼罩我三年的噩梦总算破晓了。求您查明真正的死因，别让我为不属于我的罪名陪葬。',
    tts: '男爵死了，笼罩我三年的噩梦总算结束了。求您查明真正的死因，别让我为莫须有的罪名陪葬。',
  },

  // 4. 长子 朱利安 (julian)
  julian_init: {
    id: 'julian_init',
    npc: 'julian',
    speaker: '朱利安 · 维恩',
    prompt: '满脸胡茬、衣领凌乱的年轻贵族少爷，在客房内暴躁而慌恐地低吼。',
    text: '看什么看？！纯银拆信刀是我的又怎样？！那老头子整天想着把我逼死，老子昨晚喝多了确实吼过要给他放血，但人绝对不是我杀的！',
    tts: '纯银拆信刀是我的又怎样？！老子昨晚喝多了确实吼过要给他放血，但人绝对不是我杀的！',
  },
  julian_again: {
    id: 'julian_again',
    npc: 'julian',
    speaker: '朱利安 · 维恩',
    prompt: '朱利安十指插进头发，神经质地来回踱步。',
    text: '该死的高利贷！该死的遗嘱！大侦探，你到底查出什么来了？别把老子往绞刑架上推！',
    tts: '该死的高利贷！该死的遗嘱！大侦探，你到底查出什么来了？别把老子往绞刑架上推！',
  },
  julian_knife: {
    id: 'julian_knife',
    npc: 'julian',
    speaker: '朱利安 · 维恩',
    prompt: '朱利安瘫坐在扶手椅上，冷汗浸透后背，彻底坦白。',
    text: '我说！我都招！黑帮逼我周日前还清三千金币，否则砍我双手。昨夜午夜钟响后，我偷溜进书房想撬开保险箱偷无记名债券。可我推门进去……老头子早就全身僵硬翻白眼死在椅子上了！地上全是苦杏仁味！',
    tts: '黑帮逼我周日前还清三千金币！昨夜我溜进书房想偷债券，可老头子早就全身僵硬死在椅子上了！地上全是苦杏仁味！',
  },
  julian_stab: {
    id: 'julian_stab',
    npc: 'julian',
    speaker: '朱利安 · 维恩',
    prompt: '朱利安声音带着哭腔与无尽悔恨。',
    text: '我吓得魂飞魄散！晚餐时全家人都听见我威胁要杀他，如果让人发现他暴毙，我跳进泰晤士河也洗不清！我猪油蒙了心，拔下身上的拆信刀捅进他胸口，想伪造成盗贼入室刺杀……刀捅进去时连一滴血都没溅出来，他早就死了啊！',
    tts: '我吓疯了！生怕别人以为是我毒死的，我拔下拆信刀捅进他胸口想伪造强盗刺杀。可刀捅进去连血都没溅出来，他早死了啊！',
  },

  // 5. 家庭医生 凡森特 (vincent)
  vincent_init: {
    id: 'vincent_init',
    npc: 'vincent',
    speaker: '凡森特 医生',
    prompt: '身着笔挺深灰呢大衣、戴金丝眼镜的绅士医师，神态端详优雅。',
    text: '暴风雪封山，庄园却发生这等悲剧，实在令人痛心。我是男爵的主治医生凡森特。侦探阁下，医学检验与伤情鉴定方面，我随时愿意提供协助。',
    tts: '暴风雪封山，庄园却发生这等悲剧。我是男爵的主治医生凡森特，医学与伤情鉴定方面，我随时愿意协助。',
  },
  vincent_again: {
    id: 'vincent_again',
    npc: 'vincent',
    speaker: '凡森特 医生',
    prompt: '凡森特医生整理着手套，目光从镜片后透出深沉的冷峻。',
    text: '死因看似昭然若揭——胸口贯穿伤或是茶水中的氰化物。不知名侦探阁下有何高见？',
    tts: '死因看似昭然若揭，胸口贯穿伤或是茶水中的氰化物。不知名侦探阁下有何高见？',
  },
  vincent_medical: {
    id: 'vincent_medical',
    npc: 'vincent',
    speaker: '凡森特 医生',
    prompt: '凡森特医生有条不紊地分析病情。',
    text: '男爵长年饱受严重肺气肿与支气管痉挛折磨。昨晚我为他准备了常规的抗痉挛草药油，叮嘱他夜间点燃蜡烛吸入蒸汽。若没有那柄残忍的银刀，他原本能在睡梦中安然度过今夜。',
    tts: '男爵长年饱受严重支气管痉挛折磨。我为他准备了常规草药油，若没有那柄残忍的银刀，他原本能在睡梦中安然度过今夜。',
  },
  vincent_confront: {
    id: 'vincent_confront',
    npc: 'vincent',
    speaker: '凡森特 医生',
    prompt: '凡森特医生面色骤然冰冷，摘下金丝眼镜，嘴角扬起凄厉的惨笑。',
    text: '注射针头……乌头碱结晶……还有二十年前的矿难账册。名不虚传的侦探，你竟然全拼凑出来了。没错，那头吞噬了三十四条矿工性命、连我父亲合伙股份都要炸毁吞尽的恶魔，早该在二十年前下地狱了！',
    tts: '注射针头、乌头碱，还有矿难账册。你竟然全拼凑出来了。那头吞噬了三十四条矿工性命的恶魔，早该在二十年前下地狱了！',
  },
  vincent_truth: {
    id: 'vincent_truth',
    npc: 'vincent',
    speaker: '凡森特 医生',
    prompt: '凡森特声音低沉平缓，如在法庭中央做最后的自白。',
    text: '三年来我耐心调理他的肺疾，就是为了亲手为他量身定做这场死局。蜡烛燃烧到午夜前刻，乌头碱蒸发为无形毒雾；重锤发条牵引落锁，让他在绝望中窒息。这是迟到了二十年的审判，我绝不后悔。',
    tts: '三年来我耐心调理他的肺疾，就是为了量身定做这场死局。重锤发条落锁，让他在绝望中窒息。这是迟到了二十年的审判！',
  },

  // 6. 盲女琴师 塞西莉亚 (cecilia)
  cecilia_init: {
    id: 'cecilia_init',
    npc: 'cecilia',
    speaker: '塞西莉亚',
    prompt: '身着白丝绒长裙的盲人年轻少女，坐在羽管键琴前，神色宁静脱俗。',
    text: '风雪声很吵，但琴键不会说谎。您是那位远道而来的侦探先生吧？我的眼睛自幼看不见光明，可整座庄园的一呼一吸，都在我的耳朵里跳动。',
    tts: '风雪声很吵，但琴键不会说谎。我的眼睛自幼看不见，可整座庄园的一呼一吸，都在我的耳朵里跳动。',
  },
  cecilia_again: {
    id: 'cecilia_again',
    npc: 'cecilia',
    speaker: '塞西莉亚',
    prompt: '塞西莉亚指尖抚过黑白琴键，侧耳倾听。',
    text: '您踩在地毯上的步子很轻，说明您是一位敏锐而尊重真相的人。您想听听昨晚琴声背后的秘密吗？',
    tts: '您踩在地毯上的步子很轻，说明您是一位敏锐的人。您想听听昨晚琴声背后的秘密吗？',
  },
  cecilia_sound: {
    id: 'cecilia_sound',
    npc: 'cecilia',
    speaker: '塞西莉亚',
    prompt: '盲女清澈的嗓音娓娓道来昨夜精确的声音时间线。',
    text: '23:15，凡森特医生走过二楼挑空走廊，他的靴跟极轻，伴着微弱的花土潮气；23:30，书房方向传来茶杯碎裂与沉重的倒地声；23:45，大钟内部发出一记细弦崩裂的极微弱脆响；而在零点过后，朱利安少爷才慌慌张张狂奔上楼……',
    tts: '23点15凡森特医生走过挑空走廊；23点30书房传来茶杯碎裂声；23点45大钟发出一记细弦崩裂脆响；零点后朱利安少爷才狂奔上楼。',
  },
  cecilia_mercy: {
    id: 'cecilia_mercy',
    npc: 'cecilia',
    speaker: '塞西莉亚',
    prompt: '盲女低垂眼帘，指尖流淌出一串哀婉的琶音。',
    text: '男爵收留我弹琴，不过是为了在贵族宾客面前炫耀他的宽仁假面。凡森特医生在庄园这三年，曾悄悄给过我许多治疗眼疾的草药……仇恨如同暴风雪，可雪融之后，这片庄园能迎来真正的破晓吗？',
    tts: '凡森特医生在庄园这三年，曾悄悄给过我许多草药。仇恨如同暴风雪，雪融之后，这片庄园能迎来真正的破晓吗？',
  },
}

export function line(id: string, ...params: Array<string | number>): FormattedDialogueLine {
  const item = DIALOGUE_LINES[id]
  if (!item) {
    return { sp: '', tx: '', lineId: id, voiceUrl: null }
  }
  const tx = typeof item.text === 'function' ? item.text(...params) : item.text
  return {
    sp: item.speaker,
    tx,
    lineId: item.id,
    voiceUrl: `${ import.meta.env.BASE_URL }cases/manor/audio/voice/${ item.id }.mp3`,
  }
}

export function findVoiceUrl(text: string): string | null {
  if (!text) {
    return null
  }
  for (const item of Object.values(DIALOGUE_LINES)) {
    const raw = typeof item.text === 'function' ? item.text() : item.text
    if (text === raw || (raw && text.includes(raw.slice(0, 14)))) {
      return `${ import.meta.env.BASE_URL }cases/manor/audio/voice/${ item.id }.mp3`
    }
  }
  return null
}
