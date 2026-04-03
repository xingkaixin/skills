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

export interface VendorSpec {
  source: string
  official?: boolean
  skillsRoot?: string
  skills: Record<string, string>
}

export const sources: Record<string, SourceSpec> = {
  'claude-agent-skill': {
    kind: 'script',
    fetchCommand: ['node', 'scripts/fetch-source-docs.ts', 'claude-agent-skill'],
  },
}

export const vendors: Record<string, VendorSpec> = {
  anthropics: {
    official: true,
    source: 'https://github.com/anthropics/skills',
    skills: {
      'canvas-design': 'canvas-design',
      'frontend-design': 'frontend-design',
    },
  },
  psiace: {
    source: 'https://github.com/psiace/skills',
    skills: {
      'friendly-python': 'friendly-python',
      piglet: 'piglet',
      'modular-go': 'modular-go',
      'fast-rust': 'fast-rust',
    },
  },
  openai: {
    official: true,
    source: 'https://github.com/openai/skills',
    skillsRoot: 'skills/.curated',
    skills: {
      'cloudflare-deploy': 'cloudflare-deploy',
      'gh-fix-ci': 'gh-fix-ci',
    },
  },
  antfu: {
    source: 'https://github.com/antfu/skills',
    skills: {
      vitest: 'vitest',
      slidev: 'slidev',
    },
  },
  context7: {
    source: 'https://github.com/upstash/context7',
    skillsRoot: 'plugins/claude',
    skills: {
      context7: 'context7-cli',
    },
  },
  'playwright-cli': {
    source: 'https://github.com/microsoft/playwright-cli',
    skills: {
      'playwright-cli': 'playwright-cli',
    },
  },
  dify: {
    source: 'https://github.com/langgenius/dify',
    skillsRoot: '.agents/skills',
    skills: {
      'frontend-testing': 'frontend-testing',
    },
  },
  hono: {
    source: 'https://github.com/yusukebe/hono-skill',
    skills: {
      hono: 'hono',
    },
  },
  'design-taste-frontend': {
    source: 'https://github.com/leonxlnx/taste-skill',
    skills: {
      'taste-skill': 'design-taste-frontend',
    },
  },
  'ui-ux-pro-max': {
    source: 'https://github.com/nextlevelbuilder/ui-ux-pro-max-skill',
    skillsRoot: '.claude/skills',
    skills: {
      'ui-ux-pro-max': 'ui-ux-pro-max',
    },
  },
  impeccable: {
    source: 'https://github.com/pbakaus/impeccable',
    skillsRoot: '.agents/skills',
    skills: {
      adapt: 'adapt',
      clarify: 'clarify',
      arrange: 'arrange',
    },
  },
  shadcn: {
    source: 'https://github.com/shadcn-ui/ui',
    skills: {
      shadcn: 'shadcn',
    },
  },
  streamdown: {
    source: 'https://github.com/vercel/streamdown',
    skills: {
      streamdown: 'streamdown',
    },
  },
  'agent-dump': {
    source: 'https://github.com/xingkaixin/agent-dump',
    skills: {
      'agent-dump': 'agent-dump',
    },
  },
  'db-ferry': {
    source: 'https://github.com/xingkaixin/db-ferry',
    skills: {
      'db-ferry': 'db-ferry',
    },
  },
  'data-service-cli': {
    source: 'https://github.com/xingkaixin/data-service-cli',
    skills: {
      ds: 'ds',
    },
  },
  'agent-browser': {
    source: 'https://github.com/vercel-labs/agent-browser',
    skills: {
      'agent-browser': 'agent-browser',
    },
  },
  'agent-skills': {
    source: 'https://github.com/vercel-labs/agent-skills',
    skills: {
      'web-design-guidelines': 'web-design-guidelines',
      'react-best-practices': 'react-best-practices',
      'react-view-transitions': 'react-view-transitions',
      'composition-patterns': 'composition-patterns',
    },
  },
}
