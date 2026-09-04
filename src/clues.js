import { addItem, hasFlag } from './state.js'

export const CLUES = {
  clue_hammer: {
    name: '染血的铁锤',
    icon: '🔨',
    tags: ['#凶器'],
    slots: ['weapon'],
    short: '炉边的重锻锤，锤头沾满暗红血迹。',
    detail: '沉重的铁匠锻锤。锤头边缘残留着干涸发黑的血迹与断裂的毛发——正是造成死者颅骨碎裂的凶器。原本挂在炉边工具架上。',
  },
  clue_body: {
    name: '尸检记录',
    icon: '📜',
    tags: ['#尸检', '#时间'],
    slots: ['method'],
    short: '钝器一击致命，逆向上扬创口。',
    detail: '死者汉斯·贝克，头部遭钝器单次重击致颅骨粉碎身亡，推断时间约昨夜十点前后。创口自下而上——挥锤者身材显著矮于死者，且毫无受训痕迹。',
  },
  clue_wounds: {
    name: '玛莎的伤痕',
    icon: '🩹',
    tags: ['#动机'],
    slots: ['motive'],
    short: '手腕臂膀上新旧交错的掐痕淤青。',
    detail: '玛莎挽起衣袖：手腕、小臂至颈侧布满深浅不一、新旧叠印的指痕与击打淤青。那是长达八年家庭暴力的沉默控诉。',
  },
  clue_gossip: {
    name: '街坊证言',
    icon: '🗣️',
    tags: ['#动机'],
    slots: ['motive'],
    short: '整条街心照不宣的长年暴行。',
    detail: '格蕾塔大婶：「汉斯一喝醉就拿玛莎撒气，整整打了八年！整条街巷深更半夜常能听到动静……人死了，玛莎的血泪账也算了了。」',
  },
  clue_pete: {
    name: '皮特的证词',
    icon: '🍺',
    tags: ['#时间'],
    slots: ['method'],
    short: '清醒醉汉拼出的案发关键时间链。',
    detail: '21:00 巴罗在铺门前狠逼汉斯还钱；21:30 巴罗愤然离开朝镇外走去；22:00 铺内传出剧烈打斗与玛莎「别再打了」的哭喊，随后是一声骇人的沉闷钝响。',
  },
  clue_apron: {
    name: '撕碎的围裙',
    icon: '🧵',
    tags: ['#手法'],
    slots: ['method'],
    short: '木桶阴影处搏斗撕扯留下的碎布。',
    detail: '玛莎的麻布围裙被粗暴撕扯成碎片，布料纤维与死者汉斯指缝中提取到的残丝完全吻合——案发前现场曾发生极度激烈的贴身近距搏斗。',
  },
  clue_confession: {
    name: '玛莎的供述',
    icon: '💬',
    tags: ['#手法', '#动机'],
    slots: ['method'],
    short: '「在窒息里，我先拿到了锤子。」',
    detail: '「昨夜他像疯了一样掐住我的脖子，吼着要拿铁锤砸死我。在窒息的绝望里，我只是……比他先摸到了那柄铁锤。然后一切就安静了。」',
  },
  clue_diary: {
    name: '玛莎的日记',
    icon: '📖',
    tags: ['#动机', '#证物'],
    slots: ['motive'],
    short: '八年家庭暴力与求生绝望的手记。',
    detail: '封皮磨损褪色的小本子。泛黄纸页上密密麻麻记录着八年来汉斯的每一次酗酒殴打、恐吓与玛莎无助的哭泣——「如果必须有人死，我希望今夜就彻底结束。」',
  },
  clue_letter: {
    name: '催债恐吓信',
    icon: '✉️',
    tags: ['#嫌疑'],
    slots: ['killer', 'motive'],
    gate: { motive: { psy: 6 } },
    short: '放贷人巴罗发出的最后通牒。',
    detail: '「周五之前见不到三百金币本息，我就带人拆了你的铁匠铺。——巴罗」粗糙信纸被反复揉皱，又被小心翼翼抚平。',
  },
  clue_insurance: {
    name: '人身保险单',
    icon: '🧾',
    tags: ['#嫌疑'],
    slots: ['killer', 'motive'],
    short: '巨额保额一千金币，受益人玛莎。',
    detail: '暗锁铁匣内取出的人身保险凭证，保额高达一千金币，唯一受益人为妻子玛莎。立契于三个月前——正是汉斯陷入巨额高利贷债务的绝望节点。',
  },
  clue_luke: {
    name: '卢克的目击',
    icon: '👁️',
    tags: ['#凶手'],
    slots: ['killer'],
    short: '案发深夜目睹师母手握铁锤跪地。',
    detail: '「后半夜我起来喝水，推开门看见师母跪在血泊里的师父身旁，手里死死攥着那把铁锤。她就那样直勾勾看着我……我吓破了胆逃回屋里。」',
  },
  clue_debt: {
    name: '巴罗的账本',
    icon: '📒',
    tags: ['#嫌疑'],
    slots: ['killer'],
    short: '利滚利抵押，页边批注「人死债空」。',
    detail: '记录汉斯借贷三百金币并以铁匠铺作押的账册。页边有一行巴罗亲笔写下的小字批注：「若他丧命，债便成空。死人还不了钱。」',
  },
}

export const CLUE_TOTAL = Object.keys(CLUES).length

export const ITEMS = {
  clue_hammer: { name: '染血的铁锤', d: '炉火锻造的铁匠工具，如今成了夺命凶器。锤柄上有一道深深的手印——挥动它的人，手在剧烈发抖。' },
  clue_letter: { name: '催债恐吓信', d: '放贷人巴罗字迹粗重如刻。信纸被反复揉皱又被抚平——死者生前曾翻来覆去读了无数遍。' },
  clue_insurance: { name: '人身保险单', d: '巨额保单，保额一千金币。一个背负三百金币债务被逼入绝境的酒鬼，暗中为妻子签下了这份保单。' },
  clue_apron: { name: '撕碎的围裙', d: '粗麻布料撕裂边缘参差破碎，纤维里浸透着铁锈、灰尘与暗黑血迹，见证着生死存亡的撕打。' },
  clue_diary: { name: '玛莎的日记', d: '磨损得发白的暗角日记。第一页写着：「他又动手了。」字迹从颤抖逐渐化作冰冷而绝望的死寂。' },
  wallet: { name: '皮特的钱包', d: '磨破了皮角的棕色旧牛皮夹，里面放着几枚薄铜板与一张泛黄褪色的老画像。该还给它的主人了。' },
}

export function addDiaryItem() {
  addItem('clue_diary')
}

export function questState() {
  return hasFlag('walletReturned') ? 'done' : (hasFlag('walletQuest') ? 'active' : 'idle')
}
