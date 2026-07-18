export interface RepoSourceSpec {
  kind: 'repo'
  provider: 'github' | 'gitlab' | 'generic'
  url: string
  path?: string
}

export interface ScriptSourceSpec {
  kind: 'script'
  fetchCommand: string[]
  path?: string
  checkMode?: 'manual'
}

export type SourceSpec = RepoSourceSpec | ScriptSourceSpec

export const sources: Record<string, SourceSpec> = {
  'claude-agent-skill': {
    kind: 'script',
    fetchCommand: ['node', 'scripts/fetch-source-docs.ts', 'claude-agent-skill'],
  },
}
