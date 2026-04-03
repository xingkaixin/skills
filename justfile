# Show all available recipes
[no-cd]
default:
    @just --list --unsorted

# fetch all claude agent sdk doc by jina
claude *args:
    node scripts/fetch-source-docs.ts claude-agent-skill {{args}}


# slowly fetch claude
claude-slow:
    node scripts/fetch-source-docs.ts claude-agent-skill -c 1 -d 5 --force
