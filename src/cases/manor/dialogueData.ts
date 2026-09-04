import type { DialogueTree, NpcProfile } from '../../types'
import { line } from './dialogueLines'
import { addClue, checkFX, closeModal, G, gainXP, setFlag } from '../../state'
import { openTrial } from '../../trial'
import { refreshObjectives } from '../../ui'

export const NPC_PROFILES: Record<string, NpcProfile> = {
  thomas: { title: '见习巡士', role: '门廊封锁与初查联络', color: '#6898d0' },
  morris: { title: '庄园老管家', role: '钥匙保管与庄园掌事', color: '#7fa6b3' },
  eleanor: { title: '续弦夫人', role: '遗孀与草药调配者', color: '#b97ca8' },
  julian: { title: '长子少爷', role: '家族继承人与重大嫌犯', color: '#d06868' },
  vincent: { title: '家庭医生', role: '主治医师与毒物学者', color: '#568878' },
  cecilia: { title: '盲女琴师', role: '收留乐师与听觉证人', color: '#c8a87c' },
}

export const DLG: Record<string, () => DialogueTree> = {
  thomas() {
    const f = G.flags
    return {
      start: f.caseStarted ? 'hub' : 'intro',
      nodes: {
        intro: {
          ...line('thomas_intro'),
          ch: [
            { t: '书房现场的详细状况如何？', next: 't1' },
            { t: '庄园里目前有哪些涉案人员？', next: 't2' },
            {
              t: '【洞察力 4】如果门窗全在内部扣死，凶手要么还在房内，要么利用了机关。',
              req: { ins: 4 },
              act: () => {
                checkFX('ins', 4)
                gainXP(15, '敏锐的密室直觉')
              },
              next: 't3',
            },
            {
              t: '我立刻开始现场勘查。',
              act: () => {
                f.caseStarted = 1
                refreshObjectives()
              },
              next: null,
            },
          ],
        },
        t1: {
          ...line('thomas_t1'),
          ch: [
            { t: '庄园里现在都有谁？', next: 't2' },
            {
              t: '我去现场看看。',
              act: () => {
                f.caseStarted = 1
                refreshObjectives()
              },
              next: null,
            },
          ],
        },
        t2: {
          ...line('thomas_t2'),
          ch: [
            { t: '书房里还有别的可疑之处吗？', next: 't1' },
            {
              t: '我明白了，立刻展开调查。',
              act: () => {
                f.caseStarted = 1
                refreshObjectives()
              },
              next: null,
            },
          ],
        },
        t3: {
          ...line('thomas_t3'),
          ch: [
            { t: '涉案人员都在哪里？', next: 't2' },
            {
              t: '去书房现场。',
              act: () => {
                f.caseStarted = 1
                refreshObjectives()
              },
              next: null,
            },
          ],
        },
        hub: {
          ...(f.deductionCorrect
            ? line('thomas_hub_verdict')
            : (G.clues.length ? line('thomas_hub_clues', G.clues.length) : line('thomas_hub_default'))),
          ch: [
            { t: '山下的暴风雪情况如何？', next: 'weather' },
            {
              t: '提交结案，召集全员审判。',
              cond: () => f.deductionCorrect,
              act: () => {
                closeModal('boardModal')
                openTrial(false)
              },
              next: null,
            },
            { t: '（继续调查）', next: null },
          ],
        },
        weather: {
          ...line('thomas_weather'),
          ch: [{ t: '（记下）', next: 'hub' }],
        },
      },
    }
  },

  morris() {
    const f = G.flags
    return {
      start: f.morrisTalked ? 'again' : 'init',
      nodes: {
        init: {
          ...line('morris_init'),
          ch: [
            {
              t: '午夜撞门前后的详细经过是怎样的？',
              act: () => { f.morrisTalked = 1 },
              next: 'midnight',
            },
            {
              t: '关于壁炉里未烧尽的遗嘱残页……',
              cond: () => G.clues.includes('clue_will_remnant'),
              act: () => { f.morrisTalked = 1 },
              next: 'will',
            },
            {
              t: '【学识 4】你右腿曾受枪伤微跛——当年黑杉矿难到底藏着什么？',
              req: { kno: 4 },
              cond: () => !f.mineAsked,
              act: () => {
                checkFX('kno', 4)
                f.mineAsked = 1
                gainXP(20, '挖掘矿难秘辛')
              },
              next: 'mine',
            },
            {
              t: '出示未烧尽的遗嘱残页：男爵如此丧心病狂，当年矿难到底藏着什么隐情？',
              cond: () => !f.mineAsked && G.clues.includes('clue_will_remnant'),
              act: () => {
                f.mineAsked = 1
                gainXP(15, '以物证触动老管家')
              },
              next: 'mine',
            },
            { t: '（稍后再谈）', next: null },
          ],
        },
        again: {
          ...line('morris_again'),
          ch: [
            { t: '复述一遍午夜撞门的时刻。', next: 'midnight' },
            {
              t: '关于壁炉里的那份绝情遗嘱。',
              cond: () => G.clues.includes('clue_will_remnant'),
              next: 'will',
            },
            {
              t: '【学识 4】告诉我二十年前黑杉矿难的真相。',
              req: { kno: 4 },
              cond: () => !f.mineAsked,
              act: () => {
                checkFX('kno', 4)
                f.mineAsked = 1
                gainXP(20, '挖掘矿难秘辛')
              },
              next: 'mine',
            },
            {
              t: '出示遗嘱残页追问：二十年前黑杉矿难的真相究竟是什么？',
              cond: () => !f.mineAsked && G.clues.includes('clue_will_remnant'),
              act: () => {
                f.mineAsked = 1
                gainXP(15, '以物证触动老管家')
              },
              next: 'mine',
            },
            {
              t: '我需要搜查医务室与凡森特的药柜。',
              cond: () => f.mineAsked && !f.clinicOpen,
              next: 'key',
            },
            { t: '（离开）', next: null },
          ],
        },
        midnight: {
          ...line('morris_midnight'),
          ch: [{ t: '（记下撞门时刻）', next: 'again' }],
        },
        will: {
          ...line('morris_will'),
          ch: [{ t: '（记下男爵的疯狂遗嘱）', next: 'again' }],
        },
        mine: {
          ...line('morris_mine'),
          ch: [
            {
              t: '把当年的血账交给我作为铁证。',
              act: () => {
                addClue('clue_mine_ledger')
                f.mineLedgerFound = 1
              },
              next: 'key',
            },
          ],
        },
        key: {
          ...line('morris_key'),
          ch: [
            {
              t: '接过黄铜钥匙。',
              act: () => {
                f.clinicOpen = 1
                setFlag('clinicOpen')
                gainXP(15, '获得医务室搜查权')
                refreshObjectives()
              },
              next: 'again',
            },
          ],
        },
      },
    }
  },

  eleanor() {
    const f = G.flags
    return {
      start: f.eleanorTalked ? 'again' : 'init',
      nodes: {
        init: {
          ...line('eleanor_init'),
          ch: [
            {
              t: '地毯上那杯散发苦杏仁味的晚安茶是怎么回事？',
              act: () => { f.eleanorTalked = 1 },
              next: 'tea',
            },
            {
              t: '【心理学 4】你手腕上的青紫是马鞭抽的——你在茶里下了什么？',
              req: { psy: 4 },
              cond: () => !f.teaConfessed,
              act: () => {
                checkFX('psy', 4)
                f.teaConfessed = 1
                gainXP(20, '攻破心防')
              },
              next: 'tea_confess',
            },
            {
              t: '书桌上的沉香止痛蜡烛是谁制作的？',
              cond: () => G.clues.includes('clue_candle'),
              next: 'candle',
            },
            { t: '（稍后再谈）', next: null },
          ],
        },
        again: {
          ...line('eleanor_again'),
          ch: [
            {
              t: '【心理学 4】把茶水的事情向我彻底坦白。',
              req: { psy: 4 },
              cond: () => !f.teaConfessed,
              act: () => {
                checkFX('psy', 4)
                f.teaConfessed = 1
                gainXP(20, '攻破心防')
              },
              next: 'tea_confess',
            },
            {
              t: '关于温室制作的沉香止痛蜡烛。',
              cond: () => G.clues.includes('clue_candle'),
              next: 'candle',
            },
            {
              t: '茶水没有被咽下，你并没有杀死他。',
              cond: () => f.teaConfessed && G.clues.includes('clue_autopsy_vane'),
              next: 'relief',
            },
            { t: '（离开温室）', next: null },
          ],
        },
        tea: {
          ...line('eleanor_tea'),
          ch: [{ t: '（若有所思）', next: 'again' }],
        },
        tea_confess: {
          ...line('eleanor_tea'),
          ch: [
            {
              t: '记录艾莲娜的口供，获悉温室隐秘手记的所在。',
              act: () => {
                addClue('clue_eleanor_herbs')
              },
              next: 'again',
            },
          ],
        },
        candle: {
          ...line('eleanor_candle'),
          ch: [{ t: '（原来蜡烛配方源自凡森特医生）', next: 'again' }],
        },
        relief: {
          ...line('eleanor_relief'),
          ch: [{ t: '（安抚遗孀）', next: 'again' }],
        },
      },
    }
  },

  julian() {
    const f = G.flags
    return {
      start: f.julianTalked ? 'again' : 'init',
      nodes: {
        init: {
          ...line('julian_init'),
          ch: [
            {
              t: '【洞察力 4】刺入胸口的银刀刀口几乎没有出血，生活反应为零。',
              req: { ins: 4 },
              act: () => {
                checkFX('ins', 4)
                f.julianConfessed = 1
                gainXP(20, '戳穿死后伪刺')
              },
              next: 'knife',
            },
            {
              t: '出示尸检报告：创口全无生活反应，你在他死后补刺是为了掩盖什么？',
              cond: () => G.clues.includes('clue_autopsy_vane'),
              act: () => {
                f.julianConfessed = 1
                gainXP(15, '以尸检铁证攻破心防')
              },
              next: 'knife',
            },
            {
              t: '你的家徽银刀插在死者胸口，你该怎么解释？',
              act: () => { f.julianTalked = 1 },
              next: 'again',
            },
            { t: '（先去搜集更多证据）', next: null },
          ],
        },
        again: {
          ...line('julian_again'),
          ch: [
            {
              t: '【洞察力 4】法医已经查明：银刀是在男爵死后才刺入的！',
              req: { ins: 4 },
              cond: () => !f.julianConfessed,
              act: () => {
                checkFX('ins', 4)
                f.julianConfessed = 1
                gainXP(20, '戳穿死后伪刺')
              },
              next: 'knife',
            },
            {
              t: '出示尸检记录：男爵死于乌头碱中毒，胸前银刀是死后补刺的伪证！',
              cond: () => !f.julianConfessed && G.clues.includes('clue_autopsy_vane'),
              act: () => {
                f.julianConfessed = 1
                gainXP(15, '以尸检铁证攻破心防')
              },
              next: 'knife',
            },
            {
              t: '交代你昨夜溜进书房的全部动机。',
              cond: () => f.julianConfessed,
              next: 'stab',
            },
            { t: '（离开客房）', next: null },
          ],
        },
        knife: {
          ...line('julian_knife'),
          ch: [
            {
              t: '为什么还要拔出拆信刀刺入他的胸口？',
              next: 'stab',
            },
          ],
        },
        stab: {
          ...line('julian_stab'),
          ch: [
            {
              t: '收缴沾血的鹿皮手套。',
              act: () => {
                addClue('clue_julian_gloves')
              },
              next: 'again',
            },
          ],
        },
      },
    }
  },

  vincent() {
    const f = G.flags
    return {
      start: f.vincentTalked ? 'again' : 'init',
      nodes: {
        init: {
          ...line('vincent_init'),
          ch: [
            {
              t: '男爵长年服用的药物与治疗方案是怎样的？',
              act: () => { f.vincentTalked = 1 },
              next: 'medical',
            },
            {
              t: '【学识 5】瞳孔散大与口鼻泡沫——这不是哮喘，是乌头碱中毒！',
              req: { kno: 5 },
              cond: () => G.clues.includes('clue_autopsy_vane'),
              act: () => {
                checkFX('kno', 5)
                gainXP(20, '专业毒理博弈')
              },
              next: 'medical',
            },
            {
              t: '【逻辑 4】注射器里的熔蜡、蜡芯针孔、二十年前矿难合伙人幼子……全对上了！',
              req: { int: 4 },
              cond: () => G.clues.includes('clue_syringe') && G.clues.includes('clue_mine_ledger'),
              act: () => {
                checkFX('int', 4)
                f.vincentConfessed = 1
                gainXP(30, '铁证终极对峙')
              },
              next: 'confront',
            },
            { t: '（稍后再谈）', next: null },
          ],
        },
        again: {
          ...line('vincent_again'),
          ch: [
            { t: '再谈谈男爵的哮喘与止痛蜡烛。', next: 'medical' },
            {
              t: '【逻辑 4】理查德的儿子……凡森特医生，这场死局是你量身定做的吧？',
              req: { int: 4 },
              cond: () => G.clues.includes('clue_syringe') && G.clues.includes('clue_mine_ledger') &&
                !f.vincentConfessed,
              act: () => {
                checkFX('int', 4)
                f.vincentConfessed = 1
                gainXP(30, '铁证终极对峙')
              },
              next: 'confront',
            },
            {
              t: '告诉我延时密室与机关的全部细节。',
              cond: () => f.vincentConfessed,
              next: 'truth',
            },
            { t: '（离开医务室）', next: null },
          ],
        },
        medical: {
          ...line('vincent_medical'),
          ch: [{ t: '（谨慎记录）', next: 'again' }],
        },
        confront: {
          ...line('vincent_confront'),
          ch: [
            {
              t: '为什么要在发条钟上布置密室机关？',
              next: 'truth',
            },
          ],
        },
        truth: {
          ...line('vincent_truth'),
          ch: [
            {
              t: '（真凶身份与手法全部水落石出）',
              act: () => {
                refreshObjectives()
              },
              next: 'again',
            },
          ],
        },
      },
    }
  },

  cecilia() {
    const f = G.flags
    return {
      start: f.ceciliaTalked ? 'again' : 'init',
      nodes: {
        init: {
          ...line('cecilia_init'),
          ch: [
            {
              t: '【洞察力 4】昨夜二楼回廊回荡的风雪与琴声中，你听到了什么？',
              req: { ins: 4 },
              act: () => {
                checkFX('ins', 4)
                f.ceciliaTalked = 1
                gainXP(20, '聆听绝对音感')
              },
              next: 'sound',
            },
            {
              t: '你对这座庄园的人和事怎么看？',
              act: () => { f.ceciliaTalked = 1 },
              next: 'mercy',
            },
            { t: '（不打扰琴声）', next: null },
          ],
        },
        again: {
          ...line('cecilia_again'),
          ch: [
            {
              t: '【洞察力 4】请再为我复述一遍昨夜声响的时间线。',
              req: { ins: 4 },
              cond: () => !G.clues.includes('clue_piano_witness'),
              act: () => {
                checkFX('ins', 4)
                gainXP(15, '梳理声音时间线')
              },
              next: 'sound',
            },
            {
              t: '关于凡森特医生在庄园的为人。',
              next: 'mercy',
            },
            { t: '（静听琴声）', next: null },
          ],
        },
        sound: {
          ...line('cecilia_sound'),
          ch: [
            {
              t: '记录下这份关键的声音证词。',
              act: () => {
                addClue('clue_piano_witness')
              },
              next: 'again',
            },
          ],
        },
        mercy: {
          ...line('cecilia_mercy'),
          ch: [{ t: '（琴声悠扬哀婉）', next: 'again' }],
        },
      },
    }
  },
}
