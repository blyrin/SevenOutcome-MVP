import * as THREE from 'three'
import { canvasTex, fabricTex, leatherTex, linenTex, mat, woodTex } from '../../world.js'
import { rand } from '../../utils.js'
import { hasFlag } from '../../state.js'

export const CLUES = {
  clue_hammer: {
    name: '染血的铁锤',
    icon: '🔨',
    tags: ['#凶器'],
    slots: ['weapon'],
    short: '炉边的重型锻锤，棱角沾满暗红凝血。',
    detail: '原本架在锻炉工具架上的重型锻锤。锤头平侧与尖端残留着发黑的凝血与断发——经法医比对，完全吻合死者头部的致命创口。锤柄握手处留有剧烈颤抖的汗渍压痕。',
  },
  clue_body: {
    name: '尸检记录',
    icon: '📜',
    tags: ['#尸检', '#时间'],
    slots: ['method'],
    short: '仰面受击创口，自下而上逆向击打。',
    detail: '法医官贝尔签发的尸检报告：死者前额及面颅侧上方遭钝器单次自下而上逆向击打致颅骨粉碎身亡，推断死亡时间在昨夜22:00前后。创口轨迹与受力点证实：行凶者身材矮小，是在被压制在地的危局中向上盲目挥击。（警长初查所谓的“后脑创口”，实为仰面撞击石板地砖形成的二次挫裂）',
  },
  clue_wounds: {
    name: '玛莎的伤痕',
    icon: '🩹',
    tags: ['#动机'],
    slots: ['motive'],
    short: '颈侧新鲜掐痕与双臂陈年累叠的淤青。',
    detail: '玛莎腕部、小臂至颈侧布满新旧交叠的深重淤伤。尤其是咽喉两侧昨夜新留下的指甲抠痕与深紫掐痕，皮下毛细血管严重破裂——直观证实了案发时她曾遭遇濒临窒息的致命扼颈。',
  },
  clue_gossip: {
    name: '街坊证言',
    icon: '🗣️',
    tags: ['#动机'],
    slots: ['motive'],
    short: '街坊听闻的八年施暴与深夜沉闷巨响。',
    detail: '街坊格蕾塔大婶：「汉斯一喝烈酒就拿玛莎往死里打，整整打了八年！昨晚十点多铺子里又是摔打又是哭喊，紧接着『咣当』一声骇人的闷响，然后整条街死一样静……唉，玛莎那苦命女人的血泪债，总算是被逼到了头。」',
  },
  clue_pete: {
    name: '皮特的证词',
    icon: '🍺',
    tags: ['#时间'],
    slots: ['method'],
    short: '酒馆老客拼出的昨夜严密时间链。',
    detail: '老皮特清醒后的关键作证：21:00 巴罗在铺门前狠逼汉斯还钱；21:30 巴罗催逼无果朝镇外河口酒馆愤然离去；22:00 铺内传出剧烈推打撕扯与玛莎「别再打了」的泣血求饶，数分钟后传出一记沉重钝响。',
  },
  clue_apron: {
    name: '撕碎的围裙',
    icon: '🧵',
    tags: ['#手法'],
    slots: ['method'],
    short: '木桶阴影处撕碎的围裙与指缝残丝。',
    detail: '玛莎的粗麻布围裙在铺内木桶旁被暴力扯碎，边缘留有粗暴的拉扯痕迹。其麻布纤维与死者汉斯指甲缝中提取到的残丝完全吻合——证实案发时两人曾陷入殊死贴身搏击。',
  },
  clue_confession: {
    name: '玛莎的供述',
    icon: '💬',
    tags: ['#凶手', '#手法', '#动机'],
    slots: ['killer', 'method', 'motive'],
    short: '「在快要断气前，我先摸到了那柄铁锤。」',
    detail: '玛莎泪痕干涸的自述：「他喝红了眼掐住我的脖子，吼着要拿铁锤把我砸烂在炉坑里。眼前发黑、快要窒息的那一瞬，我的手在地上乱抓，碰巧先摸到了那柄锤子……然后一切就死寂了。」',
  },
  clue_diary: {
    name: '玛莎的日记',
    icon: '📖',
    tags: ['#动机', '#证物'],
    slots: ['motive'],
    short: '泛黄纸页上字字泣血的受虐手记。',
    detail: '藏在梳妆台暗格中的暗角日记。泛黄纸页密密麻麻记录着八年里汉斯数百次酗酒施暴、恐吓与玛莎在深渊中的绝望挣扎——最后一页墨迹斑驳：「如果必须有一个人死，我希望今夜就彻底结束这地狱。」',
  },
  clue_letter: {
    name: '催债恐吓信',
    icon: '✉️',
    tags: ['#嫌疑'],
    slots: ['killer', 'motive'],
    gate: { motive: { psy: 6 } },
    short: '放贷人巴罗字迹狰狞的逼债通牒。',
    detail: '「周五之前见不到三百金币本息，我就带人拆了你的铁匠铺，让你死在野地里。——巴罗」粗糙信纸被汉斯生前反复揉皱又被抚平，浸满冷汗与绝望。',
  },
  clue_insurance: {
    name: '人身保险单',
    icon: '🧾',
    tags: ['#嫌疑'],
    slots: ['killer', 'motive'],
    short: '保额一千金币、受益人为妻的意外保单。',
    detail: '在暗锁铁匣中查获的人身保险契约，保额高达一千金币，唯一受益人是妻子玛莎。立契于三个月前汉斯陷入巨额高利贷的绝境节点——一个自暴自弃的施暴者，在走向毁灭前为受虐妻子留下的最后一条活路。',
  },
  clue_luke: {
    name: '卢克的目击',
    icon: '👁️',
    tags: ['#凶手'],
    slots: ['killer'],
    short: '学徒深夜目睹师母手握铁锤脱力跪地。',
    detail: '学徒卢克战栗的回忆：「昨晚十点多我口渴推门，看见前铺血泊里倒着的师父……师母满脸是泪、脱力跪在旁边，双手还死死攥着那把铁锤。她像丢了魂一样看着我……我吓破了胆，逃回屋里缩了一整夜。」',
  },
  clue_debt: {
    name: '巴罗的账本',
    icon: '📒',
    tags: ['#嫌疑'],
    slots: ['killer'],
    short: '抵押账册页边批注「若他丧命，债便成空」。',
    detail: '巴罗的私人借贷暗账：记录汉斯借贷三百金币并以铁匠铺作押。页边巴罗亲手批注：「若他丧命，债便成空。死人还不了钱，切勿逼死。」——有力排除了巴罗当晚故意杀人谋财的动机。',
  },
}

export const CLUE_TOTAL = Object.keys(CLUES).length

export const ITEMS = {
  clue_hammer: {
    name: '染血的铁锤',
    d: '炉火锻造的铁匠工具，如今成了夺命凶器。锤柄握手处有一道深深的抓痕与手印——挥动它的人，手在剧烈发抖。',
  },
  clue_letter: {
    name: '催债恐吓信',
    d: '放贷人巴罗字迹粗重狠戾。信纸被反复揉皱又被小心抚平——死者生前曾翻来覆去读了无数遍，满是逼入绝路的彷徨。',
  },
  clue_insurance: {
    name: '人身保险单',
    d: '巨额保单，保额一千金币。一个背负巨债被逼入死角的酒鬼，却在绝望中暗暗为常年受虐的妻子立下了这笔契约。',
  },
  clue_apron: {
    name: '撕碎的围裙',
    d: '粗麻布料撕裂边缘参差破碎，纤维里浸透着炉灰、冷汗与暗红血迹，无声诉说着那一夜生死存亡的惨烈撕扯。',
  },
  clue_diary: {
    name: '玛莎的日记',
    d: '磨损得褪色发白的小本子。第一页写着：「他又动手了。」字迹从八年前的颤抖惊惧，逐渐化作冰冷而绝望的死寂。',
  },
  wallet: {
    name: '皮特的钱包',
    d: '磨破了皮角的棕色旧牛皮夹，里面放着几枚薄铜板与一张泛黄褪色的老画像。该还给它的主人了。',
  },
}

export function questState() {
  return hasFlag('walletReturned') ? 'done' : (hasFlag('walletQuest') ? 'active' : 'idle')
}

const letterDocTex = canvasTex(256, 256, (x, w, h) => {
  x.fillStyle = '#f6edd9'
  x.fillRect(0, 0, w, h)
  for (let i = 0; i < 400; i++) {
    x.fillStyle = 'rgba(120, 90, 50, 0.04)'
    x.fillRect(rand(0, w), rand(0, h), rand(2, 6), rand(2, 6))
  }
  x.strokeStyle = 'rgba(160, 120, 80, 0.3)'
  x.lineWidth = 1
  x.strokeRect(10, 10, w - 20, h - 20)
  x.fillStyle = '#221810'
  for (let i = 0; i < 11; i++) {
    const lw = i === 10 ? 80 : rand(160, 210)
    x.fillRect(24, 30 + i * 18, lw, 2.5)
  }
  x.fillStyle = '#7a1818'
  x.beginPath()
  x.arc(200, 215, 18, 0, Math.PI * 2)
  x.fill()
})

const insuranceDocTex = canvasTex(256, 256, (x, w, h) => {
  x.fillStyle = '#f8f2e2'
  x.fillRect(0, 0, w, h)
  x.strokeStyle = '#1e382b'
  x.lineWidth = 3
  x.strokeRect(10, 10, w - 20, h - 20)
  x.strokeStyle = 'rgba(30, 56, 43, 0.4)'
  x.lineWidth = 1
  x.strokeRect(14, 14, w - 28, h - 28)
  x.fillStyle = '#1e382b'
  x.fillRect(20, 20, w - 40, 24)
  x.fillStyle = '#ffffff'
  x.fillRect(28, 30, w - 56, 4)
  x.fillStyle = '#241a14'
  for (let i = 0; i < 10; i++) {
    x.fillRect(22, 60 + i * 15, rand(170, 212), 2)
  }
  x.fillStyle = '#8a1818'
  x.beginPath()
  x.arc(195, 205, 18, 0, Math.PI * 2)
  x.fill()
  x.strokeStyle = '#d4af37'
  x.lineWidth = 2
  x.beginPath()
  x.arc(195, 205, 12, 0, Math.PI * 2)
  x.stroke()
})

const diaryCoverTex = canvasTex(256, 256, (x, w, h) => {
  x.fillStyle = '#421a1e'
  x.fillRect(0, 0, w, h)
  for (let i = 0; i < 600; i++) {
    x.fillStyle = Math.random() < 0.5 ? 'rgba(0, 0, 0, 0.15)' : 'rgba(255, 255, 255, 0.05)'
    x.fillRect(rand(0, w), rand(0, h), 2, 2)
  }
  x.strokeStyle = 'rgba(212, 175, 55, 0.7)'
  x.lineWidth = 3
  x.strokeRect(14, 14, w - 28, h - 28)
  x.strokeStyle = 'rgba(212, 175, 55, 0.4)'
  x.lineWidth = 1
  x.strokeRect(18, 18, w - 36, h - 36)
  x.fillStyle = 'rgba(212, 175, 55, 0.6)'
  x.fillRect(w / 2 - 20, h / 2 - 20, 40, 40)
})

const apronClueTex = canvasTex(256, 256, (x, w, h) => {
  x.fillStyle = '#7a6254'
  x.fillRect(0, 0, w, h)
  for (let i = 0; i < 500; i++) {
    x.fillStyle = Math.random() < 0.5 ? 'rgba(0, 0, 0, 0.12)' : 'rgba(255, 255, 255, 0.08)'
    x.fillRect(rand(0, w), rand(0, h), 2, 2)
  }
  for (let i = 0; i < 18; i++) {
    x.fillStyle = 'rgba(20, 15, 12, 0.35)'
    x.beginPath()
    x.arc(rand(0, w), rand(0, h), rand(8, 25), 0, Math.PI * 2)
    x.fill()
  }
  for (let i = 0; i < 24; i++) {
    const px = rand(30, 226), py = rand(30, 226), r = rand(4, 18)
    x.fillStyle = 'rgba(78, 12, 16, 0.9)'
    x.beginPath()
    x.arc(px, py, r, 0, Math.PI * 2)
    x.fill()
  }
})

export function itemMesh(id) {
  const g = new THREE.Group()
  const M = mat
  if (id === 'clue_hammer') {
    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.075, 1.6, 8), M(0x5a432e, { map: woodTex }))
    handle.rotation.x = Math.PI / 2
    g.add(handle)
    const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.65, 8), M(0x281d14, { map: leatherTex }))
    grip.rotation.x = Math.PI / 2
    grip.position.z = -0.42
    g.add(grip)
    const hd = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.38, 0.52),
      M(0x424954, { roughness: 0.35, metalness: 0.75 }))
    hd.position.z = 0.72
    g.add(hd)
    const peen = new THREE.Mesh(new THREE.ConeGeometry(0.19, 0.28, 4), M(0x3a404a, { roughness: 0.4, metalness: 0.7 }))
    peen.rotation.x = -Math.PI / 2
    peen.position.z = 1.05
    g.add(peen)
    const bl = new THREE.Mesh(new THREE.BoxGeometry(0.39, 0.24, 0.34), M(0x5a1414, { roughness: 0.35 }))
    bl.position.set(0, 0.09, 0.64)
    g.add(bl)
  }
  if (id === 'wallet') {
    const w = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.16, 0.78), M(0x563822, { map: leatherTex, roughness: 0.65 }))
    g.add(w)
    const flap = new THREE.Mesh(new THREE.BoxGeometry(1.06, 0.06, 0.36), M(0x422816, { map: leatherTex, roughness: 0.65 }))
    flap.position.set(0, 0.1, 0.22)
    g.add(flap)
    const clasp = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.04, 8),
      M(0xd4af37, { metalness: 0.9, roughness: 0.2 }))
    clasp.position.set(0, 0.13, 0.36)
    g.add(clasp)
    const coin = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.02, 10),
      M(0xb87333, { metalness: 0.85, roughness: 0.3 }))
    coin.position.set(0.24, 0.1, -0.15)
    coin.rotation.x = 0.2
    g.add(coin)
  }
  if (id === 'clue_diary') {
    const b = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.2, 1.25), M(0x4e272a, { map: diaryCoverTex, roughness: 0.7 }))
    g.add(b)
    const pages = new THREE.Mesh(new THREE.BoxGeometry(0.86, 0.14, 1.18), M(0xede2cb, { map: linenTex, roughness: 0.85 }))
    pages.position.set(0.02, 0, 0)
    g.add(pages)
    const spine = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 1.26, 6), M(0x381b1d, { map: leatherTex }))
    spine.position.set(-0.44, 0, 0)
    g.add(spine)
    const ribbon = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.02, 1.42), M(0xd4af37))
    ribbon.position.set(0.05, 0.11, 0)
    g.add(ribbon)
  }
  if (id === 'clue_letter') {
    const l = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.03, 0.82), M(0xf6eedb, { map: letterDocTex, roughness: 0.8 }))
    g.add(l)
    const fold = new THREE.Mesh(new THREE.BoxGeometry(1.16, 0.015, 0.02), M(0xded0ba))
    fold.position.set(0, 0.02, 0)
    g.add(fold)
    const wax = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.04, 12), M(0x8a1c1c, { roughness: 0.45 }))
    wax.position.set(0.28, 0.03, 0)
    g.add(wax)
  }
  if (id === 'clue_insurance') {
    const p = new THREE.Mesh(new THREE.BoxGeometry(0.98, 0.02, 1.28), M(0xf8f2e4, { map: insuranceDocTex, roughness: 0.8 }))
    g.add(p)
    const header = new THREE.Mesh(new THREE.BoxGeometry(0.98, 0.025, 0.22), M(0x2a463a))
    header.position.set(0, 0.01, -0.5)
    g.add(header)
    const seal = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.02, 10), M(0x9a2222))
    seal.position.set(0.26, 0.02, 0.45)
    g.add(seal)
  }
  if (id === 'clue_apron') {
    const a = new THREE.Mesh(new THREE.BoxGeometry(0.88, 0.03, 1.15), M(0x7a6254, { map: apronClueTex, roughness: 0.88 }))
    g.add(a)
    const pocket = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.02, 0.32), M(0x5c2b2b, { map: apronClueTex }))
    pocket.position.set(0, 0.02, 0.12)
    g.add(pocket)
  }
  return g
}
