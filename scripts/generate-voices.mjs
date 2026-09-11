import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..')

const localTempDir = path.join(rootDir, '.local')
if (!fs.existsSync(localTempDir)) {
  fs.mkdirSync(localTempDir, { recursive: true })
}

try {
  execFileSync('ffmpeg', ['-version'], { stdio: 'ignore' })
} catch {
  console.error('Error: ffmpeg is not found in PATH! Please ensure ffmpeg is installed.')
  process.exit(1)
}

const apiKey = process.env.MIMO_API_KEY
if (!apiKey) {
  console.error('Error: MIMO_API_KEY environment variable is not set!')
  process.exit(1)
}

function findCaseDialoguePath(cid) {
  const tsPath = path.join(rootDir, 'src', 'cases', cid, 'dialogueLines.ts')
  if (fs.existsSync(tsPath)) return tsPath
  const jsPath = path.join(rootDir, 'src', 'cases', cid, 'dialogueLines.js')
  if (fs.existsSync(jsPath)) return jsPath
  return null
}

function getAvailableCases() {
  const casesDir = path.join(rootDir, 'src', 'cases')
  if (!fs.existsSync(casesDir)) return []
  return fs.readdirSync(casesDir, { withFileTypes: true })
    .filter(d => d.isDirectory() && Boolean(findCaseDialoguePath(d.name)))
    .map(d => d.name)
}

function resolveVoicePrompt(item, npcVoiceDesigns) {
  const isEn = /[a-zA-Z]/.test(item.prompt || '') && !/[\u4e00-\u9fa5]/.test(item.prompt || '')
  const sep = isEn ? ' Delivery / mood: ' : ' 当前语气状态：'
  if (item.voiceDesign) {
    return item.prompt ? `${ item.voiceDesign }${ sep }${ item.prompt }` : item.voiceDesign
  }
  const baseDesign = (item.npc && npcVoiceDesigns[item.npc]) || ''
  if (baseDesign && item.prompt) {
    return `${ baseDesign }${ sep }${ item.prompt }`
  }
  return baseDesign || item.prompt || (isEn ? 'Natural adult voice, steady and clear.' : '普通成年人音色，语气自然平稳。')
}

function convertToOgg(srcPath, destPath) {
  execFileSync('ffmpeg', [
    '-y',
    '-v', 'error',
    '-i', srcPath,
    '-map', '0:a:0',
    '-vn',
    '-c:a', 'libopus',
    '-b:a', '128k',
    '-map_metadata', '-1',
    '-map_chapters', '-1',
    '-fflags', '+bitexact',
    '-flags:a', '+bitexact',
    destPath,
  ])
}

async function requestTts(item) {
  const postData = JSON.stringify({
    model: 'mimo-v2.5-tts-voicedesign',
    messages: [
      { role: 'user', content: item.voicePrompt },
      { role: 'assistant', content: item.ttsText },
    ],
    audio: {
      format: 'mp3',
    },
  })

  const res = await fetch('https://api.xiaomimimo.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'api-key': apiKey,
      'Content-Type': 'application/json',
    },
    body: postData,
    signal: AbortSignal.timeout(30000),
  })

  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`HTTP ${ res.status }: ${ errText }`)
  }

  const json = await res.json()
  const b64 = json.choices?.[0]?.message?.audio?.data
  if (!b64) {
    throw new Error(`No audio data returned: ${ JSON.stringify(json) }`)
  }

  return Buffer.from(b64, 'base64')
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function processCase(caseId, targetId, forceAll) {
  const caseModulePath = findCaseDialoguePath(caseId)
  if (!caseModulePath) {
    console.error(`Error: Case dialogueLines not found for case "${ caseId }"!`)
    return { generated: 0, skipped: 0, total: 0, failed: 0 }
  }

  const caseModule = await import(`file://${ caseModulePath.replace(/\\/g, '/') }`)
  const { DIALOGUE_LINES, NPC_VOICE_DESIGNS } = caseModule
  const npcVoiceDesigns = NPC_VOICE_DESIGNS || {}
  const outDir = path.join(rootDir, 'public', 'cases', caseId, 'audio', 'voice')

  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true })
  }

  const allLines = Object.values(DIALOGUE_LINES).map(item => ({
    id: item.id,
    npc: item.npc,
    speaker: item.speaker,
    voicePrompt: resolveVoicePrompt(item, npcVoiceDesigns),
    ttsText: item.tts || (typeof item.text === 'function' ? item.text() : item.text),
  }))

  const lines = targetId
    ? allLines.filter(item => item.id === targetId)
    : allLines

  if (targetId && lines.length === 0) {
    console.error(`Error: Dialogue ID "${ targetId }" not found in case "${ caseId }"!`)
    return { generated: 0, skipped: 0, total: 0, failed: 1 }
  }

  console.log(`\n=== Case: [${ caseId }] (${ lines.length } dialogue lines) ===`)
  let generated = 0
  let skipped = 0
  let failed = 0

  for (let i = 0; i < lines.length; i++) {
    const item = lines[i]
    const oggPath = path.join(outDir, `${ item.id }.ogg`)
    const legacyMp3 = path.join(outDir, `${ item.id }.mp3`)

    const shouldForce = forceAll || Boolean(targetId)
    const hasOgg = fs.existsSync(oggPath) && fs.statSync(oggPath).size > 1000

    if (!shouldForce && hasOgg) {
      if (fs.existsSync(legacyMp3)) {
        fs.unlinkSync(legacyMp3)
      }
      console.log(`[${ i + 1 }/${ lines.length }] Skipped (exists): ${ item.id }.ogg`)
      skipped++
      continue
    }

    if (!shouldForce && !hasOgg && fs.existsSync(legacyMp3) && fs.statSync(legacyMp3).size > 1000) {
      try {
        convertToOgg(legacyMp3, oggPath)
        fs.unlinkSync(legacyMp3)
        const oggSize = fs.statSync(oggPath).size
        console.log(`[${ i + 1 }/${ lines.length }] Converted legacy to .ogg: ${ item.id }.ogg (${ oggSize } bytes)`)
        generated++
        continue
      } catch (err) {
        console.warn(`  -> Local conversion failed: ${ err.message }, falling back to re-generation`)
      }
    }

    console.log(`[${ i + 1 }/${ lines.length }] Generating: ${ item.id } (${ item.speaker } / voicedesign)...`)

    let success = false
    for (let retry = 1; retry <= 3; retry++) {
      const tempMp3Path = path.join(localTempDir, `temp_${ item.id }_${ Date.now() }.mp3`)
      try {
        const audioBuf = await requestTts(item)
        fs.writeFileSync(tempMp3Path, audioBuf)
        convertToOgg(tempMp3Path, oggPath)
        if (fs.existsSync(legacyMp3)) {
          fs.unlinkSync(legacyMp3)
        }
        const oggSize = fs.statSync(oggPath).size
        console.log(`  -> Saved ${ item.id }.ogg (${ oggSize } bytes, clean metadata)`)
        generated++
        success = true
        break
      } catch (err) {
        console.error(`  -> Attempt ${ retry } failed: ${ err.message }`)
        if (retry < 3) {
          await sleep(1500)
        }
      } finally {
        if (fs.existsSync(tempMp3Path)) {
          fs.unlinkSync(tempMp3Path)
        }
      }
    }

    if (!success) {
      console.error(`  -> Failed to generate ${ item.id }!`)
      failed++
    }

    await sleep(300)
  }

  return { generated, skipped, total: lines.length, failed }
}

async function main() {
  const forceAll = process.argv.includes('--force')
  const positionalArgs = process.argv.slice(2).filter(a => !a.startsWith('--'))
  const availableCases = getAvailableCases()

  let casesToRun = []
  let targetId = null

  if (positionalArgs.length === 0 || positionalArgs[0] === 'all') {
    casesToRun = availableCases
  } else if (availableCases.includes(positionalArgs[0])) {
    casesToRun = [positionalArgs[0]]
    if (positionalArgs.length >= 2) {
      targetId = positionalArgs[1]
    }
  } else {
    targetId = positionalArgs[0]
    if (positionalArgs.length >= 2 && availableCases.includes(positionalArgs[1])) {
      casesToRun = [positionalArgs[1]]
    } else {
      casesToRun = availableCases
    }
  }

  let totalGenerated = 0
  let totalSkipped = 0
  let totalCount = 0
  let totalFailed = 0

  for (const cid of casesToRun) {
    const stats = await processCase(cid, targetId, forceAll)
    totalGenerated += stats.generated
    totalSkipped += stats.skipped
    totalCount += stats.total
    totalFailed += stats.failed
  }

  console.log(`\n========================================`)
  console.log(
    `Summary: Generated: ${ totalGenerated }, Skipped: ${ totalSkipped }, Failed: ${ totalFailed }, Total: ${ totalCount }`)
  console.log(`========================================`)

  if (totalFailed > 0) {
    process.exit(1)
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch(err => {
    console.error('Fatal error in generate-voices:', err)
    process.exit(1)
  })
}
