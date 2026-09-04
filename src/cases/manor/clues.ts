import * as THREE from 'three'
import { leatherTex, linenTex, mat } from '../../world'
import { hasFlag } from '../../state'
import type { Clue, Item } from '../../types'

export const CLUES: Record<string, Clue> = {
  clue_silver_knife: {
    name: '纯银拆信刀',
    icon: '🗡️',
    tags: ['#物证', '#疑点'],
    slots: ['weapon'],
    short: '插在死者胸口正中的朱利安家徽银刀。',
    detail: '老男爵胸口正中贯穿的家族银质拆信刀，刀柄錾刻着长子朱利安的专属飞鹰家徽。然而刀刃刺入极深，创口周遭却没有喷溅状血迹，且创缘肌肉组织泛白微干，呈现出极为反常的死后创伤征兆。',
  },
  clue_autopsy_vane: {
    name: '男爵尸检记录',
    icon: '📜',
    tags: ['#尸检', '#死因'],
    slots: ['method'],
    short: '胸口创口无生活反应，死于气溶性剧毒。',
    detail: '尸表详查报告：死者瞳孔极度散大、面颊呈青紫色、口鼻处有带微沫黏液溢出，死因确系吸入剧毒乌头碱导致呼吸中枢麻痹及室颤猝亡，推断死亡时间为昨夜23:30左右。尤为关键的是：胸口银刀刺伤处皮下出血不足两毫升，完全无生活反应，系死后至少二十分钟补刺。',
  },
  clue_tea_cup: {
    name: '打翻的骨瓷茶杯',
    icon: '🍵',
    tags: ['#毒素', '#伪装'],
    slots: ['method'],
    short: '散发苦扁桃味的残茶，但食道无灼痕。',
    detail: '书桌旁厚羊毛地毯上摔碎的精细骨瓷茶杯，杯壁残留着昨夜艾莲娜夫人送来的晚安红茶，检出高浓度苦杏仁苷（氰化物毒素）。然而法医剖验表明死者胃部与食道空空如也，连一滴毒茶也未曾饮下——茶杯是在争执或抽搐中被打翻在地的。',
  },
  clue_candle: {
    name: '乌头毒香蜡烛',
    icon: '🕯️',
    tags: ['#凶器', '#毒素'],
    slots: ['weapon'],
    short: '暗藏皮下注射孔的延时蒸发毒蜡烛。',
    detail: '死者每晚用来缓解肺疾痉挛的沉香镇痛蜡烛。在距蜡芯底部约两厘米（恰好燃烧至昨夜23:30高度）的位置，赫然发现一个极微小的皮下注射针眼！蜡脂深层浸透了高纯度雪上乌头碱结晶——点燃升温后瞬间汽化为致命毒雾，将封闭书房化作窒息毒气室。',
  },
  clue_syringe: {
    name: '医用铜注射器',
    icon: '💉',
    tags: ['#凶手', '#物证'],
    slots: ['killer', 'weapon'],
    short: '针管残留微量乌头碱与蜡烛蜜蜡碎屑。',
    detail: '在医务室暗格内搜缴出的精密黄铜注射器。针尖内壁提取到了微量熔蜡附着物与高纯度乌头碱酊剂残余；针筒刻度磨损处留有凡森特医生的右手食指指纹。',
  },
  clue_will_remnant: {
    name: '未烧尽的遗嘱',
    icon: '📄',
    tags: ['#动机'],
    slots: ['motive'],
    short: '剥夺所有亲眷继承权、全捐教会的通牒。',
    detail: '壁炉灰烬中抢救出的羊皮纸遗嘱残页：男爵定于今夜正式签字生效——将名下全部银矿山、土地与鸦羽庄园全数捐赠教区枢机处；长子朱利安分文不得，续弦夫人艾莲娜将被驱逐净身出户，侍从与琴师全数遣散。男爵视身边所有人为蠹虫，企图在死前毁掉一切。',
  },
  clue_mine_ledger: {
    name: '黑杉矿难血账',
    icon: '📓',
    tags: ['#动机', '#秘辛'],
    slots: ['motive'],
    short: '二十年前三十四条矿工沉井冤魂的名册。',
    detail: '老管家暗柜密藏的二十年前黑杉银矿事故真相：老男爵为了私吞合伙人股份与隐匿富银矿脉，亲手下令引爆坑道炸药，活活闷死井下三十四名矿工。罹难领头人理查德的遗孤名单赫然在目——其幼子正是三年隐姓埋名来到庄园的凡森特医师。',
  },
  clue_clock_device: {
    name: '机械钟延时机关',
    icon: '⚙️',
    tags: ['#手法', '#机关'],
    slots: ['method'],
    short: '重锤下坠拉死黄铜门栓的密室诡计。',
    detail: '书房墙上双面重锤报时挂钟内部被精巧改装：零点钟鸣重锤下坠的力道，通过一段穿引在滑轮上的极细涂蜡丝弦，将内侧厚重黄铜门栓自上而下强行卡死；熔锡薄片在壁炉热流与金属咬合摩擦下迅速脱落，丝弦自动收回齿轮箱——凭空构筑出从内锁死的绝对密室。',
  },
  clue_piano_witness: {
    name: '塞西莉亚的证词',
    icon: '🎹',
    tags: ['#凶手', '#时间'],
    slots: ['killer'],
    short: '盲女绝对音感辨认出的脚步节奏与钟簧声。',
    detail: '整夜在挑空二楼弹琴的盲女塞西莉亚证词：「23:15，走廊传来极轻捷、脚跟几乎不着地的平稳皮靴声，那是凡森特医生特有的步幅；23:45，书房方向隐约传来一声古怪的金属丝弦崩裂清脆轻响；而朱利安少爷那双沉重拖沓的马靴，是在午夜零点钟敲响后才狂乱奔上楼梯的。」',
  },
  clue_julian_gloves: {
    name: '朱利安的血手套',
    icon: '🧤',
    tags: ['#嫌疑'],
    slots: ['killer'],
    short: '沾血的手套与被逼到绝路的恐慌口供。',
    detail: '朱利安房中搜出的鹿皮手套。他面色惨白地坦白：「我昨夜潜进书房想偷保险柜债券还赌债，可推开门老头子早就凉透了倒在地上！我吓疯了，想起晚餐上我吼着要杀他，生怕说不清……我就拔下拆信刀捅进去想装成强盗杀人……可我真没杀他啊！」',
  },
  clue_eleanor_herbs: {
    name: '艾莲娜的温室手记',
    icon: '🌿',
    tags: ['#嫌疑', '#动机'],
    slots: ['killer', 'motive'],
    short: '提炼苦扁桃苷的笔记与逃离深渊的绝望。',
    detail: '温室花房隐秘抽屉里的手记，记录着自苦扁桃核仁提取毒素的方法。最后一页夹着被男爵家暴抽打留下的血手绢：「如果这头魔鬼不肯放我自由，那就由我亲手送他下地狱。」然而茶水未被饮入，她的毒杀在阴差阳错间未能起效。',
  },
  clue_footprints: {
    name: '沾有紫罗兰泥的靴印',
    icon: '👞',
    tags: ['#凶手'],
    slots: ['killer'],
    short: '二楼回廊通往温室与书房的医生皮靴泥迹。',
    detail: '通往二楼走廊地毯边缘提取到的淡紫色泥土微粒，完全吻合温室花房特有的稀有紫罗兰培植土。全庄园只有凡森特医生鞋底有修补花房暖炉时踩留的同种泥迹——证实案发前半小时他曾秘密往返于温室与书房之间。',
  },
}

export const CLUE_TOTAL = Object.keys(CLUES).length

export const ITEMS: Record<string, Item> = {
  clue_silver_knife: {
    name: '纯银拆信刀',
    icon: '🗡️',
    d: '刀身泛着冰冷纯银微光，家徽飞鹰雕纹精美。刀锋虽没入胸膛，却几乎没有带出喷溅血迹——这柄刀并未夺去男爵的生机。',
  },
  clue_candle: {
    name: '乌头毒香蜡烛',
    icon: '🕯️',
    d: '暗灰色的粗蜜蜡烛，靠近能闻到沉香中隐约夹杂的一丝阴冷苦涩。蜡体基座处的细微针孔，是整场毒杀的关键枢纽。',
  },
  clue_syringe: {
    name: '医用铜注射器',
    icon: '💉',
    d: '凡森特医生的专业医疗器械。活塞推进顺滑，针尖微泛绿光，残留的乌头剧毒分子在光下折射出摄人死气。',
  },
  clue_will_remnant: {
    name: '未烧尽的遗嘱残页',
    icon: '📄',
    d: '残缺的羊皮纸浸润着壁炉炭黑。「剥夺长子朱利安继承名分……全部银矿产业赠予教会」——一份将所有人逼向悬崖的绝情书。',
  },
  clue_mine_ledger: {
    name: '黑杉矿难血账',
    icon: '📓',
    d: '密密麻麻记录着二十年前惨遭封井遇难的矿工姓名与抚恤暗扣。一行字迹被鲜红墨水圈出：合伙人理查德·凡森特——沉井殉难。',
  },
  key_clinic: {
    name: '黄铜诊室钥匙',
    icon: '🗝️',
    d: '挂在老管家腰间的一串古老钥匙之一，可以开启庄园东翼紧锁的医生诊室与药柜暗格。',
  },
}

export function questState(): string {
  return hasFlag('mineLedgerFound') ? 'done' : (hasFlag('clinicOpen') ? 'active' : 'idle')
}

export function itemMesh(id: string): THREE.Group {
  const g = new THREE.Group()
  const M = mat

  if (id === 'clue_silver_knife') {
    const bladeGeo = new THREE.ConeGeometry(0.08, 1.2, 4)
    bladeGeo.scale(0.3, 1, 1)
    const blade = new THREE.Mesh(bladeGeo, M(0xdfe6ed, { roughness: 0.2, metalness: 0.9 }))
    blade.position.y = 0.55
    g.add(blade)

    const guard = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.06, 0.1),
      M(0xb89748, { roughness: 0.3, metalness: 0.85 }))
    guard.position.y = -0.05
    g.add(guard)

    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.5, 8),
      M(0x2d1f18, { roughness: 0.5, metalness: 0.2 }))
    handle.position.y = -0.32
    g.add(handle)

    const pommel = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8),
      M(0xb89748, { roughness: 0.3, metalness: 0.85 }))
    pommel.position.y = -0.6
    g.add(pommel)
  } else if (id === 'clue_candle') {
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.24, 0.9, 16),
      M(0xd9ccb8, { roughness: 0.6, metalness: 0.05 }))
    g.add(body)

    const top = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 0.1, 16), M(0xc4b39b, { roughness: 0.7 }))
    top.position.y = 0.48
    g.add(top)

    const wick = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.2, 8), M(0x1a1510, { roughness: 0.9 }))
    wick.position.y = 0.58
    g.add(wick)

    const flame = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.18, 8),
      M(0xffaa22, { emissive: 0xff7700, roughness: 0.2 }))
    flame.position.y = 0.72
    g.add(flame)

    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.42, 0.08, 16),
      M(0x7a6344, { roughness: 0.4, metalness: 0.6 }))
    base.position.y = -0.48
    g.add(base)
  } else if (id === 'clue_syringe') {
    const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.9, 12),
      M(0x8898a8, { roughness: 0.2, metalness: 0.3, transparent: true, opacity: 0.85 }))
    g.add(tube)

    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.02, 0.5, 8), M(0xccd5de, { roughness: 0.2, metalness: 0.9 }))
    tip.position.y = 0.68
    g.add(tip)

    const plunger = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.6, 8),
      M(0xb89748, { roughness: 0.3, metalness: 0.8 }))
    plunger.position.y = -0.55
    g.add(plunger)

    const flange = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.05, 12),
      M(0xb89748, { roughness: 0.3, metalness: 0.8 }))
    flange.position.y = -0.45
    g.add(flange)
  } else if (id === 'clue_will_remnant') {
    const paper = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.2, 0.02), M(0xdfd4bc, { roughness: 0.8 }))
    g.add(paper)

    const charEdge = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.35, 0.03), M(0x2a221a, { roughness: 0.9 }))
    charEdge.position.y = -0.44
    g.add(charEdge)

    const seal = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.04, 12), M(0x882222, { roughness: 0.4 }))
    seal.rotation.x = Math.PI / 2
    seal.position.set(0.24, 0.32, 0.02)
    g.add(seal)
  } else if (id === 'clue_mine_ledger') {
    const cover = new THREE.Mesh(new THREE.BoxGeometry(0.95, 1.3, 0.14),
      M(0x3a251e, { map: leatherTex, roughness: 0.7 }))
    g.add(cover)

    const pages = new THREE.Mesh(new THREE.BoxGeometry(0.88, 1.22, 0.12),
      M(0xdfd3be, { map: linenTex, roughness: 0.8 }))
    pages.position.x = 0.04
    g.add(pages)

    const clasp = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.22, 0.16),
      M(0xb89748, { roughness: 0.3, metalness: 0.8 }))
    clasp.position.set(0.48, 0, 0)
    g.add(clasp)
  } else {
    const keyRing = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.04, 8, 16),
      M(0xb89748, { roughness: 0.3, metalness: 0.85 }))
    keyRing.position.y = 0.3
    g.add(keyRing)

    const keyStem = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.7, 8),
      M(0xb89748, { roughness: 0.3, metalness: 0.85 }))
    keyStem.position.y = -0.1
    g.add(keyStem)

    const keyBit = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.24, 0.04),
      M(0xb89748, { roughness: 0.3, metalness: 0.85 }))
    keyBit.position.set(0.08, -0.32, 0)
    g.add(keyBit)
  }

  return g
}
