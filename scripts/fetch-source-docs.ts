import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import process from 'node:process'
import { fileURLToPath, pathToFileURL } from 'node:url'

type UrlSections = Record<string, Record<string, string>>

type Task = {
  key: string
  url: string
  outputPath: string
}

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const sourceDir = join(root, 'sources', args.sourceName)

  const config = await loadSourceConfig(sourceDir)
  const tasks = buildTasks(config, sourceDir)

  console.log(`source: ${args.sourceName}`)
  console.log(`tasks: ${tasks.length}`)
  console.log(`concurrent: ${args.concurrent}, delay: ${args.delay}s`)

  const existingCount = tasks.filter((task) => existsSync(task.outputPath)).length
  if (existingCount > 0) {
    if (args.force) {
      console.log(`overwrite existing files: ${existingCount}`)
    }
    else {
      console.log(`skip existing files: ${existingCount}`)
    }
  }

  let cursor = 0
  let success = 0
  let failed = 0

  const workers = Array.from({ length: Math.max(1, args.concurrent) }, async () => {
    while (cursor < tasks.length) {
      const task = tasks[cursor]
      cursor += 1

      const result = await processTask(task, args.force, args.delay)
      if (result) {
        success += 1
      }
      else {
        failed += 1
      }
    }
  })

  await Promise.all(workers)

  console.log(`done: success ${success}, failed ${failed}`)
  if (failed > 0) {
    process.exitCode = 1
  }
}

function parseArgs(argv: string[]) {
  if (argv.length === 0) {
    throw new Error('Usage: node scripts/fetch-source-docs.ts <source-name> [--force] [--concurrent <n>] [--delay <seconds>]')
  }

  const sourceName = argv[0]
  let force = false
  let concurrent = 2
  let delay = 1

  for (let index = 1; index < argv.length; index += 1) {
    const token = argv[index]

    if (token === '--force' || token === '-f') {
      force = true
      continue
    }

    if (token === '--concurrent' || token === '-c') {
      concurrent = Number.parseInt(argv[index + 1] ?? '', 10)
      index += 1
      continue
    }

    if (token === '--delay' || token === '-d') {
      delay = Number.parseFloat(argv[index + 1] ?? '')
      index += 1
      continue
    }

    throw new Error(`Unknown argument: ${token}`)
  }

  if (!Number.isInteger(concurrent) || concurrent <= 0) {
    throw new Error('concurrent must be a positive integer')
  }

  if (!Number.isFinite(delay) || delay < 0) {
    throw new Error('delay must be a non-negative number')
  }

  return { sourceName, force, concurrent, delay }
}

async function loadSourceConfig(sourceDir: string): Promise<UrlSections> {
  const configUrl = pathToFileURL(join(sourceDir, 'urls.ts')).href
  const module = await import(configUrl)
  return module.default as UrlSections
}

function buildTasks(config: UrlSections, sourceDir: string): Task[] {
  const tasks: Task[] = []

  for (const [sectionName, entries] of Object.entries(config)) {
    const outputDir = sectionName === 'base'
      ? sourceDir
      : join(sourceDir, sanitizeDirectoryName(sectionName))

    mkdirSync(outputDir, { recursive: true })

    for (const [key, url] of Object.entries(entries)) {
      tasks.push({
        key,
        url,
        outputPath: join(outputDir, sanitizeFileName(key)),
      })
    }
  }

  return tasks
}

async function processTask(task: Task, force: boolean, delaySeconds: number): Promise<boolean> {
  if (existsSync(task.outputPath) && !force) {
    console.log(`skip ${task.outputPath}`)
    return true
  }

  console.log(`fetch ${task.key}`)

  const content = await fetchWithRetry(task.url)
  if (content == null) {
    console.error(`failed ${task.url}`)
    return false
  }

  mkdirSync(dirname(task.outputPath), { recursive: true })
  writeFileSync(task.outputPath, content, 'utf8')

  if (delaySeconds > 0) {
    await sleep(delaySeconds * 1000)
  }

  return true
}

async function fetchWithRetry(url: string, maxRetries = 5): Promise<string | null> {
  const jinaUrl = `https://r.jina.ai/${url}.md`

  for (let attempt = 0; attempt < maxRetries; attempt += 1) {
    try {
      const response = await fetch(jinaUrl, {
        headers: {
          'User-Agent': 'skills-source-fetcher/1.0',
        },
      })

      if (response.ok) {
        return await response.text()
      }

      if (response.status === 429) {
        await sleep(5000 * (attempt + 1))
        continue
      }
    }
    catch {
      // Retry below.
    }

    await sleep(1000 * (2 ** attempt))
  }

  return null
}

function sanitizeFileName(name: string): string {
  return `${name.trim()}.md`
}

function sanitizeDirectoryName(name: string): string {
  return name.trim()
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exit(1)
})
