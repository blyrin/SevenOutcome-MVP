import type { DialogueLineItem, FormattedDialogueLine } from '../../types'

export const NPC_VOICE_DESIGNS: Record<string, string> = {
  thomas: 'A young male constable in his early twenties. A clear, resilient voice with a slightly taut, strained edge. Speaks quickly with sharp, precise words, full of wary awe and barely concealed nerves in the face of the snowbound manor and the locked-room murder in natural English.',
  morris: 'An elderly male butler in his sixties who has served the noble house for decades. A low, aged, deeply dignified voice. Speaks slowly and steadily with measured, precise diction and restrained rigor, carrying the cold severity and quiet authority of an old aristocratic servant in natural English.',
  eleanor: 'A young woman in her twenties, the widowed lady of the manor. A soft, gentle, tender voice, frail and trembling. Speaks slowly and softly with faint breath, carrying the panic and wariness of a startled doe and the sorrowful grievance of a cloistered noblewoman in natural English.',
  julian: 'A young male heir in his twenties, bankrupt and desperate. A hoarse, dry, rough and restless voice. Speaks in a fast, violent rush with a slightly neurotic impulsiveness, full of cornered panic, rage and regret in natural English.',
  vincent: 'A middle-aged gentleman physician in his forties. A low, mellow, magnetic voice. Speaks with unhurried calm and clear reasoning, outwardly refined and courteous, yet concealing a deep coldness and unshakable resolve beneath in natural English.',
  cecilia: 'A young blind female harpsichordist of eighteen. A pure, ethereal, light and gentle voice. Speaks calmly in a serene, transcendent tone, carrying spotless innocence and the keen auditory insight of one who perceives the world through sound in natural English.',
}

export const DIALOGUE_LINES: Record<string, DialogueLineItem> = {
  // 1. 见习巡士 托马斯 (thomas)
  thomas_intro: {
    id: 'thomas_intro',
    npc: 'thomas',
    speaker: '巡士 托马斯',
    prompt: 'Young constable reporting anxiously and reverently beneath the howling blizzard on the porch.',
    text: '侦探先生，谢天谢地您终于赶到了！暴风雪把下山的吊桥彻底砸垮，庄园现在成了与世隔绝的冰雪孤岛。老男爵横死在二楼书房里，门窗全从内侧死死反锁，是一间真正的密室！',
    tts: 'Thank heavens you have come at last, Mr. Detective! The blizzard has smashed the suspension bridge down the mountain—the manor is now an isolated island cut off in ice and snow. The old baron lies dead in his study on the second floor. Every door and window is bolted dead from the inside. It is a true locked room!',
  },
  thomas_t1: {
    id: 'thomas_t1',
    npc: 'thomas',
    speaker: '巡士 托马斯',
    prompt: 'Young constable lowering his voice as he describes the locked scene and the state of the body.',
    text: '昨夜零点钟响前，管家上楼送药茶，发现房门反锁、毫无声息。我和他合力撞开厚橡木门，只见老男爵胸口插着一把纯银拆信刀，地毯上全是摔碎的茶杯，空气里还弥漫着刺鼻的苦扁桃味。',
    tts: 'Just before the midnight bell last night, the butler carried the medicine tea upstairs and found the door locked with no answer from within. We forced open the thick oak door together—the old baron had a solid silver letter opener buried in his chest, shattered teacups covered the carpet, and a sharp reek of bitter almonds hung in the air.',
  },
  thomas_t2: {
    id: 'thomas_t2',
    npc: 'thomas',
    speaker: '巡士 托马斯',
    prompt: 'Young constable nervously recounting the people trapped inside the manor.',
    text: '庄园里的人全被暴风雪困住了：继室艾莲娜夫人、债台高筑的朱利安少爷、主治医生凡森特、老管家莫里斯，还有盲女琴师塞西莉亚小姐。人人各怀心思，宅子里的气氛压抑得让人喘不过气。',
    tts: 'Everyone in the manor is trapped by the blizzard: the second wife Lady Eleanor, the debt-ridden young master Julian, the family physician Vincent, the old butler Morris, and the blind harpsichordist Miss Cecilia. Every one of them harbors secret thoughts—the air in this house is heavy enough to smother a man.',
  },
  thomas_t3: {
    id: 'thomas_t3',
    npc: 'thomas',
    speaker: '巡士 托马斯',
    prompt: 'Young constable gasping in admiration at the detective\'s insight.',
    text: '真不愧是名侦探！门栓是实心黄铜闩，两扇法式大窗全在内侧死扣着。如果凶手是在室内行凶，他到底是怎么在门窗紧锁的密室里凭空蒸发的？',
    tts: 'Truly worthy of a master detective! The door bolt is solid brass, and both French windows are latched dead from the inside. If the killer struck from within the room, how on earth did he vanish into thin air from a locked room?',
  },
  thomas_hub_default: {
    id: 'thomas_hub_default',
    npc: 'thomas',
    speaker: '巡士 托马斯',
    prompt: 'Young constable standing guard in the entrance hall, eager to serve.',
    text: '我已经封锁了前廊。案发现场在主楼二楼西北书房，西南面是温室，东翼是客房与医务室。侦探先生，有任何差遣请随时吩咐我！',
    tts: 'I have sealed off the front corridor. The crime scene is the study at the northwest of the second floor; the conservatory lies to the southwest, and the guest rooms and infirmary occupy the east wing. Mr. Detective, command me at any time!',
  },
  thomas_hub_clues: {
    id: 'thomas_hub_clues',
    npc: 'thomas',
    speaker: '巡士 托马斯',
    prompt: 'Young constable watching the detective\'s notebook with quiet admiration.',
    text: '核心物证正在被您一件件收录归档。这深宅大院里的谎言与毒雾，正在被您一层层剥开。',
    tts: 'The crucial evidence is being filed away piece by piece under your hand. The lies and the poisonous fog inside this great house are being peeled away layer by layer.',
  },
  thomas_hub_verdict: {
    id: 'thomas_hub_verdict',
    npc: 'thomas',
    speaker: '巡士 托马斯',
    prompt: 'Young constable with a grave, solemn expression.',
    text: '证据链已经彻底闭合了吗？所有人都在门厅屏息等候您的最终判定。这场风雪夜里的审判，全凭侦探先生定夺了！',
    tts: 'Has the chain of evidence been fully closed? Everyone is holding their breath in the entrance hall, awaiting your final judgment. The verdict of this stormy night rests entirely in your hands, Mr. Detective!',
  },
  thomas_weather: {
    id: 'thomas_weather',
    npc: 'thomas',
    speaker: '巡士 托马斯',
    prompt: 'Young constable gazing at the raging blizzard outside the window.',
    text: '巡逻马车在断桥边彻底陷进了雪堆里。天亮前绝不可能有任何援兵上山。在风雪停歇之前，正义只能靠我们自己去伸张了。',
    tts: 'The patrol carriage is buried axle-deep in the snowdrift by the broken bridge. No reinforcements can possibly climb the mountain before dawn. Until the storm subsides, justice is ours alone to deliver.',
  },

  // 2. 老管家 莫里斯 (morris)
  morris_init: {
    id: 'morris_init',
    npc: 'morris',
    speaker: '老管家 莫里斯',
    prompt: 'Aged butler in an immaculate black tailcoat, solemn and cold.',
    text: '侦探先生，老朽在维恩家族侍奉了整整四十年。男爵阁下的暴毙固然骇人，但若有人想借漫天风雪构陷无辜，老朽拼上这条残命也绝不答应。',
    tts: 'Mr. Detective, this old servant has served the Vane family for forty full years. The baron\'s sudden death is horrifying indeed, but if anyone means to frame the innocent behind this raging blizzard, I will oppose it with the last breath of this worn-out life.',
  },
  morris_again: {
    id: 'morris_again',
    npc: 'morris',
    speaker: '老管家 莫里斯',
    prompt: 'Old butler resting on his brass-handled cane, eyes deep and unreadable.',
    text: '庄园里的一百多把黄铜钥匙，全挂在老朽腰间。关于昨夜的惨剧，您还想核查什么？',
    tts: 'More than a hundred brass keys of this manor hang at my waist. What else do you wish to verify about last night\'s tragedy?',
  },
  morris_midnight: {
    id: 'morris_midnight',
    npc: 'morris',
    speaker: '老管家 莫里斯',
    prompt: 'Old butler recounting the forced entry in precise, orderly fashion.',
    text: '昨夜二十三点五十分，老朽端着温好的药茶上楼。叩门三次毫无动静，门缝下透着微弱烛光，门栓反锁得严丝合缝。直到零点钟声敲响，老朽预感不祥，才唤来托马斯巡士合力撞开大门。',
    tts: 'At eleven fifty last night, I carried the warmed medicine tea upstairs. I knocked three times with no answer; faint candlelight seeped beneath the door and the bolt was locked fast. When the midnight bell tolled, a sense of doom seized me, and I called Constable Thomas to force the great door open with me.',
  },
  morris_will: {
    id: 'morris_will',
    npc: 'morris',
    speaker: '老管家 莫里斯',
    prompt: 'Old butler with a faint sneer, eyes full of suppressed disgust.',
    text: '壁炉里的残卷？哼……男爵生前狂妄刻薄，自知肺疾无救，竟立下绝情遗嘱：矿山地产尽捐教会，夫人净身出户，长子剥夺名分，连侍奉几十年的老仆也全数遣散！他是要拉着全庄园的人给他陪葬！',
    tts: 'The scorched papers in the fireplace? Hmph... The baron was arrogant and spiteful in life. Knowing his lung disease was beyond cure, he drew up a merciless will: the mines and estates all donated to the church, the madam cast out penniless, the eldest son stripped of his name, even the old servants of decades dismissed without a coin! He meant to drag the entire household into the grave with him!',
  },
  morris_mine: {
    id: 'morris_mine',
    npc: 'morris',
    speaker: '老管家 莫里斯',
    prompt: 'Old butler trembling slightly, voice shaking as he reveals a buried blood debt.',
    text: '您……您竟查出了二十年前黑杉矿难的血账？！当年为了侵吞矿脉，三十四条铁骨铮铮的矿工被炸塌的沉井活活闷死！合伙人理查德先生也被灭口在井底……那是男爵造下的滔天血债啊！',
    tts: 'You... you have actually uncovered the blood debt of the Black Spruce mine disaster twenty years ago?! Back then, to swallow the seam for himself, thirty-four hardened miners were buried alive in the blasted shaft! His partner Mr. Richard was silenced at the bottom of the pit... That was the monstrous blood debt the baron incurred!',
  },
  morris_key: {
    id: 'morris_key',
    npc: 'morris',
    speaker: '老管家 莫里斯',
    prompt: 'Old butler handing over a brass key with grave ceremony.',
    text: '既然您查到了这一步……这是东翼医务室与药柜暗格的黄铜钥匙。凡森特医生平日谨小慎微，或许您该亲自去他的诊室里看个明白。',
    tts: 'Since you have uncovered this much... here is the brass key to the east wing infirmary and the hidden compartment of the medicine cabinet. Dr. Vincent is cautious by nature—perhaps you should go and see his consulting room for yourself.',
  },

  // 3. 续弦夫人 艾莲娜 (eleanor)
  eleanor_init: {
    id: 'eleanor_init',
    npc: 'eleanor',
    speaker: '艾莲娜 夫人',
    prompt: 'Young widowed lady, deathly pale in a black sable cloak, eyes flickering with fear.',
    text: '侦探先生……他们都在背后指指点点，说是我在茶里下了毒。可我向天发誓，昨晚我端去安神茶时，他嫌茶烫根本未喝一口！我离开书房时，他明明还活着！',
    tts: 'Mr. Detective... they all whisper behind my back, saying I poisoned the tea. But I swear to heaven, when I brought the calming tea last night, he complained it was scalding and never took a single sip! When I left the study, he was still alive!',
  },
  eleanor_again: {
    id: 'eleanor_again',
    npc: 'eleanor',
    speaker: '艾莲娜 夫人',
    prompt: 'Lady Eleanor by the conservatory flower racks, fingers idly stroking the stems.',
    text: '温室里的雪花莲开了，可在这座冰冷牢笼里，美丽不过是腐烂的序章。侦探先生，您还想向我问些什么？',
    tts: 'The snowdrops are blooming in the conservatory, but in this frozen cage, beauty is nothing more than the prelude to decay. What else do you wish to ask of me, Mr. Detective?',
  },
  eleanor_tea: {
    id: 'eleanor_tea',
    npc: 'eleanor',
    speaker: '艾莲娜 夫人',
    prompt: 'Lady Eleanor breaking down, revealing the old purple whip scars on her wrist.',
    text: '是！我承认我把苦扁桃毒汁混在了茶水里！整整三年，他喝醉了就拿浸水的皮鞭抽我！可昨晚他嫌茶烫嘴、一把推在桌角，根本一口没咽！那杯子是后来才被打碎的啊！',
    tts: 'Yes! I admit I mixed the bitter-almond poison into the tea! For three whole years, whenever he was drunk he thrashed me with a soaked leather whip! But last night he burned his mouth, shoved the cup against the table corner, and never swallowed a drop! That cup was smashed long afterwards!',
  },
  eleanor_candle: {
    id: 'eleanor_candle',
    npc: 'eleanor',
    speaker: '艾莲娜 夫人',
    prompt: 'Lady Eleanor recalling how the candle was made, tone puzzled and anxious.',
    text: '书桌上的沉香止痛蜡烛？那确实是我在温室用蜂蜡熔铸的，但精油是凡森特医生特调的草药配方。我做好蜡烛就端上了托盘，绝没碰过蜡芯底部！',
    tts: 'The pain-easing aloeswood candle on the desk? I did indeed mold it from beeswax in the conservatory, but the essential oil was Dr. Vincent\'s own herbal blend. I set the finished candle straight onto the tray and never touched the base of the wick!',
  },
  eleanor_relief: {
    id: 'eleanor_relief',
    npc: 'eleanor',
    speaker: '艾莲娜 夫人',
    prompt: 'Lady Eleanor slumping in exhaustion, tears soaking her handkerchief.',
    text: '法医证实他胃里没有一滴毒茶……谢天谢地，笼罩我整整三年的噩梦终于结束了。求您查清真相，千万别让我替莫须有的罪名送了命。',
    tts: 'The forensic exam confirmed not a drop of poisoned tea in his stomach... Thank heavens, the nightmare that has shrouded me for three whole years is finally over. I beg you to uncover the truth—do not let me perish for a crime that never existed.',
  },

  // 4. 长子 朱利安 (julian)
  julian_init: {
    id: 'julian_init',
    npc: 'julian',
    speaker: '朱利安 · 维恩',
    prompt: 'Stubble-faced young aristocrat with a rumpled collar, snarling in panic inside the guest room.',
    text: '看什么看？！拆信刀上有我的家徽又怎样？！老头子要改遗嘱把老子逼上绝路，昨晚我喝多了确实喊过要放他的血，但人绝对不是我杀的！',
    tts: 'What are you staring at?! So the letter opener bears my family crest—who cares?! The old man meant to rewrite the will and drive me to ruin. I was drunk last night, yes, and I did shout that I would bleed him—but I am absolutely not his killer!',
  },
  julian_again: {
    id: 'julian_again',
    npc: 'julian',
    speaker: '朱利安 · 维恩',
    prompt: 'Julian clawing at his hair, pacing back and forth in neurotic frenzy.',
    text: '该死的高利贷！该死的绝情遗嘱！大侦探，你到底查清楚没有？老子可不想被当成替罪羊送上绞刑架！',
    tts: 'Damn the loan sharks! Damn that heartless will! Mr. Great Detective, have you figured it out or not? I will not be made the scapegoat and strung up on the gallows!',
  },
  julian_knife: {
    id: 'julian_knife',
    npc: 'julian',
    speaker: '朱利安 · 维恩',
    prompt: 'Julian slumped in the armchair, cold sweat soaking his back, confessing everything.',
    text: '我说！我全招！黑帮逼我周日前还清三千金币，否则就要剁我双手！昨晚二十三点三十五分，我溜进书房想偷债券。房门只是虚掩着，我一推开门……老头子早就翻白眼断气了，茶水摔了一地！',
    tts: 'I\'ll talk! I confess it all! The gang gave me until Sunday to repay three thousand gold coins, or they would chop off my hands! At eleven thirty-five last night I slipped into the study to steal the bonds. The door was merely ajar—the moment I pushed it open... the old man was already dead, eyes rolled back, tea smashed all over the floor!',
  },
  julian_stab: {
    id: 'julian_stab',
    npc: 'julian',
    speaker: '朱利安 · 维恩',
    prompt: 'Julian with a sob in his voice, choked by endless remorse.',
    text: '我当时吓得魂飞魄散！晚餐时大家都听见我扬言要宰了他，若让人发现他暴毙，我跳进泰晤士河也洗不清！我猪油蒙了心，拔下拆信刀扎进他胸口伪装强盗洗劫，带上门就逃跑了。那一刀扎进去连血都没溅出来，他早就死透了！我真不知道门后来怎么被反锁的啊！',
    tts: 'I was scared out of my wits! Everyone at dinner heard me swear I would slaughter him—if they found him dead, not even the Thames could wash me clean! Greed clouded my senses; I pulled the letter opener from his chest and drove it in to fake a robber\'s ransacking, then fled and pulled the door shut behind me. The blade went in without so much as a spurt of blood—he had been dead for ages! I swear I don\'t know how the door came to be bolted from inside!',
  },

  // 5. 家庭医生 凡森特 (vincent)
  vincent_init: {
    id: 'vincent_init',
    npc: 'vincent',
    speaker: '凡森特 医生',
    prompt: 'Gentleman physician in a crisp dark-grey coat and gold-rimmed glasses, composed and elegant.',
    text: '风雪封断山径，庄园却遭逢此等惨剧，令人痛惜。我是男爵的主治医师凡森特。侦探阁下，在毒理与病理剖验方面，我随时愿为您效劳。',
    tts: 'The storm has sealed off the mountain path, and now the manor meets with such a tragedy—truly grievous. I am Vincent, the baron\'s personal physician. Your Excellency the Detective, in matters of toxicology and pathological autopsy, I am at your service at any time.',
  },
  vincent_again: {
    id: 'vincent_again',
    npc: 'vincent',
    speaker: '凡森特 医生',
    prompt: 'Dr. Vincent smoothing his gloves, a deep coldness behind his lenses.',
    text: '死因看似一目了然：胸口的锐器刺伤，或是地毯残茶里的苦扁桃毒物。不知踏雪而来的名侦探，有何高见？',
    tts: 'The cause of death seems obvious enough: the blade wound in his chest, or the bitter-almond poison in the spilled tea on the carpet. Pray tell, master detective who came treading through the snow—what is your learned opinion?',
  },
  vincent_medical: {
    id: 'vincent_medical',
    npc: 'vincent',
    speaker: '凡森特 医生',
    prompt: 'Dr. Vincent analyzing the condition methodically and calmly.',
    text: '男爵长年受严重支气管痉挛折磨。昨夜我备下了特制草药油，嘱咐他睡前点燃蜡烛吸入蒸汽平喘。若非胸前那柄凶残的银刀，他本可平稳渡过寒夜。',
    tts: 'The baron suffered severe bronchial spasms for years. Last night I prepared a special herbal oil and instructed him to light the candle and inhale the vapors before sleep to ease his breathing. Were it not for that vicious silver knife in his chest, he would have passed the cold night in peace.',
  },
  vincent_confront: {
    id: 'vincent_confront',
    npc: 'vincent',
    speaker: '凡森特 医生',
    prompt: 'Dr. Vincent suddenly glacial, removing his glasses with a ghastly bitter smile.',
    text: '注射器残留的熔蜡、蜡芯里的乌头碱，还有那本浸满血泪的矿难账册……名不虚传的侦探，你竟全拼凑出来了。没错！那头活埋了三十四名矿工的野兽，二十年前就该下地狱了！',
    tts: 'The melted wax in the syringe, the aconitine inside the candle wick, and that ledger soaked in blood and tears... Detective, true to your name—you have pieced it all together. Yes! That beast who buried thirty-four miners alive should have gone to hell twenty years ago!',
  },
  vincent_truth: {
    id: 'vincent_truth',
    npc: 'vincent',
    speaker: '凡森特 医生',
    prompt: 'Dr. Vincent in a low, even voice, as if delivering his final confession at the center of a courtroom.',
    text: '整整三年，我隐忍潜伏，只为量身铸造这场无可逃脱的审判！蜡烛燃至深夜，乌头碱蒸发为致命死雾；挂钟重锤下坠落锁，将他封死在绝望深渊！这是迟到了二十年的死刑，我绝无半点悔恨！',
    tts: 'For three whole years I lay in wait, all to forge this inescapable judgment tailored to his measure! The candle burned deep into the night; the aconitine evaporated into a deadly fog of death; the great clock weight came crashing down and sealed him into an abyss of despair! This is a death sentence twenty years overdue, and I repent not the slightest!',
  },

  // 6. 盲女琴师 塞西莉亚 (cecilia)
  cecilia_init: {
    id: 'cecilia_init',
    npc: 'cecilia',
    speaker: '塞西莉亚',
    prompt: 'Blind young girl in a white velvet gown seated at the harpsichord, serene and otherworldly.',
    text: '窗外的暴风雪呼啸甚急，但琴键上的黑白不会说谎。您是踏雪而来的侦探先生吧？塞西莉亚双目盲蔽，但整座庄园的一呼一吸，在我的耳中明晰如镜。',
    tts: 'The blizzard outside the window howls with fury, but the black and white of the keys never lie. You are Mr. Detective, come treading through the snow? Cecilia\'s eyes are blind, yet every breath of this manor lies as clear as a mirror in my ears.',
  },
  cecilia_again: {
    id: 'cecilia_again',
    npc: 'cecilia',
    speaker: '塞西莉亚',
    prompt: 'Cecilia running her fingertips over the keys, listening intently.',
    text: '您踩在回廊上的脚步沉稳轻柔，是一位敬畏真相的智者。您想听听昨夜穿透风雪与琴声的秘密吗？',
    tts: 'Your steps along the corridor are steady and gentle—the walk of a sage who reveres the truth. Would you care to hear the secrets that pierced the storm and the music last night?',
  },
  cecilia_sound: {
    id: 'cecilia_sound',
    npc: 'cecilia',
    speaker: '塞西莉亚',
    prompt: 'The blind girl\'s clear voice recounting the precise sound timeline of the murder night.',
    text: '二十三点十五分，凡森特医生走过回廊，步履轻捷平稳；二十三点三十分，书房传来茶杯摔碎与倒地的闷响；二十三点三十五分，朱利安少爷慌乱冲入书房，随后仓皇逃离；二十三点四十五分，大钟传来发条咬合与细弦绷脱的脆响；直到零点钟鸣，管家急促叩门、破门而入。',
    tts: 'At eleven fifteen, Dr. Vincent walked the corridor with light, even steps. At eleven thirty, the study rang with a smashed teacup and a muffled thud of a body falling. At eleven thirty-five, young master Julian burst into the study in a panic, then fled in haste. At eleven forty-five, the great clock crackled with the winding spring and a thin string snapping loose. At the midnight bell, the butler knocked urgently and broke through the door.',
  },
  cecilia_mercy: {
    id: 'cecilia_mercy',
    npc: 'cecilia',
    speaker: '塞西莉亚',
    prompt: 'The blind girl lowering her lashes as a mournful arpeggio flows from her fingers.',
    text: '男爵收留我不过是沽名钓誉，而凡森特医生曾多次暗中为我煎药调治眼疾。深仇如同窗外的暴风雪，但我祈盼积雪消融后，这座庄园能迎来真正的破晓。',
    tts: 'The baron took me in for nothing but the praise of men, while Dr. Vincent secretly brewed medicine for my eyes many a time. The deep grudge is like the blizzard outside the window—but I pray that once the snows melt, this manor may greet a true daybreak.',
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
    voiceUrl: `${ import.meta.env.BASE_URL }cases/manor/audio/voice/${ item.id }.ogg`,
  }
}

export function findVoiceUrl(text: string): string | null {
  if (!text) {
    return null
  }
  for (const item of Object.values(DIALOGUE_LINES)) {
    const raw = typeof item.text === 'function' ? item.text() : item.text
    if (text === raw || (raw && text.includes(raw.slice(0, 14)))) {
      return `${ import.meta.env.BASE_URL }cases/manor/audio/voice/${ item.id }.ogg`
    }
  }
  return null
}
