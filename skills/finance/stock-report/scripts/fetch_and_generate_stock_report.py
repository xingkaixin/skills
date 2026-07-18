#!/usr/bin/env python3
from __future__ import annotations

import json
import re
import subprocess
import sys
from dataclasses import dataclass
from datetime import date
from pathlib import Path


def resolve_repo_root() -> Path:
    current = Path(__file__).resolve()
    for candidate in current.parents:
        if (candidate / ".git").exists() and (candidate / "data").exists():
            return candidate
    raise RuntimeError("未识别到仓库根目录")


ROOT = resolve_repo_root()
SCRIPT_DIR = Path(__file__).resolve().parent
RAW_DIR_NAMES = [
    "iid_search.json",
    "basic_info_subject_1000933.json",
    "controller_subject_1000998.json",
    "executive_comp_subject_1001034.json",
    "share_capital_subject_1000987.json",
    "lockup_subject_1001006.json",
    "top10_holders_subject_1000991.json",
    "top10_float_holders_subject_1000996.json",
    "shareholder_count_subject_1000183.json",
    "holder_ratio_subject_1000989.json",
    "dividend_subject_1000978.json",
    "annual_balance_sheet_subject_1000964.json",
    "annual_income_statement_subject_1000965.json",
    "annual_cashflow_subject_1000966.json",
    "quarterly_income_statement_subject_1000970.json",
    "quarterly_cashflow_subject_1000971.json",
    "business_mix_subject_1000961.json",
    "rating_up_subject_1001348.json",
    "rating_cont_up_subject_1001352.json",
    "rating_down_subject_1001351.json",
    "rating_cont_down_subject_1001353.json",
]


@dataclass
class QuerySpec:
    name: str
    args: list[str]
    allow_empty: bool = False


def run_cmd(args: list[str]) -> subprocess.CompletedProcess[str]:
    return subprocess.run(args, capture_output=True, text=True, cwd=ROOT)


def ensure_ok(result: subprocess.CompletedProcess[str], message: str) -> None:
    if result.returncode != 0:
        detail = result.stderr.strip() or result.stdout.strip() or "未知错误"
        raise RuntimeError(f"{message}: {detail}")


def is_a_share_iid(iid: str) -> bool:
    normalized = iid.upper()
    match = re.match(r"^(\d{6})\.(SH|SZ)$", normalized)
    if not match:
        return False
    code, market = match.groups()
    if market == "SH":
        return not code.startswith("900")
    if market == "SZ":
        return not code.startswith("200")
    return False


def matches_name(row: dict, search_term: str) -> bool:
    normalized = search_term.strip()
    if not normalized:
        return False
    display_values = row.get("DISPLAY_VALUES") or []
    candidates = [
        row.get("INAME"),
        row.get("TRADE_SHT_NAME"),
        display_values[1] if len(display_values) > 1 else None,
    ]
    return any(str(candidate or "").strip() == normalized for candidate in candidates)


def format_candidates(rows: list[dict]) -> str:
    lines = []
    for row in rows:
        iid = str(row.get("IID") or "").upper() or "未知代码"
        name = str(row.get("INAME") or (row.get("DISPLAY_VALUES") or ["", ""])[1] or "未知名称")
        lines.append(f"- {iid} {name}")
    return "\n".join(lines)


def resolve_stock(input_value: str) -> tuple[str, str, dict]:
    normalized_input = input_value.strip()
    code_pattern = re.compile(r"^\d{6}\.(SH|SZ)$", re.IGNORECASE)
    direct_code = normalized_input.upper() if code_pattern.match(normalized_input) else None
    search_term = direct_code or normalized_input
    result = run_cmd(["ds", "iid", "Stk", "search", search_term, "--output", "json"])
    ensure_ok(result, "标的识别失败")
    payload = json.loads(result.stdout or "{}", strict=False)
    rows = payload.get("data") or []
    if not rows:
        raise RuntimeError(f"未识别到标的: {input_value}")

    exact_iid_rows = []
    if direct_code:
        exact_iid_rows = [row for row in rows if str(row.get("IID") or "").upper() == direct_code]
        if len(exact_iid_rows) == 1:
            row = exact_iid_rows[0]
            code = str(row.get("IID") or direct_code).upper()
            name = str(row.get("INAME") or (row.get("DISPLAY_VALUES") or ["", ""])[1] or input_value)
            return code, name, payload

    exact_name_rows = [row for row in rows if matches_name(row, normalized_input) and is_a_share_iid(str(row.get("IID") or ""))]
    if len(exact_name_rows) == 1:
        row = exact_name_rows[0]
        code = str(row.get("IID") or (row.get("DISPLAY_VALUES") or [""])[0]).upper()
        name = str(row.get("INAME") or (row.get("DISPLAY_VALUES") or ["", ""])[1] or input_value)
        return code, name, payload

    a_share_rows = [row for row in rows if is_a_share_iid(str(row.get("IID") or ""))]
    candidate_rows = exact_iid_rows or exact_name_rows or a_share_rows or rows
    raise RuntimeError(
        "未能唯一确认标的，请提供准确的 A 股证券代码（如 000728.SZ）。候选如下：\n"
        + format_candidates(candidate_rows[:10])
    )


def is_empty_payload_error(stderr: str) -> bool:
    return "缺少数据集" in stderr or "暂无数据" in stderr


def empty_detail(name: str) -> str:
    if name == "controller_subject_1000998.json":
        return "该标的暂无实控人数据"
    if name == "lockup_subject_1001006.json":
        return "该标的当前暂无解禁数据"
    if name == "dividend_subject_1000978.json":
        return "该标的历史暂无分红数据"
    if name.startswith("rating_"):
        return "该标的暂无一致评级数据"
    return "该标的暂无此类数据"


def empty_payload(detail: str) -> str:
    return json.dumps(
        {
            "success": True,
            "data": [],
            "empty_reason": detail,
        },
        ensure_ascii=False,
        indent=2,
    ) + "\n"

def build_queries(stock_code: str) -> list[QuerySpec]:
    today = date.today().isoformat()
    return [
        QuerySpec("basic_info_subject_1000933.json", ["ds", "subject", "1000933", "--where", f"TRADE_NO == '{stock_code}'", "--output", "json"]),
        QuerySpec("controller_subject_1000998.json", ["ds", "subject", "1000998", "--where", f"TRADE_NO == '{stock_code}'", "--output", "json"], allow_empty=True),
        QuerySpec("executive_comp_subject_1001034.json", ["ds", "subject", "1001034", "--where", f"TRADE_NO == '{stock_code}'", "--sort", "-END_DT", "--output", "json"]),
        QuerySpec("share_capital_subject_1000987.json", ["ds", "subject", "1000987", "--where", f"TRADE_NO == '{stock_code}'", "--sort", "-END_DT", "--output", "json"]),
        QuerySpec("lockup_subject_1001006.json", ["ds", "subject", "1001006", "--where", f"TRADE_NO == '{stock_code}'", "--where", f"LIST_DT >= '[{today}]'", "--sort", "LIST_DT", "--page", "1", "--size", "1", "--output", "json"], allow_empty=True),
        QuerySpec("top10_holders_subject_1000991.json", ["ds", "subject", "1000991", "--where", f"TRADE_NO == '{stock_code}'", "--sort", "-END_DT", "--output", "json"]),
        QuerySpec("top10_float_holders_subject_1000996.json", ["ds", "subject", "1000996", "--where", f"TRADE_NO == '{stock_code}'", "--sort", "-END_DT", "--output", "json"]),
        QuerySpec("shareholder_count_subject_1000183.json", ["ds", "subject", "1000183", "--where", f"TRADE_NO == '{stock_code}'", "--sort", "-END_DT", "--output", "json"]),
        QuerySpec("holder_ratio_subject_1000989.json", ["ds", "subject", "1000989", "--where", f"TRADE_NO == '{stock_code}'", "--sort", "-END_DT", "--output", "json"]),
        QuerySpec("dividend_subject_1000978.json", ["ds", "subject", "1000978", "--where", f"TRADE_NO == '{stock_code}'", "--sort", "-END_DT", "--output", "json"], allow_empty=True),
        QuerySpec("annual_balance_sheet_subject_1000964.json", ["ds", "subject", "1000964", "--where", f"TRADE_NO == '{stock_code}'", "--where", "RPT_TYPE_DESC == '年度报表'", "--sort", "-END_DT", "--page", "1", "--size", "5", "--output", "json"]),
        QuerySpec("annual_income_statement_subject_1000965.json", ["ds", "subject", "1000965", "--where", f"TRADE_NO == '{stock_code}'", "--where", "RPT_TYPE_DESC == '年度报表'", "--sort", "-END_DT", "--page", "1", "--size", "5", "--output", "json"]),
        QuerySpec("annual_cashflow_subject_1000966.json", ["ds", "subject", "1000966", "--where", f"TRADE_NO == '{stock_code}'", "--where", "RPT_TYPE_DESC == '年度报表'", "--sort", "-END_DT", "--page", "1", "--size", "5", "--output", "json"]),
        QuerySpec("quarterly_income_statement_subject_1000970.json", ["ds", "subject", "1000970", "--where", f"TRADE_NO == '{stock_code}'", "--sort", "-END_DT", "--page", "1", "--size", "5", "--output", "json"]),
        QuerySpec("quarterly_cashflow_subject_1000971.json", ["ds", "subject", "1000971", "--where", f"TRADE_NO == '{stock_code}'", "--sort", "-END_DT", "--page", "1", "--size", "5", "--output", "json"]),
        QuerySpec("business_mix_subject_1000961.json", ["ds", "subject", "1000961", "--where", f"TRADE_NO == '{stock_code}'", "--sort", "-END_DT", "--page", "1", "--size", "20", "--output", "json"]),
        QuerySpec("rating_up_subject_1001348.json", ["ds", "subject", "1001348", "--where", f"SECU_ID == '{stock_code}'", "--output", "json"], allow_empty=True),
        QuerySpec("rating_cont_up_subject_1001352.json", ["ds", "subject", "1001352", "--where", f"SECU_ID == '{stock_code}'", "--output", "json"], allow_empty=True),
        QuerySpec("rating_down_subject_1001351.json", ["ds", "subject", "1001351", "--where", f"SECU_ID == '{stock_code}'", "--output", "json"], allow_empty=True),
        QuerySpec("rating_cont_down_subject_1001353.json", ["ds", "subject", "1001353", "--where", f"SECU_ID == '{stock_code}'", "--output", "json"], allow_empty=True),
    ]


def write_query_output(raw_dir: Path, spec: QuerySpec) -> dict:
    result = run_cmd(spec.args)
    target = raw_dir / spec.name
    status = {"file": spec.name, "command": " ".join(spec.args), "status": "ok"}
    if result.returncode == 0:
        target.write_text(result.stdout, encoding="utf-8")
        if spec.allow_empty:
            try:
                payload = json.loads(result.stdout or "{}", strict=False)
            except json.JSONDecodeError:
                payload = {}
            if not (payload.get("data") or []):
                status["status"] = "empty"
                status["detail"] = empty_detail(spec.name)
        return status

    stderr = (result.stderr or "").strip()
    if spec.allow_empty and is_empty_payload_error(stderr):
        detail = empty_detail(spec.name)
        target.write_text(empty_payload(detail), encoding="utf-8")
        status["status"] = "empty"
        status["detail"] = detail
        return status

    raise RuntimeError(f"{spec.name} 查询失败: {stderr or result.stdout.strip() or '未知错误'}")


def main() -> int:
    if len(sys.argv) < 2:
        raise SystemExit("用法: python3 .agents/skills/stock-report/scripts/fetch_and_generate_stock_report.py <股票名称或代码>")

    stock_input = sys.argv[1]
    status_result = run_cmd(["ds", "status"])
    ensure_ok(status_result, "ds 环境检查失败，请先确认已安装且已登录")

    stock_code, stock_name, iid_payload = resolve_stock(stock_input)
    stock_dir = ROOT / "data" / stock_code
    raw_dir = stock_dir / "raw"
    report_dir = stock_dir / "report"
    raw_dir.mkdir(parents=True, exist_ok=True)
    report_dir.mkdir(parents=True, exist_ok=True)

    for filename in RAW_DIR_NAMES:
        path = raw_dir / filename
        if path.exists():
            path.unlink()

    (raw_dir / "iid_search.json").write_text(json.dumps(iid_payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    query_results = [write_query_output(raw_dir, spec) for spec in build_queries(stock_code)]

    generator = run_cmd([sys.executable, str(SCRIPT_DIR / "generate_ds_report.py"), stock_code])
    ensure_ok(generator, "报告生成失败")

    summary = {
        "input": stock_input,
        "stock_code": stock_code,
        "stock_name": stock_name,
        "generated_at": date.today().isoformat(),
        "queries": query_results,
        "report_html": str(report_dir / "report.html"),
    }
    (stock_dir / "run_summary.json").write_text(json.dumps(summary, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    print(json.dumps(summary, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
