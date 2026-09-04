import { line } from './dialogueLines.js'
import { addClue, checkFX, closeModal, G, gainXP, removeItem, setFlag } from './state.js'
import { openTrial } from './trial.js'
import { refreshObjectives } from './ui.js'
import { openGate } from './world.js'

export const DLG = {
  sheriff() {
    const f = G.flags
    return {
      start: f.caseStarted ? 'hub' : 'intro', nodes: {
        intro: {
          ...line('sheriff_intro'), ch: [
            { t: '死亡时间和现场情况？', next: 't1' },
            { t: '有嫌疑人吗？', next: 't2' },
            {
              t: '【洞察力 4】门口的脚印很乱——昨夜在场的，不止一个人。', req: { ins: 4 }, act: () => {
                checkFX('ins', 4)
                gainXP(15, '敏锐的开场')
              }, next: 't3',
            },
            {
              t: '我去看看现场。', act: () => {
                f.caseStarted = 1
                refreshObjectives()
              }, next: null,
            }],
        },
        t1: {
          ...line('sheriff_t1'),
          ch: [
            { t: '有嫌疑人吗？', next: 't2' }, {
              t: '我这就去。', act: () => {
                f.caseStarted = 1
                refreshObjectives()
              }, next: null,
            }],
        },
        t2: {
          ...line('sheriff_t2'),
          ch: [
            { t: '死亡时间呢？', next: 't1' }, {
              t: '我去现场。', act: () => {
                f.caseStarted = 1
                refreshObjectives()
              }, next: null,
            }],
        },
        t3: {
          ...line('sheriff_t3'),
          ch: [
            { t: '嫌疑人有谁？', next: 't2' }, {
              t: '现场见。', act: () => {
                f.caseStarted = 1
                refreshObjectives()
              }, next: null,
            }],
        },
        hub: {
          ...(f.deductionCorrect
            ? line('sheriff_hub_verdict')
            : (G.clues.length ? line('sheriff_hub_clues', G.clues.length) : line('sheriff_hub_default'))),
          ch: [
            { t: '谈谈嫌疑人们。', next: 'sum' },
            { t: '关于那两种鞋印……', cond: () => f.caseStarted && !f.printAsked, act: () => {f.printAsked = 1}, next: 'prints' },
            {
              t: '【智力 5】把案发时间线给我复述一遍。', req: { int: 5 }, cond: () => !f.timelineBrief, act: () => {
                checkFX('int', 5)
                f.timelineBrief = 1
                gainXP(10, '梳理时间线')
              }, next: 'tl',
            },
            {
              t: '提交结案，进入审判。', cond: () => f.deductionCorrect, act: () => {
                closeModal('boardModal')
                openTrial(false)
              }, next: null,
            },
            { t: '（离开）', next: null }],
        },
        sum: {
          ...line('sheriff_sum'),
          ch: [{ t: '（记下）', next: 'hub' }],
        },
        prints: {
          ...line('sheriff_prints'),
          ch: [{ t: '（心里有数了）', next: 'hub' }],
        },
        tl: {
          ...line('sheriff_tl'),
          ch: [{ t: '（回到正题）', next: 'hub' }],
        },
      },
    }
  },
  coroner() {
    const f = G.flags
    return {
      start: 'a', nodes: {
        a: {
          ...(f.bodyDetail ? line('coroner_a_again') : line('coroner_a_init')),
          ch: [
            { t: '死亡时间？', cond: () => !G.clues.includes('clue_body'), act: () => addClue('clue_body'), next: 'b' },
            {
              t: '【学识 4】创口边缘，有二次撞击的痕迹吗？', req: { kno: 4 }, cond: () => !f.bodyDetail, act: () => {
                checkFX('kno', 4)
                f.bodyDetail = 1
                addClue('clue_body')
                gainXP(10, '专业的提问')
              }, next: 'c',
            },
            { t: '明白了。', next: null }],
        },
        b: {
          ...line('coroner_b'),
          ch: [{ t: '（记在心里）', next: 'a' }],
        },
        c: {
          ...line('coroner_c'),
          ch: [{ t: '（记在心里）', next: 'a' }],
        },
      },
    }
  },
  martha() {
    const f = G.flags
    const aLine = f.marthaConfessed
      ? line('martha_a_confessed')
      : (f.caseStarted ? line('martha_a_busy') : line('martha_a_early'))
    return {
      start: 'a', nodes: {
        a: {
          ...aLine, ch: [
            { t: '你丈夫死了，夫人。请节哀。', next: 'b' },
            { t: '昨晚你在哪里？', next: 'c' },
            {
              t: '【心理学 5】你在害怕。不是怕凶手——是怕我们查出什么。',
              req: { psy: 5 },
              cond: () => !G.clues.includes('clue_wounds'),
              act: () => {
                checkFX('psy', 5)
                addClue('clue_wounds')
                gainXP(10, '看穿恐惧')
              },
              next: 'd',
            },
            {
              t: '【洞察力 5】（她袖口下，有淡淡的淤青。）', req: { ins: 5 }, cond: () => !G.clues.includes('clue_wounds'), act: () => {
                checkFX('ins', 5)
                addClue('clue_wounds')
              }, next: 'd',
            },
            { t: '他对你做过什么？', cond: () => G.clues.includes('clue_wounds') && !f.diaryHint, act: () => {f.diaryHint = 1}, next: 'e' },
            {
              t: '（出示日记）我读了你的日记，玛莎。', cond: () => G.clues.includes('clue_diary') && !f.marthaConfessed, act: () => {
                f.marthaConfessed = 1
                addClue('clue_confession')
                gainXP(20, '真相的重量')
              }, next: 'f',
            },
            { t: '（离开）', next: null }],
        },
        b: { ...line('martha_b'), ch: [{ t: '（继续）', next: 'a' }] },
        c: { ...line('martha_c'), ch: [{ t: '（继续）', next: 'a' }] },
        d: {
          ...line('martha_d'),
          ch: [{ t: '（沉默片刻）', next: 'a' }],
        },
        e: {
          ...line('martha_e'),
          ch: [{ t: '（点头）', next: 'a' }],
        },
        f: {
          ...line('martha_f'),
          ch: [{ t: '（离开）', next: null }],
        },
      },
    }
  },
  luke() {
    const f = G.flags
    return {
      start: 'a', nodes: {
        a: {
          ...(G.clues.includes('clue_luke') ? line('luke_a_after') : line('luke_a_init')),
          ch: [
            { t: '昨晚你在哪里？', cond: () => !G.clues.includes('clue_luke'), next: 'b' },
            {
              t: '【心理学 4】你在撒谎。你的眼睛一直在躲那把锤子。', req: { psy: 4 }, cond: () => !G.clues.includes('clue_luke'), act: () => {
                checkFX('psy', 4)
                addClue('clue_luke')
                gainXP(10, '撬开沉默')
              }, next: 'c',
            },
            {
              t: '（出示铁锤）这把锤子，你认得吗？',
              cond: () => G.clues.includes('clue_hammer') && !G.clues.includes('clue_luke'),
              act: () => addClue('clue_luke'),
              next: 'c',
            },
            { t: '他还对谁动过手？', cond: () => !f.lukeAbuse, act: () => {f.lukeAbuse = 1}, next: 'd' },
            { t: '（离开）', next: null }],
        },
        b: {
          ...line('luke_b'), ch: [
            {
              t: '【心理学 4】看着我，卢克。', req: { psy: 4 }, act: () => {
                checkFX('psy', 4)
                addClue('clue_luke')
                gainXP(10, '撬开沉默')
              }, next: 'c',
            },
            { t: '（先不逼他）', next: 'a' }],
        },
        c: {
          ...line('luke_c'),
          ch: [{ t: '（离开）', next: null }],
        },
        d: {
          ...line('luke_d'),
          ch: [{ t: '（记下）', next: 'a' }],
        },
      },
    }
  },
  pete() {
    const f = G.flags
    if (f.walletReturned) {
      return {
        start: 'a', nodes: {
          a: {
            ...line('pete_a_sober'), ch: [
              { t: '再讲讲那晚的事。', next: 'b' }, { t: '巴罗是什么人？', next: 'c' }, { t: '（离开）', next: null }],
          },
          b: {
            ...line('pete_b_sober'),
            ch: [{ t: '（离开）', next: null }],
          },
          c: { ...line('pete_c_sober'), ch: [{ t: '（离开）', next: null }] },
        },
      }
    }
    return {
      start: 'a', nodes: {
        a: {
          ...(G.inventory.includes('wallet') ? line('pete_a_see_wallet') : line('pete_a_drunk')),
          ch: [
            {
              t: '怎么回事？', cond: () => !f.walletQuest && !G.inventory.includes('wallet'), act: () => {
                f.walletQuest = 1
                refreshObjectives()
              }, next: 'b',
            },
            {
              t: '（交出钱包）', cond: () => G.inventory.includes('wallet'), act: () => {
                removeItem('wallet')
                f.walletReturned = 1
                gainXP(40, '支线 · 醉汉的钱包')
                setFlag('peteTip')
                openGate()
              }, next: 'c',
            },
            { t: '昨晚你看见什么了吗？', cond: () => !f.walletReturned, next: 'd' },
            { t: '（离开）', next: null }],
        },
        b: {
          ...line('pete_b'),
          ch: [{ t: '（去找找看）', next: null }],
        },
        c: {
          ...line('pete_c_return'),
          ch: [{ t: '（记下证词）', act: () => { addClue('clue_pete'); openGate(); }, next: null }],
        },
        d: {
          ...line('pete_d'),
          ch: [{ t: '（看来得先找钱包）', next: 'a' }],
        },
      },
    }
  },
  barrow() {
    const f = G.flags
    return {
      start: 'a', nodes: {
        a: {
          ...line('barrow_a'),
          ch: [
            {
              t: '有人听见你们案发当晚吵架。', cond: () => G.clues.includes('clue_pete') && !f.barrowAlibi, act: () => {
                f.barrowAlibi = 1
                gainXP(10, '当面对质')
              }, next: 'b',
            },
            {
              t: '【街头智慧 4】（敲了敲他的账本）让我看看账。', req: { strw: 4 }, cond: () => !G.clues.includes('clue_debt'), act: () => {
                checkFX('strw', 4)
                addClue('clue_debt')
              }, next: 'c',
            },
            { t: '让我看看账本。', cond: () => !G.clues.includes('clue_debt') && G.attrs.strw < 4, next: 'cref' },
            {
              t: '（出示保险单）这个，你认得吗？',
              cond: () => G.clues.includes('clue_insurance') && !f.insAsked,
              act: () => {f.insAsked = 1},
              next: 'e',
            },
            { t: '（离开）', next: null }],
        },
        b: {
          ...line('barrow_b'),
          ch: [{ t: '（暂时记下）', next: 'a' }],
        },
        c: {
          ...line('barrow_c'),
          ch: [{ t: '（合上账本）', next: 'a' }],
        },
        cref: {
          ...line('barrow_cref'),
          ch: [{ t: '（离开）', next: 'a' }],
        },
        e: {
          ...line('barrow_e'),
          ch: [{ t: '（离开）', next: 'a' }],
        },
      },
    }
  },
  greta() {
    const f = G.flags
    return {
      start: 'a', nodes: {
        a: {
          ...line('greta_a'), ch: [
            { t: '玛莎怎么了？', cond: () => !G.clues.includes('clue_gossip'), act: () => addClue('clue_gossip'), next: 'b' },
            { t: '案发那晚你听见什么？', cond: () => !f.gretaNight, act: () => {f.gretaNight = 1}, next: 'c' },
            { t: '巴罗是个什么样的人？', cond: () => !f.gretaBarrow, act: () => {f.gretaBarrow = 1}, next: 'd' },
            { t: '（离开）', next: null }],
        },
        b: {
          ...line('greta_b'),
          ch: [{ t: '（记下）', next: 'a' }],
        },
        c: {
          ...line('greta_c'),
          ch: [{ t: '（记下）', next: 'a' }],
        },
        d: {
          ...line('greta_d'),
          ch: [{ t: '（记下）', next: 'a' }],
        },
      },
    }
  },
}
