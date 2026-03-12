#!/usr/bin/env python3
"""
根据 TOML 配置文件抓取文档内容并生成文件/目录结构
支持并发下载和增量更新
"""

import tomllib
import asyncio
import argparse
from pathlib import Path
from dataclasses import dataclass
import aiohttp


@dataclass
class Task:
    key: str
    url: str
    output_path: Path


def sanitize_filename(name: str) -> str:
    """将 key 转换为合法的文件名，只去除首尾引号"""
    return name.strip('"') + ".md"


def sanitize_dirname(name: str) -> str:
    """将 section 名转换为合法的目录名，只去除首尾引号"""
    return name.strip('"')


async def fetch_content(
    session: aiohttp.ClientSession, url: str, max_retries: int = 5
) -> str:
    """通过 r.jina.ai 获取 URL 内容，带速率限制和退避重试"""
    jina_url = f"http://r.jina.ai/{url}.md"

    for attempt in range(max_retries):
        try:
            async with session.get(jina_url, timeout=aiohttp.ClientTimeout(total=30)) as resp:
                if resp.status == 200:
                    return await resp.text()
                # 429 限流错误，增加更长的退避时间
                if resp.status == 429:
                    wait_time = 5 * (attempt + 1)  # 5s, 10s, 15s...
                    print(f"  [429 限流] {url}, {wait_time}s 后重试...")
                    await asyncio.sleep(wait_time)
                    continue
                print(f"  HTTP {resp.status} for {url}")
        except Exception as e:
            print(f"  请求失败 (attempt {attempt + 1}): {url} - {e}")

        # 指数退避
        wait_time = 2 ** attempt + (attempt * 0.5)
        await asyncio.sleep(wait_time)

    return f"# Error fetching content from {url}\n"


async def process_one(
    session: aiohttp.ClientSession,
    task: Task,
    force: bool = False,
    delay: float = 1.0,
) -> bool:
    """处理单个文件，返回是否成功"""
    if task.output_path.exists() and not force:
        print(f"  [跳过] 已存在: {task.output_path.name}")
        return True

    print(f"  [下载] {task.key} -> {task.output_path.name}")
    content = await fetch_content(session, task.url)

    task.output_path.write_text(content, encoding="utf-8")

    # 每次请求后延迟，避免触发限流
    await asyncio.sleep(delay)
    return True


async def process_all(
    tasks: list[Task], force: bool = False, max_concurrent: int = 2, delay: float = 1.0
):
    """并发处理所有任务"""
    semaphore = asyncio.Semaphore(max_concurrent)

    async def bounded_process(session, task):
        async with semaphore:
            return await process_one(session, task, force, delay)

    # 限制连接数，减少并发压力
    connector = aiohttp.TCPConnector(limit=max_concurrent, limit_per_host=2)
    headers = {"User-Agent": "Mozilla/5.0 (compatible; DocFetcher/1.0)"}

    async with aiohttp.ClientSession(headers=headers, connector=connector) as session:
        results = await asyncio.gather(
            *[bounded_process(session, task) for task in tasks],
            return_exceptions=True,
        )

    success = sum(1 for r in results if r is True)
    failed = len(results) - success
    return success, failed


def parse_toml(toml_path: Path) -> list[Task]:
    """解析 TOML 文件，生成任务列表"""
    with open(toml_path, "rb") as f:
        config = tomllib.load(f)

    base_dir = toml_path.parent
    tasks = []

    for section_name, items in config.items():
        if not isinstance(items, dict):
            continue

        # 确定输出目录
        if section_name == "base":
            output_dir = base_dir
        else:
            dir_name = sanitize_dirname(section_name)
            output_dir = base_dir / dir_name
            output_dir.mkdir(parents=True, exist_ok=True)

        # 生成任务
        for key, url in items.items():
            filename = sanitize_filename(key)
            output_path = output_dir / filename
            tasks.append(Task(key=key, url=url, output_path=output_path))

    return tasks


def main():
    parser = argparse.ArgumentParser(description="抓取文档内容")
    parser.add_argument("--force", "-f", action="store_true", help="强制覆盖已存在的文件")
    parser.add_argument(
        "--concurrent", "-c", type=int, default=2, help="最大并发数（默认2，避免429）"
    )
    parser.add_argument(
        "--delay", "-d", type=float, default=1.0, help="请求间隔秒数（默认1.0）"
    )
    args = parser.parse_args()

    base_dir = Path("data/claude-agent-skill")
    toml_path = base_dir / "url.toml"

    if not toml_path.exists():
        print(f"Error: {toml_path} not found")
        return

    # 解析 TOML 生成任务
    tasks = parse_toml(toml_path)
    print(f"共 {len(tasks)} 个文档待处理")
    print(f"并发数: {args.concurrent}, 间隔: {args.delay}s\n")

    # 检查已有文件数量
    existing = sum(1 for t in tasks if t.output_path.exists())
    if existing > 0:
        if args.force:
            print(f"发现 {existing} 个已存在文件，将强制覆盖\n")
        else:
            print(f"发现 {existing} 个已存在文件，将自动跳过（使用 --force 覆盖）\n")

    # 执行下载
    success, failed = asyncio.run(
        process_all(tasks, args.force, args.concurrent, args.delay)
    )

    print(f"\n✓ 完成: 成功 {success}, 失败 {failed}")
    if failed > 0:
        print("失败的文件可以通过重新运行脚本重试")


if __name__ == "__main__":
    main()
