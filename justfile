# Show all available recipes
[no-cd]
default:
    @just --list --unsorted

# fetch all claude agent sdk doc by jina
claude *args:
    uv run data/claude-agent-skill/fetch_docs.py {{args}}


# slowly fetch claude
claude-slow:
    uv run data/claude-agent-skill/fetch_docs.py -c 1 -d 5 --force
