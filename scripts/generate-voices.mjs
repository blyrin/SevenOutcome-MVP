import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { DIALOGUE_LINES } from '../src/dialogueLines.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..')
const outDir = path.join(rootDir, 'public', 'voice')

const apiKey = process.env.MIMO_API_KEY
if (!apiKey) {
  console.error('Error: MIMO_API_KEY environment variable is not set!')
  process.exit(1)
}

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true })
}

const ALL_LINES = Object.values(DIALOGUE_LINES).map(item => ({
  id: item.id,
  speaker: item.speaker,
  voice: item.voice,
  prompt: item.prompt,
  ttsText: item.tts || (typeof item.text === 'function' ? item.text() : item.text),
}))

async function requestTts(item) {
  const postData = JSON.stringify({
    model: 'mimo-v2.5-tts',
    messages: [
      { role: 'user', content: item.prompt },
      { role: 'assistant', content: item.ttsText },
    ],
    audio: {
      format: 'mp3',
      voice: item.voice,
    },
  })

  const res = await fetch('https://api.xiaomimimo.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'api-key': apiKey,
      'Content-Type': 'application/json',
    },
    body: postData,
  })

  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`HTTP ${res.status}: ${errText}`)
  }

  const json = await res.json()
  const b64 = json.choices?.[0]?.message?.audio?.data
  if (!b64) {
    throw new Error(`No audio data returned: ${JSON.stringify(json)}`)
  }

  return Buffer.from(b64, 'base64')
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function main() {
  const args = process.argv.slice(2)
  const targetId = args.find(a => !a.startsWith('--'))
  const forceAll = args.includes('--force')

  const lines = targetId
    ? ALL_LINES.filter(item => item.id === targetId)
    : ALL_LINES

  if (targetId && lines.length === 0) {
    console.error(`Error: Dialogue ID "${targetId}" not found!`)
    process.exit(1)
  }

  console.log(`Starting voice generation for ${lines.length} dialogue line(s)...`)
  let generated = 0
  let skipped = 0

  for (let i = 0; i < lines.length; i++) {
    const item = lines[i]
    const outPath = path.join(outDir, `${item.id}.mp3`)

    const shouldForce = forceAll || Boolean(targetId)
    if (!shouldForce && fs.existsSync(outPath) && fs.statSync(outPath).size > 1000) {
      console.log(`[${i + 1}/${lines.length}] Skipped (exists): ${item.id}.mp3`)
      skipped++
      continue
    }

    console.log(`[${i + 1}/${lines.length}] Generating: ${item.id} (${item.speaker} / ${item.voice})...`)

    let success = false
    for (let retry = 1; retry <= 3; retry++) {
      try {
        const audioBuf = await requestTts(item)
        fs.writeFileSync(outPath, audioBuf)
        console.log(`  -> Saved ${item.id}.mp3 (${audioBuf.length} bytes)`)
        generated++
        success = true
        break
      } catch (err) {
        console.error(`  -> Attempt ${retry} failed: ${err.message}`)
        if (retry < 3) {
          await sleep(1500)
        }
      }
    }

    if (!success) {
      console.error(`  -> Failed to generate ${item.id}!`)
    }

    await sleep(300)
  }

  console.log(`\nFinished! Generated: ${generated}, Skipped: ${skipped}, Total: ${lines.length}`)
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch(err => {
    console.error('Fatal error in generate-voices:', err)
    process.exit(1)
  })
}
