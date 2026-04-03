import { execFileSync } from 'node:child_process'
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

import { type RepoSourceSpec, type ScriptSourceSpec, sources, vendors } from '../meta.ts'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const managedSkillMarker = 'Managed-By: skills-sync'

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
  ensureDirectory(join(root, 'vendor'))
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

  for (const [name, config] of Object.entries(vendors)) {
    const submodulePath = resolveVendorPath(name)
    ensureParentDirectory(submodulePath)

    if (hasSubmodule(submodulePath)) {
      console.log(`skip vendor submodule: ${submodulePath}`)
      continue
    }

    runGit(['submodule', 'add', config.source, submodulePath], root)
    console.log(`added vendor submodule: ${submodulePath}`)
  }

  for (const [name, config] of Object.entries(getScriptSources())) {
    const sourcePath = resolveSourcePath(name, config)
    ensureDirectory(join(root, sourcePath))
    console.log(`prepared script source: ${sourcePath}`)
  }
}

function sync() {
  ensureDirectory(join(root, 'sources'))
  ensureDirectory(join(root, 'vendor'))
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

  for (const [vendorName, config] of Object.entries(vendors)) {
    const vendorPath = join(root, resolveVendorPath(vendorName))
    const skillsRoot = join(vendorPath, config.skillsRoot ?? 'skills')

    if (!existsSync(skillsRoot)) {
      console.warn(`skip vendor without configured skills root: ${resolveVendorPath(vendorName)}/${config.skillsRoot ?? 'skills'}`)
      continue
    }

    for (const [sourceSkillName, outputSkillName] of Object.entries(config.skills)) {
      const sourceSkillPath = join(skillsRoot, sourceSkillName)
      const outputSkillPath = join(root, 'skills', outputSkillName)

      if (!existsSync(sourceSkillPath)) {
        console.warn(`skip missing vendor skill: ${vendorName}/${sourceSkillName}`)
        continue
      }

      rmSync(outputSkillPath, { force: true, recursive: true })
      cpSync(sourceSkillPath, outputSkillPath, { recursive: true })

      writeSyncMetadata({
        outputSkillPath,
        sourceRepo: config.source,
        sourcePath: `${resolveVendorPath(vendorName)}/${config.skillsRoot ?? 'skills'}/${sourceSkillName}`,
        gitSha: getGitSha(vendorPath),
      })

      console.log(`synced skill: ${sourceSkillName} -> ${outputSkillName}`)
    }
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

  for (const [name] of Object.entries(vendors)) {
    const vendorPath = resolveVendorPath(name)
    statusLines.push(formatRepoStatus(`vendor:${name}`, vendorPath))
  }

  if (statusLines.length === 0) {
    console.log('no configured sources or vendors')
    return
  }

  for (const line of statusLines) {
    console.log(line)
  }
}

function cleanup() {
  cleanupSourceDirectories()
  cleanupVendorDirectories()
  cleanupManagedSkills()
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

function cleanupVendorDirectories() {
  const expected = new Set(Object.keys(vendors).map((name) => resolveVendorPath(name)))
  const vendorRoot = join(root, 'vendor')

  if (!existsSync(vendorRoot)) {
    return
  }

  for (const entry of readdirSync(vendorRoot, { withFileTypes: true })) {
    const relativePath = join('vendor', entry.name)
    const absolutePath = join(vendorRoot, entry.name)

    if (!entry.isDirectory() || expected.has(relativePath)) {
      continue
    }

    removeManagedPath(relativePath, absolutePath)
    console.log(`removed stale vendor: ${relativePath}`)
  }
}

function cleanupManagedSkills() {
  const expected = new Set<string>()

  for (const config of Object.values(vendors)) {
    for (const outputSkillName of Object.values(config.skills)) {
      expected.add(outputSkillName)
    }
  }

  const skillsRoot = join(root, 'skills')

  if (!existsSync(skillsRoot)) {
    return
  }

  for (const entry of readdirSync(skillsRoot, { withFileTypes: true })) {
    if (!entry.isDirectory() || expected.has(entry.name)) {
      continue
    }

    const skillPath = join(skillsRoot, entry.name)
    if (!isManagedSkill(skillPath)) {
      continue
    }

    rmSync(skillPath, { force: true, recursive: true })
    console.log(`removed stale managed skill: skills/${entry.name}`)
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

function writeSyncMetadata(options: {
  outputSkillPath: string
  sourceRepo: string
  sourcePath: string
  gitSha: string | null
}) {
  const content = [
    '# Sync Info',
    '',
    `- ${managedSkillMarker}`,
    `- Source Repo: \`${options.sourceRepo}\``,
    `- Source Path: \`${options.sourcePath}\``,
    `- Git SHA: \`${options.gitSha ?? 'unknown'}\``,
    `- Synced At: ${new Date().toISOString()}`,
    '',
  ].join('\n')

  writeFileSync(join(options.outputSkillPath, 'SYNC.md'), content, 'utf8')
}

function isManagedSkill(skillPath: string): boolean {
  const syncPath = join(skillPath, 'SYNC.md')
  if (!existsSync(syncPath)) {
    return false
  }

  return readFileSync(syncPath, 'utf8').includes(managedSkillMarker)
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

function getGitSha(cwd: string): string | null {
  try {
    return runGit(['rev-parse', 'HEAD'], cwd)
  }
  catch {
    return null
  }
}

function resolveSourcePath(name: string, config: RepoSourceSpec | ScriptSourceSpec): string {
  return config.path ?? join('sources', name)
}

function resolveVendorPath(name: string): string {
  return join('vendor', name)
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
