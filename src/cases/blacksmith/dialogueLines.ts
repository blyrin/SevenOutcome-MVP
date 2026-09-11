import type { DialogueLineItem, FormattedDialogueLine } from '../../types'

export const NPC_VOICE_DESIGNS: Record<string, string> = {
  sheriff: 'A frontier town sheriff in his 40s with a deep, weathered, gravelly voice. Speaks with steady, calm authority and crisp enunciation in natural English.',
  coroner: 'A male coroner in his 50s with a low, calm, analytical voice. Speaks slowly and objectively with cold clinical precision in natural English.',
  martha: 'A weary young woman in her 20s, deeply traumatized. A delicate, soft, slightly trembling voice with quiet exhaustion and sorrow in natural English.',
  luke: 'An 18-year-old timid blacksmith apprentice with a shaky, breathless, high-pitched voice. Panicky and frightened delivery in natural English.',
  pete: 'An elderly town drunkard around 60. A raspy, gravelly, worn voice with slurred drunken cadence yet warm and streetwise in natural English.',
  barrow: 'A shrewd, aggressive moneylender in his 40s. A sharp, dry, fast-paced voice filled with calculating cynicism and impatient edge in natural English.',
  greta: 'A bustling, gossiping townswoman in her 50s. A rich, resonant, expressive voice full of dramatic emotion and neighborhood gossip in natural English.',
}

export const DIALOGUE_LINES: Record<string, DialogueLineItem> = {
  // 1. 警长 雷诺 (sheriff)
  sheriff_intro: {
    id: 'sheriff_intro',
    npc: 'sheriff',
    speaker: '警长 雷诺',
    prompt: 'A seasoned sheriff in his 40s, delivering case details calmly and solemnly.',
    text: '你终于到了，侦探。死者是汉斯·贝克——在镇上打了二十年铁的铁匠。今早巡逻队在他铺子里发现了他，头骨全被砸碎了。',
    tts: 'You are finally here, detective. The victim is Hans Baker—a blacksmith who worked in this town for twenty years. The patrol found him in his forge this morning, his skull completely shattered.',
  },
  sheriff_t1: {
    id: 'sheriff_t1',
    npc: 'sheriff',
    speaker: '警长 雷诺',
    prompt: 'Sheriff briefing the detective on the crime scene and time of death.',
    text: '验尸官贝尔还在铺子里，初步推断死亡时间在昨晚十点前后。致命伤在头部，遭钝器重创。现场就在西北侧的铁匠铺——别踩坏了泥地上的痕迹，侦探。',
    tts: "Coroner Bell is still inside the forge. Initial findings put the time of death around ten o'clock last night. Fatal blunt force trauma to the head. The scene is at the forge to the northwest—mind your step in the mud, detective.",
  },
  sheriff_t2: {
    id: 'sheriff_t2',
    npc: 'sheriff',
    speaker: '警长 雷诺',
    prompt: 'Stern and grave sheriff reviewing the initial suspects.',
    text: '遗孀玛莎、学徒卢克，还有放高利贷的巴罗——汉斯欠了他一大笔钱，全镇皆知。眼下人人都有嫌疑，这就是我们需要你来破案的原因。',
    tts: "The widow Martha, the apprentice Luke, and Barrow the loan shark—everyone knows Hans owed him a fortune. Right now, everyone is a suspect. That is why we called you in.",
  },
  sheriff_t3: {
    id: 'sheriff_t3',
    npc: 'sheriff',
    speaker: '警长 雷诺',
    prompt: 'Impressed yet lowering his voice, acknowledging a keen observation.',
    text: '好敏锐的眼力。没错，铺子门前的泥地上留下了两组截然不同的鞋印，一深一浅。把这份洞察力用在揪出凶手上吧，侦探。',
    tts: "Sharp eyes. That's right, there are two distinct sets of footprints in the mud—one deep, one shallow. Put that sharp insight to work catching the killer, detective.",
  },
  sheriff_hub_default: {
    id: 'sheriff_hub_default',
    npc: 'sheriff',
    speaker: '警长 雷诺',
    prompt: 'Efficient sheriff giving instructions on where to begin.',
    text: '案发现场在西北角的铁匠铺。证人和嫌疑人都在镇上，该问谁、从哪儿查，全凭你的判断。',
    tts: 'The crime scene is at the northwest forge. The witnesses and suspects are all around town. Who to question and where to search is entirely up to you.',
  },
  sheriff_hub_clues: {
    id: 'sheriff_hub_clues',
    npc: 'sheriff',
    speaker: '警长 雷诺',
    prompt: 'Low and earnest sheriff urging the detective to keep digging.',
    text: (count = '') => `已有${ count }条物证收录在案了。继续深挖，侦探——真相就藏在最微小的细节深处。`,
    tts: 'More evidence is being gathered. Keep digging, detective—the truth is always buried in the smallest details.',
  },
  sheriff_hub_verdict: {
    id: 'sheriff_hub_verdict',
    npc: 'sheriff',
    speaker: '警长 雷诺',
    prompt: 'Somber and burdened sheriff reflecting on the closed case.',
    text: '告示板上的推演结论我仔细看过了。说实在的……这案子让人心里堵得慌。证据链已经闭合，准备好主持最终裁决了吗？',
    tts: "I've reviewed your deductions on the board. Honestly... this case leaves a heavy knot in my chest. The evidence chain is complete. Are you ready for the final trial?",
  },
  sheriff_sum: {
    id: 'sheriff_sum',
    npc: 'sheriff',
    speaker: '警长 雷诺',
    prompt: 'Methodical sheriff listing suspect backgrounds.',
    text: '遗孀玛莎，成婚八年，平日深居简出、寡言少语；学徒卢克，跟了汉斯三年，吓得像只惊弓之鸟；还有巴罗，靠放贷起家，汉斯欠了他三百枚金币——利滚利的高利贷。',
    tts: 'Martha, the widow, married eight years, quiet and keeps to herself. Luke, the apprentice, with Hans for three years, terrified out of his wits. And Barrow, who made his coin lending money—Hans owed him three hundred gold pieces with brutal compounding interest.',
  },
  sheriff_prints: {
    id: 'sheriff_prints',
    npc: 'sheriff',
    speaker: '警长 雷诺',
    prompt: 'Serious sheriff lowering his voice, revealing crucial footprint evidence.',
    text: '深的那组是汉斯的重工靴，昨晚他醉醺醺从酒馆一路摇晃着回铺子；浅的那行鞋印纤细，是女人穿的软底居家便鞋，一路顶着夜风从贝克宅延伸到铁匠铺门前。一个女人半夜穿着单薄便鞋去铺子，多半是去寻烂醉未归的丈夫。这事我们一直压着没敢声张。',
    tts: "The deep set belongs to Hans' heavy work boots, stumbling back drunk from the tavern last night. The shallow ones are delicate, soft slippers worn by a woman, tracing all the way from the Baker house to the forge through the freezing wind. A woman stepping out in thin slippers at midnight... likely searching for her drunken husband. We kept quiet about this so as not to cause panic.",
  },
  sheriff_tl: {
    id: 'sheriff_tl',
    npc: 'sheriff',
    speaker: '警长 雷诺',
    prompt: 'Calm sheriff reconstructing the critical timeline.',
    text: '昨晚八点半汉斯还在酒馆买醉，九点就有人见他回了铺子；十点前后铺子里传出过动静；十一点巡逻队发现了尸体。中间这两三个小时，就是你要查明的真相真空期。',
    tts: 'Hans was still drinking at the tavern at eight-thirty last night. By nine, someone saw him head back to the forge. Around ten, violent noises came from inside. At eleven, the patrol found his corpse. Those two or three hours in between are the vacuum of truth you need to uncover.',
  },

  // 2. 验尸官 贝尔 (coroner)
  coroner_a_init: {
    id: 'coroner_a_init',
    npc: 'coroner',
    speaker: '验尸官 贝尔',
    prompt: 'Objective, calm coroner delivering clinical autopsy findings.',
    text: '尸检报告我已经整理完毕。头部遭钝器致命重击，颅骨当场粉碎。动手的人要么力大过人，要么……已被逼到了彻底绝望的绝境。',
    tts: 'The autopsy report is complete. A single fatal blow from a blunt instrument, shattering the skull instantly. Whoever swung it was either remarkably strong, or pushed to the brink of absolute desperation.',
  },
  coroner_a_again: {
    id: 'coroner_a_again',
    npc: 'coroner',
    speaker: '验尸官 贝尔',
    prompt: 'Wise and dispassionate coroner observing human nature.',
    text: '你又来了，侦探。尸骨与伤痕从不会说谎——在迷雾里编造谎言的，向来都是活人。',
    tts: 'Back again, detective. Bones and wounds never lie. It is always the living who weave falsehoods in the fog.',
  },
  coroner_b: {
    id: 'coroner_b',
    npc: 'coroner',
    speaker: '验尸官 贝尔',
    prompt: 'Analytical coroner dissecting the psychology of the strike.',
    text: '死亡时间在昨夜十点前后，误差不超过半小时。一击致命，没有任何反复补刀的痕迹——这绝非仇杀泄愤的手段，更像是一场「只想让眼前暴行立刻停止」的生死搏杀。',
    tts: 'Time of death was around ten last night, give or take half an hour. A single lethal strike, with no signs of repeated bludgeoning. This was not a vengeful slaughter. It looks far more like a desperate struggle just to make the immediate violence stop.',
  },
  coroner_c: {
    id: 'coroner_c',
    npc: 'coroner',
    speaker: '验尸官 贝尔',
    prompt: 'Rigorous and approving coroner explaining wound mechanics.',
    text: '问到了关键要害。警长那帮外行一眼瞥见后脑勺枕在血泊里，就嚷嚷着是后脑重伤——那是死者仰面倒地撞在石板上的二次挫痕！真正的致命创口在额角与面颅侧上方，仅此一次挥击，而且受力角度是由下往上逆向撩打。凶手身材比汉斯矮小得多，是在被死死扼颈压制在地的危局中向上盲目挥击，毫无格斗训练痕迹。侦探，凶器不会开口，但创口的角度骗不了人。',
    tts: "You've hit the vital point. The sheriff's men saw the back of his head in blood and claimed a strike from behind—that was merely a secondary impact from collapsing onto the flagstones! The true fatal blow struck the temple and side of the face, angled upwards from below. The killer was far smaller than Hans, swinging blindly upward while pinned to the ground by the throat, with zero combat training. Detective, the weapon cannot speak, but the angle of the wound never lies.",
  },

  // 3. 玛莎 · 贝克 (martha)
  martha_a_early: {
    id: 'martha_a_early',
    npc: 'martha',
    speaker: '玛莎 · 贝克',
    prompt: 'Fragile, weary young woman speaking faintly with guarded fatigue.',
    text: '……你们是来盘问我的吗？我已经说过很多次了，昨晚我身子不适，早早就歇下了。',
    tts: "Are you here to question me? I've said it so many times... I was unwell last night and went to bed early.",
  },
  martha_a_busy: {
    id: 'martha_a_busy',
    npc: 'martha',
    speaker: '玛莎 · 贝克',
    prompt: 'Numb, helpless and tired of constant questioning.',
    text: '……你们已经是第三拨来问话的人了。我昨晚早早就睡下了，铺子里的动静，我什么都没听见。',
    tts: 'You are the third group to question me. I went to sleep early last night. Whatever happened in the forge, I heard nothing.',
  },
  martha_a_confessed: {
    id: 'martha_a_confessed',
    npc: 'martha',
    speaker: '玛莎 · 贝克',
    prompt: 'Quiet and hollow, completely surrendered and emptied of secrets.',
    text: '……你还想问什么呢，侦探。那本日记里，连我这八年来每一次做过的噩梦，都写得一清二楚了。',
    tts: 'What else is there to ask, detective? In that diary, every single nightmare I suffered over the past eight years is written in plain ink.',
  },
  martha_b: {
    id: 'martha_b',
    npc: 'martha',
    speaker: '玛莎 · 贝克',
    prompt: 'Surprised and touched by unexpected sympathy, voice trembling.',
    text: '节哀？……谢谢你。你是全镇第一个先对我说这句话的人，侦探。其他人冲进这里，眼里只有凶手是谁。',
    tts: 'My condolences? ...Thank you. You are the first person in this entire town to say that to me, detective. Everyone else rushed in with eyes only for the killer.',
  },
  martha_c: {
    id: 'martha_c',
    npc: 'martha',
    speaker: '玛莎 · 贝克',
    prompt: 'Looking down, speaking with hollow insecurity and resignation.',
    text: '在卧房里，只有我一个人。没有人能替我作证——我也明白，这听上去有多像苍白的托辞。',
    tts: 'In the bedroom, I was all alone. No one can vouch for me... and I know how much that sounds like a hollow excuse.',
  },
  martha_d: {
    id: 'martha_d',
    npc: 'martha',
    speaker: '玛莎 · 贝克',
    prompt: 'Trembling with suppressed tears, eight years of abuse surfacing.',
    text: '……他只要喝了酒就会发疯打人，整整八年了。昨晚他又醉得不省人事……可我真的睡下了，侦探。我真的睡了。*她的衣袖不自觉地滑落，手腕与小臂上新旧叠印的淤青触目惊心。*',
    tts: 'Whenever he drank, he went mad and beat me. For eight long years. Last night he came home blind drunk again... but I really was asleep, detective. I truly was.',
  },
  martha_e: {
    id: 'martha_e',
    npc: 'martha',
    speaker: '玛莎 · 贝克',
    prompt: 'Deep sigh of defeat and relief, opening up the last secret.',
    text: '……整整八年的苦难。如果你想查验的话——我的日记就放在梳妆台第二个抽屉里，钥匙就插在锁孔上。到了今天，我也没有什么好隐瞒的了。',
    tts: 'Eight years of misery. If you wish to see for yourself, my diary is in the second drawer of the vanity. The key is in the lock. Today, I have nothing left to hide.',
  },
  martha_f: {
    id: 'martha_f',
    npc: 'martha',
    speaker: '玛莎 · 贝克',
    prompt: 'Desolate, haunting confession of that fatal night, steady yet chilling.',
    text: '……昨夜他在酒馆被逼债逼红了眼，回铺里摔砸泄愤。我怕他冻死在炉边，拿了大衣去叫他……谁知他像疯了一样掐住我的脖子，吼着要去拿锻锤砸死我。在窒息的绝望里，我的手在地上乱抓，只是……比他先摸到了那柄铁锤。随后，一切都安静了。侦探，这是八年来，我第一次觉得那间铺子里能如此安静。*她没有落泪，只是平静而空洞地迎上了你的目光。*',
    tts: "Last night the loan collectors drove him mad with rage at the tavern. He came back smashing things in the forge. I feared he'd freeze by the cold furnace, so I brought his coat to fetch him... but the moment I entered, he grabbed my throat like a beast, screaming he would crush my skull with his hammer. In suffocating terror, my hand scraped against the dirt floor, and by sheer chance... touched that iron hammer before he did. Then, everything went quiet. Detective, for the first time in eight years, that forge was finally quiet.",
  },
  martha_why_forge: {
    id: 'martha_why_forge',
    npc: 'martha',
    speaker: '玛莎 · 贝克',
    prompt: 'Painful confession of returning to the cold forge late at night.',
    text: '……昨晚他借债未还，在酒馆买醉到深夜未归。外头寒风刺骨，我怕他醉卧冻死在冷炉旁，拿了大衣去叫他回家……谁知他满眼通红，一见我进门，借着邪火酒疯便扑了上来……掐住我的脖子……',
    tts: "With debts hanging over his head, he drank himself numb until midnight. The cold was piercing outside. I feared he'd freeze beside the dead hearth, so I took a coat to bring him home... but his eyes were bloodshot. The moment I walked in, in a drunken fury he lunged at me... choking my throat.",
  },
  martha_comfort: {
    id: 'martha_comfort',
    npc: 'martha',
    speaker: '玛莎 · 贝克',
    prompt: 'Numb relief and quiet gratitude after the storm has passed.',
    text: '……谢谢你，侦探。无论审判最后如何发落我，至少从昨夜起，我终于不再需要在黑暗里浑身发抖地熬到天明了。',
    tts: 'Thank you, detective. Whatever sentence awaits me... at least since last night, I no longer have to spend the dark hours shivering until dawn.',
  },

  // 4. 学徒 卢克 (luke)
  luke_a_init: {
    id: 'luke_a_init',
    npc: 'luke',
    speaker: '学徒 卢克',
    prompt: 'Terrified young apprentice stammering and trembling uncontrollably.',
    text: '侦探先生……师父他、他没喝酒时真的不坏！他只是沾了烈酒就停不下来……全都是酒惹的祸！',
    tts: "Mr. Detective... Master wasn't an evil man when sober! He just couldn't stop once he touched the bottle... It was all the drink's fault!",
  },
  luke_a_after: {
    id: 'luke_a_after',
    npc: 'luke',
    speaker: '学徒 卢克',
    prompt: 'Frightened apprentice begging not to be forced to remember.',
    text: '侦探先生……能说的我都全交代了。求求你，别让我再回忆昨晚那一幕了……求你……',
    tts: "Mr. Detective, I've told you everything I know. Please don't make me relive last night again... I beg of you.",
  },
  luke_b: {
    id: 'luke_b',
    npc: 'luke',
    speaker: '学徒 卢克',
    prompt: 'Guilty young man lying nervously, tight and breathless voice.',
    text: '昨晚我一直在后屋睡觉……我什么都没听见，真的！*他的十指死死绞着围裙的带子，指节因用力而泛白。*',
    tts: "I was sleeping in the back room all night... I didn't hear a single thing, honest!",
  },
  luke_c: {
    id: 'luke_c',
    npc: 'luke',
    speaker: '学徒 卢克',
    prompt: 'Total breakdown, weeping and shaking with horrific memory.',
    text: '……昨晚十点多我口渴起来倒水，听见前铺有撕打争斗的惨烈动静，悄悄推开门……我看见师母脱力跪在血泊里的师父身旁，满脸泪痕，双手死死攥着那把带血的铁锤。她就那么直勾勾看着我……我吓破了胆，逃回后屋蒙在被子里发抖了一整夜。先生，师母她……会被送上绞刑架吗？*他的声音颤抖得微弱如尘埃。*',
    tts: 'Around ten last night I woke up thirsty for water. I heard violent thuds in the front forge and cracked the door... I saw mistress kneeling in exhaustion beside master in a pool of blood, tears on her face, gripping that bloody hammer tightly. She just stared right through me... I lost my wits, ran back and hid under the blanket shivering all night. Sir... will they hang her on the gallows?',
  },
  luke_d: {
    id: 'luke_d',
    npc: 'luke',
    speaker: '学徒 卢克',
    prompt: 'Trembling apprentice revealing the history of brutal domestic violence.',
    text: '师母几乎每隔几天就要挨一顿打……铁匠铺的木板墙根本挡不住惨叫声。我们吓得不敢劝，更不敢声张。住在斜对街的格蕾塔大婶撞见过好几次，她知道得比谁都多。',
    tts: "Mistress was beaten every few days... The thin wooden walls couldn't drown out her screams. We were too terrified to interfere or say a word. Aunt Greta across the street saw it happen many times—she knows more than anyone.",
  },

  // 5. 老皮特 / 醉汉 皮特 (pete)
  pete_a_drunk: {
    id: 'pete_a_drunk',
    npc: 'pete',
    speaker: '醉汉 皮特',
    prompt: 'Drunken old man slurring his words, hiccuping and anxious about his wallet.',
    text: '*嗝*……我的皮夹子……谁好心捡到我的钱包了？……那里面可塞着我这辈子最后的念想啊……',
    tts: 'Hiccup... My leather wallet... Has anyone found my wallet? It holds the only keepsake I have left in this world...',
  },
  pete_a_see_wallet: {
    id: 'pete_a_see_wallet',
    npc: 'pete',
    speaker: '醉汉 皮特',
    prompt: 'Drunken eyes lighting up with joyful shock at his lost wallet.',
    text: '*嗝*……等等！你手里捏着的那个磨破角的皮夹……是我的钱包？！',
    tts: 'Wait! That worn leather wallet in your hand... Is that my wallet?!',
  },
  pete_b: {
    id: 'pete_b',
    npc: 'pete',
    speaker: '醉汉 皮特',
    prompt: 'Drunken rambling old man begging for his wallet with promised clues.',
    text: '是个磨破了边缘的棕色旧牛皮夹！昨晚喝大前明明还在身上的……多半是掉在东边那条暗巷里了。好心侦探，求你帮我找回来吧！我肚子里记着昨晚要紧的线索，只要钱包找回来，我全告诉你！',
    tts: "It's an old worn brown leather wallet! I had it before getting plastered last night... must have dropped it in the dark alley to the east. Kind detective, please find it for me! I have vital clues in my head—bring it back and I'll tell you every detail!",
  },
  pete_c_return: {
    id: 'pete_c_return',
    npc: 'pete',
    speaker: '老皮特',
    prompt: 'Tearfully grateful town drunk giving critical testimony and alley key.',
    text: '大好人哪！钱夹里的老画像还在……太感谢了！你想知道昨晚的事？老皮特虽然嗜酒，但昨夜记得真真切切！九点整，放贷的巴罗堵在铺门口，跟汉斯吵得天翻地覆，限他周五前交出三百金币。九点半巴罗骂骂咧咧朝镇外走掉了，我亲眼所见。到了十点出头，铺子里突然乒乓乱响，玛莎撕心裂肺喊着「别再打了」……跟着猛地传出一记沉重的钝响，就彻底没动静了。*他神秘地凑近压低声音：对了，汉斯喝高时吹过牛，说他床底下藏着个暗锁铁匣。暗巷栅栏门的钥匙给你，查案抄近路方便！*',
    tts: "Bless you! The old portrait is still safe inside! You want to know about last night? At nine sharp, Barrow trapped Hans outside the forge, shouting viciously about his three hundred gold coins. By nine-thirty Barrow stomped off towards the river outside town, I saw it with my own eyes. Past ten, loud crashes came from the forge, Martha screaming don't hit me anymore, followed by a heavy, sickening thud, then dead silence. Oh, Hans bragged about an iron lockbox under his bed! Take the key to the back alley gate—it will help you take a shortcut!",
  },
  pete_d: {
    id: 'pete_d',
    npc: 'pete',
    speaker: '醉汉 皮特',
    prompt: 'Hungover old drunk rubbing his temples, stubbornly demanding his wallet.',
    text: '*嗝*……头疼得像要裂开，酒气没散，我什么都想不真切……除非侦探先生帮我把东边暗巷丢的旧钱包找回来，让我安了心……',
    tts: "Head is splitting, booze hasn't cleared, can't recall a thing clearly. Not unless you fetch my old wallet from the dark alley and ease my mind, detective.",
  },
  pete_a_sober: {
    id: 'pete_a_sober',
    npc: 'pete',
    speaker: '老皮特',
    prompt: 'Cheerful, grateful street character greeting his benefactor.',
    text: '侦探先生！只要用得着老皮特的地方你尽管开口。今晚我真该请你痛饮一杯——呃，等我口袋里有了余钱的时候！',
    tts: 'Detective! If you ever need old Pete, just say the word. I ought to buy you a proper pint tonight—well, once I have a copper to spare!',
  },
  pete_b_sober: {
    id: 'pete_b_sober',
    npc: 'pete',
    speaker: '老皮特',
    prompt: 'Solemn, earnest witness giving an exact timeline of the murder night.',
    text: '昨晚九点，巴罗在铺门前狠逼汉斯还钱；九点半巴罗气冲冲离开了，奔着镇外河口方向去的。十点过几分，铺子里砸打得厉害，玛莎哭喊求饶「别再打了」，接着便是一声骇人的重击声，之后万籁俱寂……我皮特虽然好酒，但对天发誓句句属实！',
    tts: "Last night at nine, Barrow cornered Hans demanding money. By nine-thirty, Barrow stormed off towards the river mouth. A few minutes past ten, violent crashing broke out in the forge, Martha pleading don't hit me anymore, followed by a horrific heavy crack, then absolute silence. Pete loves his drink, but I swear on my life every word is true!",
  },
  pete_c_sober: {
    id: 'pete_c_sober',
    npc: 'pete',
    speaker: '老皮特',
    prompt: "Worldly old man scoffing at the moneylender's lack of nerve.",
    text: '巴罗那家伙是个敲骨吸髓的奸商，但他精明又胆小——他要的是白花花的金币，绝不敢背人命。一个死了的汉斯，连半个铜板都吐不出来！',
    tts: "Barrow is a bloodsucking usurer, but he is too shrewd and cowardly to murder anyone. He wants hard gold coins, not a hanging noose. A dead Hans can't cough up a single copper!",
  },

  // 6. 债主 巴罗 (barrow)
  barrow_a: {
    id: 'barrow_a',
    npc: 'barrow',
    speaker: '债主 巴罗',
    prompt: 'Cynical, sharp moneylender scoffing defensively.',
    text: '城里请来的大侦探？呵，不必兜圈子。汉斯借了我三百枚金币是事实，高利计息也是事实。但我图的是本息两清，现在债务人暴毙，我才是亏得血本无归的那个冤大头！',
    tts: "The big detective from the city? Heh, let's skip the pleasantries. Hans owed me three hundred gold coins, that's a fact. High interest, that's a fact too. But I run a business for profit. Now that my debtor is dead, I am the one suffering the total loss here!",
  },
  barrow_b: {
    id: 'barrow_b',
    npc: 'barrow',
    speaker: '债主 巴罗',
    prompt: 'Irritated moneylender loudly shouting his alibi.',
    text: '争执？干放贷的哪天不跟赖账的吵架！但昨夜九点半我就离开雾杉镇去河口酒馆了，酒保和一桌牌友都能替我作证！我去杀汉斯？杀了他谁来还我钱？拿他的烂骨头去熔铸金币吗？！',
    tts: 'An argument? Moneylenders argue with deadbeats every single day! But at nine-thirty last night I left town for the river mouth tavern. The barkeep and an entire table of card players can prove it! Me kill Hans? If he is dead, who pays me back? Am I supposed to melt his rotten bones into gold?!',
  },
  barrow_c: {
    id: 'barrow_c',
    npc: 'barrow',
    speaker: '债主 巴罗',
    prompt: 'Resigned moneylender grudgingly revealing his loan agreement.',
    text: '算你厉害，侦探，道上的规矩我认。账本在这里——三百金币本息，拿他的铺子和地契做抵押。瞧见页边那行小字没？「若他丧命，债便成空」。在这个镇上，我比任何人都更期盼汉斯能平平安安地活着！',
    tts: "Fine, detective, I know when I'm outplayed. Here is the ledger—three hundred gold coins, secured against his forge and deed. See that small clause in the margin? If he perishes, the debt is void. In this entire town, I prayed harder than anyone for Hans to stay alive and kicking!",
  },
  barrow_cref: {
    id: 'barrow_cref',
    npc: 'barrow',
    speaker: '债主 巴罗',
    prompt: 'Guarded moneylender fiercely slamming his ledgers shut.',
    text: '翻我的私人账册？凭什么！你不过是个办案侦探，又不是执法法官。*他迅速将厚账本锁进暗柜，眼神警惕而冷淡。*（也许拿出他在铁匠铺留下的逼债恐吓信等确凿痛脚，或是具备老辣的街头交涉手腕，才能撬开他的嘴。）',
    tts: "Pry through my private accounts? On whose authority! You are just a visiting detective, not a magistrate. Walk away and let me do business!",
  },
  barrow_e: {
    id: 'barrow_e',
    npc: 'barrow',
    speaker: '债主 巴罗',
    prompt: "Conflicted moneylender muttering reluctantly about Hans' insurance policy.",
    text: '那张人身保单？……三个月前他快走投无路拿铺子抵押时，我顺带替他办的。那酒鬼当时醉得厉害，嘴里嘟囔着说要给玛莎留点活路……呸！一个烂泥扶不上墙的酒鬼，临了反倒想着顾全别人。*他的语气不知不觉沉了下去，别过脸不再看你。*',
    tts: 'That insurance policy? Signed three months ago when he mortgaged his forge. The drunk was slurring heavily, muttering about leaving a way out for Martha. Bah! A worthless drunk drowning in debt, suddenly pretending to care for someone else in the end.',
  },

  // 7. 街坊 格蕾塔 (greta)
  greta_a: {
    id: 'greta_a',
    npc: 'greta',
    speaker: '街坊 格蕾塔',
    prompt: 'Gossipy older neighbor woman slapping her thigh in righteous indignation.',
    text: '真是作孽啊！汉斯落到这个下场，镇上没几个人同情他。要我说，一个烂醉如泥的恶棍死了就死了，可怜的是玛莎那个苦命女人！',
    tts: "What an ungodly sin! Hans brought this on himself, and barely a soul in town sheds a tear. If you ask me, good riddance to a drunken brute—it's poor Martha I weep for!",
  },
  greta_b: {
    id: 'greta_b',
    npc: 'greta',
    speaker: '街坊 格蕾塔',
    prompt: 'Heartbroken neighbor recounting eight years of horrific domestic abuse.',
    text: '汉斯一旦灌黄汤就拿玛莎撒气，足足打了她八年！整条街巷深更半夜常能听到动静，那可怜女人身上连一块好皮肉都没有……唉，如今人死灯灭，玛莎欠这世道的血泪苦债，也总算到头了。',
    tts: "Whenever Hans touched the liquor he took it out on Martha—beat her for eight solid years! The whole street heard the screams in the dead of night; that poor girl barely had an unbruised patch of skin. Ah well, now he's dead. Martha's debt of tears to this cruel world has finally come to an end.",
  },
  greta_c: {
    id: 'greta_c',
    npc: 'greta',
    speaker: '街坊 格蕾塔',
    prompt: 'Vivid storyteller shuddering at the horrific crash in the forge.',
    text: '昨夜十点出头的时候，铁匠铺里先是摔砸推打得厉害，伴着玛莎绝望的哭求声，随后「咣当」一声骇人重响，紧接着全镇死一般的寂静。我家老头还惊呼是锻炉给炸了呢。那一声沉重的闷响啊……我现在想起来都直冒冷汗。',
    tts: 'Just past ten last night, violent slamming came from the forge, along with Martha\'s desperate weeping. Then came a terrible, deafening crash, followed by dead silence across town. My old man thought the furnace blew up! That dreadful hollow thud... it still makes my blood run cold.',
  },
  greta_d: {
    id: 'greta_d',
    npc: 'greta',
    speaker: '街坊 格蕾塔',
    prompt: "Disdainful neighbor woman exposing the loan shark's cowardice.",
    text: '巴罗就是个吸血的高利贷头子！汉斯被他的复利逼得快上吊了。不过巴罗那厮惜命得很，他眼里只有金币没有胆量，平日嘴上叫嚣得再凶，也绝不敢真去杀人害命。',
    tts: "Barrow is a bloodsucking loan shark! Driven Hans half to the noose with his compounding interest. But that scoundrel loves his own skin too much. Gold in his eyes, but no stomach for murder. No matter how loud he barks, he'd never dare take a human life.",
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
    voiceUrl: `${ import.meta.env.BASE_URL }cases/blacksmith/audio/voice/${ item.id }.ogg`,
  }
}

export function findVoiceUrl(text: string): string | null {
  if (!text) {
    return null
  }
  for (const item of Object.values(DIALOGUE_LINES)) {
    const raw = typeof item.text === 'function' ? item.text() : item.text
    if (text === raw || (raw && text.includes(raw.slice(0, 14)))) {
      return `${ import.meta.env.BASE_URL }cases/blacksmith/audio/voice/${ item.id }.ogg`
    }
  }
  return null
}
