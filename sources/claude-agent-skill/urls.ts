const urls = {
  base: {
    Overview: 'https://platform.claude.com/docs/en/agent-sdk/overview',
    Quickstart: 'https://platform.claude.com/docs/en/agent-sdk/quickstart',
    'How the agent loop works': 'https://platform.claude.com/docs/en/agent-sdk/agent-loop',
  },
  'Core concepts': {
    'Use Claude Code features in the SDK': 'https://platform.claude.com/docs/en/agent-sdk/claude-code-features',
    'Work with sessions': 'https://platform.claude.com/docs/en/agent-sdk/sessions',
  },
  Guides: {
    'Streaming Input': 'https://platform.claude.com/docs/en/agent-sdk/streaming-vs-single-mode',
    'Stream responses in real-time': 'https://platform.claude.com/docs/en/agent-sdk/streaming-output',
    'Configure permissions': 'https://platform.claude.com/docs/en/agent-sdk/permissions',
    'Handle approvals and user input': 'https://platform.claude.com/docs/en/agent-sdk/user-input',
    'Intercept and control agent behavior with hooks': 'https://platform.claude.com/docs/en/agent-sdk/hooks',
    'Rewind file changes with checkpointing': 'https://platform.claude.com/docs/en/agent-sdk/file-checkpointing',
    'Get structured output from agents': 'https://platform.claude.com/docs/en/agent-sdk/structured-outputs',
    'Hosting the Agent SDK': 'https://platform.claude.com/docs/en/agent-sdk/hosting',
    'Securely deploying AI agents': 'https://platform.claude.com/docs/en/agent-sdk/secure-deployment',
    'Modifying system prompts': 'https://platform.claude.com/docs/en/agent-sdk/modifying-system-prompts',
    'Connect to external tools with MCP': 'https://platform.claude.com/docs/en/agent-sdk/mcp',
    'Custom Tools': 'https://platform.claude.com/docs/en/agent-sdk/custom-tools',
    'Subagents in the SDK': 'https://platform.claude.com/docs/en/agent-sdk/subagents',
    'Slash Commands in the SDK': 'https://platform.claude.com/docs/en/agent-sdk/slash-commands',
    'Agent Skills in the SDK': 'https://platform.claude.com/docs/en/agent-sdk/skills',
    'Track cost and usage': 'https://platform.claude.com/docs/en/agent-sdk/cost-tracking',
    'Todo Lists': 'https://platform.claude.com/docs/en/agent-sdk/todo-tracking',
    'Plugins in the SDK': 'https://platform.claude.com/docs/en/agent-sdk/plugins',
  },
  'SDK references': {
    'Agent SDK reference - TypeScript': 'https://platform.claude.com/docs/en/agent-sdk/typescript',
  },
} as const

export default urls
