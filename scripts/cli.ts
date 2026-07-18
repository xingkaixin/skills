import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readdirSync, rmSync } from 'node:fs'
import { dirname, join } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

import { type RepoSourceSpec, type ScriptSourceSpec, sources } from '../meta.ts'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
type Command = 'init' | 'sync' | 'check' | 'cleanup'

function main() {
  try {
    const command = parseCommand(process.argv[2])

    switch (command) {
      case 'init':
        init()
        return
      case 'sync':
        sync()
        return
      case 'check':
        check()
        return
      case 'cleanup':
        cleanup()
        return
    }
  }
  catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error(message)
    process.exit(1)
  }
}

function parseCommand(value: string | undefined): Command {
  if (value === 'init' || value === 'sync' || value === 'check' || value === 'cleanup') {
    return value
  }

  console.error('Unknown command. Use one of: init, sync, check, cleanup')
  process.exit(1)
}

function init() {
  const repoSources = getRepoSources()

  ensureDirectory(join(root, 'sources'))
  ensureDirectory(join(root, 'skills'))

  for (const [name, config] of Object.entries(repoSources)) {
    const submodulePath = resolveSourcePath(name, config)
    ensureParentDirectory(submodulePath)

    if (hasSubmodule(submodulePath)) {
      console.log(`skip source submodule: ${submodulePath}`)
      continue
    }

    runGit(['submodule', 'add', config.url, submodulePath], root)
    console.log(`added source submodule: ${submodulePath}`)
  }

  for (const [name, config] of Object.entries(getScriptSources())) {
    const sourcePath = resolveSourcePath(name, config)
    ensureDirectory(join(root, sourcePath))
    console.log(`prepared script source: ${sourcePath}`)
  }
}

function sync() {
  ensureDirectory(join(root, 'sources'))
  ensureDirectory(join(root, 'skills'))

  if (hasGitmodules()) {
    runGit(['submodule', 'update', '--init', '--recursive', '--remote'], root)
    console.log('updated submodules')
  }

  for (const [name, config] of Object.entries(getScriptSources())) {
    const sourcePath = resolveSourcePath(name, config)
    ensureDirectory(join(root, sourcePath))

    runCommand(config.fetchCommand, root)
    console.log(`refreshed script source: ${sourcePath}`)
  }
}

function check() {
  const statusLines: string[] = []

  for (const [name, config] of Object.entries(getRepoSources())) {
    const sourcePath = resolveSourcePath(name, config)
    statusLines.push(formatRepoStatus(`source:${name}`, sourcePath))
  }

  for (const [name] of Object.entries(getScriptSources())) {
    statusLines.push(`source:${name} manual-check`)
  }

  if (statusLines.length === 0) {
    console.log('no configured sources')
    return
  }

  for (const line of statusLines) {
    console.log(line)
  }
}

function cleanup() {
  cleanupSourceDirectories()
}

function cleanupSourceDirectories() {
  const expectedTopLevelNames = new Set(
    Object.entries(sources)
      .map(([name, config]) => resolveSourcePath(name, config))
      .map((relativePath) => relativePath.split('/')[1])
      .filter(Boolean),
  )
  const sourcesRoot = join(root, 'sources')

  if (!existsSync(sourcesRoot)) {
    return
  }

  for (const entry of readdirSync(sourcesRoot, { withFileTypes: true })) {
    const relativePath = join('sources', entry.name)
    const absolutePath = join(sourcesRoot, entry.name)

    if (!entry.isDirectory() || expectedTopLevelNames.has(entry.name)) {
      continue
    }

    removeManagedPath(relativePath, absolutePath)
    console.log(`removed stale source: ${relativePath}`)
  }
}

function formatRepoStatus(label: string, relativePath: string): string {
  const absolutePath = join(root, relativePath)

  if (!existsSync(absolutePath)) {
    return `${label} missing`
  }

  try {
    runGit(['fetch', '--quiet'], absolutePath)
  }
  catch {
    return `${label} fetch-failed`
  }

  const remoteHead = getRemoteHeadRef(absolutePath)
  if (!remoteHead) {
    return `${label} no-remote-head`
  }

  const behind = Number.parseInt(runGit(['rev-list', '--count', `HEAD..${remoteHead}`], absolutePath), 10)
  if (behind > 0) {
    return `${label} behind ${behind}`
  }

  return `${label} up-to-date`
}

function getRemoteHeadRef(cwd: string): string | null {
  try {
    const ref = runGit(['symbolic-ref', '--quiet', 'refs/remotes/origin/HEAD'], cwd)
    return ref.replace(/^refs\/remotes\//, '')
  }
  catch {
    return null
  }
}

function removeManagedPath(relativePath: string, absolutePath: string) {
  if (hasSubmodule(relativePath)) {
    try {
      runGit(['submodule', 'deinit', '-f', '--', relativePath], root)
    }
    catch {
      // git submodule deinit may fail if the submodule was never initialized.
    }

    runGit(['rm', '-f', '--', relativePath], root)
    rmSync(join(root, '.git', 'modules', relativePath), { force: true, recursive: true })
    return
  }

  rmSync(absolutePath, { force: true, recursive: true })
}

function resolveSourcePath(name: string, config: RepoSourceSpec | ScriptSourceSpec): string {
  return config.path ?? join('sources', name)
}

function getRepoSources(): Record<string, RepoSourceSpec> {
  return Object.fromEntries(
    Object.entries(sources).filter(([, config]) => config.kind === 'repo'),
  ) as Record<string, RepoSourceSpec>
}

function getScriptSources(): Record<string, ScriptSourceSpec> {
  return Object.fromEntries(
    Object.entries(sources).filter(([, config]) => config.kind === 'script'),
  ) as Record<string, ScriptSourceSpec>
}

function hasSubmodule(relativePath: string): boolean {
  if (!hasGitmodules()) {
    return false
  }

  try {
    const output = runGit(['config', '--file', '.gitmodules', '--get-regexp', '^submodule\\..*\\.path$'], root)
    return output
      .split('\n')
      .map((line) => line.trim().split(' ').at(1))
      .includes(relativePath)
  }
  catch {
    return false
  }
}

function hasGitmodules(): boolean {
  return existsSync(join(root, '.gitmodules'))
}

function ensureParentDirectory(relativePath: string) {
  ensureDirectory(join(root, dirname(relativePath)))
}

function ensureDirectory(path: string) {
  mkdirSync(path, { recursive: true })
}

function runGit(args: string[], cwd: string): string {
  return execFileSync('git', args, {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim()
}

function runCommand(command: string[], cwd: string) {
  if (command.length === 0) {
    throw new Error('fetchCommand must not be empty')
  }

  execFileSync(command[0], command.slice(1), {
    cwd,
    stdio: 'inherit',
  })
}

main()
