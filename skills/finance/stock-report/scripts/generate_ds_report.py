#!/usr/bin/env python3
from __future__ import annotations

import json
import re
import sys
from datetime import date
from html import escape
from pathlib import Path


def resolve_repo_root() -> Path:
    current = Path(__file__).resolve()
    for candidate in current.parents:
        if (candidate / ".git").exists() and (candidate / "data").exists():
            return candidate
    raise RuntimeError("未识别到仓库根目录")


ROOT = resolve_repo_root()
GENERIC_UNAVAILABLE_TEXT = "数据暂不可得"
CONTROLLER_EMPTY_TEXT = "该标的暂无实控人数据"
LOCKUP_EMPTY_TEXT = "该标的当前暂无解禁数据"
DIVIDEND_EMPTY_TEXT = "该标的历史暂无分红数据"
RATING_EMPTY_TEXT = "该标的暂无一致评级数据"


def read_json(path: Path) -> dict:
    if not path.exists() or path.stat().st_size == 0:
        return {"success": False, "data": []}
    return json.loads(path.read_text(encoding="utf-8"), strict=False)


def write_json(path: Path, data: object) -> None:
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def format_date(value: str | None) -> str:
    if not value:
        return GENERIC_UNAVAILABLE_TEXT
    return value.split(" ")[0]


def format_num(value: float | int | None, digits: int = 2) -> str:
    if value is None:
        return GENERIC_UNAVAILABLE_TEXT
    return f"{value:,.{digits}f}"


def format_pct(value: float | int | None, digits: int = 2) -> str:
    if value is None:
        return GENERIC_UNAVAILABLE_TEXT
    return f"{value:.{digits}f}%"


def format_wan(value: float | int | None) -> str:
    if value is None:
        return GENERIC_UNAVAILABLE_TEXT
    return f"{value / 10000:,.2f} 万元"


def format_yi(value: float | int | None) -> str:
    if value is None:
        return GENERIC_UNAVAILABLE_TEXT
    return f"{value / 100000000:,.2f} 亿元"


def choose_amount_unit(values: list[float | int | None]) -> tuple[str, float]:
    numeric_values = [abs(float(value)) for value in values if value not in (None,)]
    if not numeric_values:
        return "亿元", 100000000
    max_value = max(numeric_values)
    if max_value >= 100000000:
        return "亿元", 100000000
    if max_value >= 10000:
        return "万元", 10000
    return "元", 1


def format_amount(value: float | int | None, unit: str, divisor: float) -> str:
    if value is None:
        return GENERIC_UNAVAILABLE_TEXT
    scaled = float(value) / divisor
    digits = 2 if divisor != 1 else 0
    return f"{scaled:,.{digits}f} {unit}"


def scaled_amount(value: float | int | None, divisor: float) -> float | None:
    if value is None:
        return None
    return round(float(value) / divisor, 2 if divisor != 1 else 0)


def format_shares_yi(value: float | int | None) -> str:
    if value is None:
        return GENERIC_UNAVAILABLE_TEXT
    return f"{float(value) / 100000000:,.2f} 亿股"


def format_shares_wan(value: float | int | None) -> str:
    if value is None:
        return GENERIC_UNAVAILABLE_TEXT
    return f"{float(value) / 10000:,.2f}"


def safe_div(a: float | int | None, b: float | int | None) -> float | None:
    if a is None or b in (None, 0):
        return None
    return float(a) / float(b)


def latest_by(rows: list[dict], key: str) -> dict | None:
    if not rows:
        return None
    return max(rows, key=lambda row: row.get(key) or "")


def sorted_rows(rows: list[dict], key: str, reverse: bool = False) -> list[dict]:
    return sorted(rows, key=lambda row: row.get(key) or "", reverse=reverse)


def annual_label(row: dict) -> str:
    return f"{row['YEAR']}年报"


def quarter_label(row: dict) -> str:
    mapping = {
        "第一季度报表": "一季报",
        "第二季度报表": "中报",
        "第三季度报表": "三季报",
        "第四季度报表": "四季报",
    }
    return f"{row['YEAR']}{mapping.get(row.get('RPT_TYPE_DESC'), row.get('RPT_TYPE_DESC', ''))}"


def extract_cash_per_10(text: str | None, cash_amt: float | int | None) -> float | None:
    if cash_amt is not None:
        return round(float(cash_amt) * 10, 2)
    if not text:
        return None
    match = re.search(r"每10股派([0-9.]+)元", text)
    if not match:
        return None
    return round(float(match.group(1)), 2)


def render_info_item(label: str, value: str) -> str:
    return (
        '<div class="info-item">'
        f'<span class="info-label">{escape(label)}</span>'
        f'<span class="info-value">{escape(value)}</span>'
        "</div>"
    )


def render_empty_state(message: str) -> str:
    return f'<div class="empty-state">{escape(message)}</div>'


def render_section_title(title: str, meta: str | None = None) -> str:
    meta_html = f'<span class="section-meta">{escape(meta)}</span>' if meta else ""
    return (
        '<div class="section-heading">'
        f'<h3 class="section-subtitle">{escape(title)}</h3>'
        f"{meta_html}"
        "</div>"
    )


def payload_rows(payload: dict) -> list[dict]:
    return payload.get("data") or []


def payload_empty_reason(payload: dict, default: str) -> str:
    return str(payload.get("empty_reason") or default)


def render_table(headers: list[str], rows: list[list[str]], css_class: str = "data-table") -> str:
    head_html = "".join(f"<th>{escape(header)}</th>" for header in headers)
    body_html = "".join(
        "<tr>" + "".join(f"<td>{cell}</td>" for cell in row) + "</tr>"
        for row in rows
    )
    return (
        '<div class="data-table-container">'
        f'<table class="{css_class}"><thead><tr>{head_html}</tr></thead><tbody>{body_html}</tbody></table>'
        "</div>"
    )


def render_metric_cards(items: list[tuple[str, str]], classes: list[str] | None = None) -> str:
    cards = []
    for idx, (label, value) in enumerate(items):
        extra = f" {classes[idx]}" if classes and idx < len(classes) and classes[idx] else ""
        cards.append(
            f'<div class="ticker-item{extra}"><div class="ticker-label">{escape(label)}</div>'
            f'<div class="ticker-value">{escape(value)}</div></div>'
        )
    return '<div class="quote-ticker">' + "".join(cards) + "</div>"


def build_financial_table_rows(rows: list[dict], kind: str, unit: str, divisor: float) -> list[list[str]]:
    built: list[list[str]] = []
    for row in rows:
        label = annual_label(row) if "年度" in row.get("RPT_TYPE_DESC", "") else quarter_label(row)
        if kind == "income":
            built.append(
                [
                    escape(label),
                    escape(format_amount(row.get("OP_TINC"), unit, divisor)),
                    escape(format_amount(row.get("NET_PROF"), unit, divisor)),
                    escape(format_pct(row.get("OP_TINC_YOY"))),
                    escape(format_pct(row.get("NET_PROF_YOY"))),
                ]
            )
        else:
            built.append(
                [
                    escape(label),
                    escape(format_amount(row.get("OP_CF_NET_AMT"), unit, divisor)),
                    escape(format_amount(row.get("INSM_CF_NAMT"), unit, divisor)),
                    escape(format_amount(row.get("FIN_CF_NAMT"), unit, divisor)),
                    escape(format_amount(row.get("CASH_EQU_NI_AMT"), unit, divisor)),
                ]
            )
    return built


def main() -> int:
    stock_code = sys.argv[1] if len(sys.argv) > 1 else "000728.SZ"
    stock_dir = ROOT / "data" / stock_code
    raw_dir = stock_dir / "raw"
    report_dir = stock_dir / "report"
    report_dir.mkdir(parents=True, exist_ok=True)

    basic_raw = read_json(raw_dir / "basic_info_subject_1000933.json")
    controller_raw = read_json(raw_dir / "controller_subject_1000998.json")
    exec_raw = read_json(raw_dir / "executive_comp_subject_1001034.json")
    capital_raw = read_json(raw_dir / "share_capital_subject_1000987.json")
    lockup_raw = read_json(raw_dir / "lockup_subject_1001006.json")
    top10_raw = read_json(raw_dir / "top10_holders_subject_1000991.json")
    top10_float_raw = read_json(raw_dir / "top10_float_holders_subject_1000996.json")
    shareholder_count_raw = read_json(raw_dir / "shareholder_count_subject_1000183.json")
    holder_ratio_raw = read_json(raw_dir / "holder_ratio_subject_1000989.json")
    dividend_raw = read_json(raw_dir / "dividend_subject_1000978.json")
    annual_bs_raw = read_json(raw_dir / "annual_balance_sheet_subject_1000964.json")
    annual_is_raw = read_json(raw_dir / "annual_income_statement_subject_1000965.json")
    annual_cf_raw = read_json(raw_dir / "annual_cashflow_subject_1000966.json")
    quarterly_is_raw = read_json(raw_dir / "quarterly_income_statement_subject_1000970.json")
    quarterly_cf_raw = read_json(raw_dir / "quarterly_cashflow_subject_1000971.json")
    business_raw = read_json(raw_dir / "business_mix_subject_1000961.json")
    rating_up_raw = read_json(raw_dir / "rating_up_subject_1001348.json")
    rating_cont_up_raw = read_json(raw_dir / "rating_cont_up_subject_1001352.json")
    rating_down_raw = read_json(raw_dir / "rating_down_subject_1001351.json")
    rating_cont_down_raw = read_json(raw_dir / "rating_cont_down_subject_1001353.json")

    basic = (payload_rows(basic_raw) or [{}])[0]
    controller_rows = payload_rows(controller_raw)
    controller = controller_rows[0] if controller_rows else {}
    capital = (payload_rows(capital_raw) or [{}])[0]
    shareholder_monitor_latest = latest_by(payload_rows(shareholder_count_raw), "END_DT") or {}
    holder_ratio_latest = (payload_rows(holder_ratio_raw) or [{}])[0]

    annual_bs = sorted_rows(payload_rows(annual_bs_raw), "YEAR", reverse=True)
    annual_is = sorted_rows(payload_rows(annual_is_raw), "YEAR", reverse=True)
    annual_cf = sorted_rows(payload_rows(annual_cf_raw), "YEAR", reverse=True)
    quarterly_is = sorted_rows(payload_rows(quarterly_is_raw), "END_DT", reverse=True)[:5]
    quarterly_cf = sorted_rows(payload_rows(quarterly_cf_raw), "END_DT", reverse=True)[:5]

    top10_dt = (latest_by(payload_rows(top10_raw), "END_DT") or {}).get("END_DT")
    top10_latest = [row for row in payload_rows(top10_raw) if row.get("END_DT") == top10_dt]
    top10_latest = sorted(top10_latest, key=lambda row: row.get("SH_SEQ", 999))
    top10_float_dt = (latest_by(payload_rows(top10_float_raw), "END_DT") or {}).get("END_DT")
    top10_float_latest = [row for row in payload_rows(top10_float_raw) if row.get("END_DT") == top10_float_dt]
    top10_float_latest = sorted(top10_float_latest, key=lambda row: row.get("SH_SEQ", 999))

    latest_exec_year = max((row.get("YEAR") for row in payload_rows(exec_raw) if row.get("YEAR")), default=None)
    exec_all_rows = [
        row for row in payload_rows(exec_raw)
        if row.get("YEAR") == latest_exec_year and row.get("CORP_RWRD_GAMT") not in (None, 0)
    ]
    exec_total_reward = sum((row.get("CORP_RWRD_GAMT") or 0) for row in exec_all_rows)
    exec_rows = sorted(exec_all_rows, key=lambda row: row.get("CORP_RWRD_GAMT", 0), reverse=True)[:8]

    business_latest_year = max(
        (row.get("YEAR") for row in payload_rows(business_raw) if row.get("YEAR") and row.get("RPT_TYPE_DESC") == "年度报表"),
        default=None,
    )
    business_rows = [
        row for row in payload_rows(business_raw)
        if row.get("YEAR") == business_latest_year and row.get("RPT_TYPE_DESC") == "年度报表"
    ]
    business_rows = sorted(business_rows, key=lambda row: row.get("OP_INC", 0), reverse=True)

    rating_sections = [
        ("一致评级大幅调高", payload_rows(rating_up_raw)),
        ("一致评级不断调高", payload_rows(rating_cont_up_raw)),
        ("一致评级大幅降低", payload_rows(rating_down_raw)),
        ("一致评级不断调低", payload_rows(rating_cont_down_raw)),
    ]
    rating_has_data = any(rows for _, rows in rating_sections)

    total_shares = capital.get("TTL_SHR")
    latest_price = shareholder_monitor_latest.get("CPRC")
    latest_market_cap = shareholder_monitor_latest.get("ZSZ")
    latest_shareholders = shareholder_monitor_latest.get("SH_NUM")
    latest_quote_date = format_date(shareholder_monitor_latest.get("END_DT"))
    top10_notice_date = format_date(top10_dt) if top10_dt else None
    top10_float_notice_date = format_date(top10_float_dt) if top10_float_dt else None
    balance_unit, balance_divisor = choose_amount_unit(
        [row.get("TTL_AST") for row in annual_bs]
        + [row.get("TTL_LIAB") for row in annual_bs]
        + [row.get("SH_EQY_TTL") for row in annual_bs]
    )
    income_annual_unit, income_annual_divisor = choose_amount_unit(
        [row.get("OP_TINC") for row in annual_is] + [row.get("NET_PROF") for row in annual_is]
    )
    income_quarter_unit, income_quarter_divisor = choose_amount_unit(
        [row.get("OP_TINC") for row in quarterly_is] + [row.get("NET_PROF") for row in quarterly_is]
    )
    cash_annual_unit, cash_annual_divisor = choose_amount_unit(
        [row.get("OP_CF_NET_AMT") for row in annual_cf]
        + [row.get("INSM_CF_NAMT") for row in annual_cf]
        + [row.get("FIN_CF_NAMT") for row in annual_cf]
        + [row.get("CASH_EQU_NI_AMT") for row in annual_cf]
    )
    cash_quarter_unit, cash_quarter_divisor = choose_amount_unit(
        [row.get("OP_CF_NET_AMT") for row in quarterly_cf]
        + [row.get("INSM_CF_NAMT") for row in quarterly_cf]
        + [row.get("FIN_CF_NAMT") for row in quarterly_cf]
        + [row.get("CASH_EQU_NI_AMT") for row in quarterly_cf]
    )
    business_income_unit, business_income_divisor = choose_amount_unit(
        [row.get("OP_INC") for row in business_rows] + [row.get("OP_PROF") for row in business_rows]
    )

    leverage_series = []
    bvps_series = []
    asset_series = []
    liability_series = []
    equity_series = []
    for row in annual_bs:
        label = annual_label(row)
        leverage = safe_div(row.get("TTL_LIAB"), row.get("TTL_AST"))
        leverage_series.append({"label": label, "value": round(leverage * 100, 2) if leverage is not None else None})
        bvps = safe_div(row.get("SH_EQY_TTL"), total_shares)
        bvps_series.append({"label": label, "value": round(bvps, 2) if bvps is not None else None})
        asset_series.append({"label": label, "value": scaled_amount(row.get("TTL_AST"), balance_divisor)})
        liability_series.append({"label": label, "value": scaled_amount(row.get("TTL_LIAB"), balance_divisor)})
        equity_series.append({"label": label, "value": scaled_amount(row.get("SH_EQY_TTL"), balance_divisor)})

    revenue_series = [{"label": annual_label(row), "value": scaled_amount(row.get("OP_TINC"), income_annual_divisor)} for row in annual_is]
    profit_series = [{"label": annual_label(row), "value": scaled_amount(row.get("NET_PROF"), income_annual_divisor)} for row in annual_is]
    annual_op_cf_series = [{"label": annual_label(row), "value": scaled_amount(row.get("OP_CF_NET_AMT"), cash_annual_divisor)} for row in annual_cf]
    annual_insm_cf_series = [{"label": annual_label(row), "value": scaled_amount(row.get("INSM_CF_NAMT"), cash_annual_divisor)} for row in annual_cf]
    annual_fin_cf_series = [{"label": annual_label(row), "value": scaled_amount(row.get("FIN_CF_NAMT"), cash_annual_divisor)} for row in annual_cf]
    quarter_revenue_series = [{"label": quarter_label(row), "value": scaled_amount(row.get("OP_TINC"), income_quarter_divisor)} for row in quarterly_is]
    quarter_profit_series = [{"label": quarter_label(row), "value": scaled_amount(row.get("NET_PROF"), income_quarter_divisor)} for row in quarterly_is]
    quarter_op_cf_series = [{"label": quarter_label(row), "value": scaled_amount(row.get("OP_CF_NET_AMT"), cash_quarter_divisor)} for row in quarterly_cf]
    quarter_insm_cf_series = [{"label": quarter_label(row), "value": scaled_amount(row.get("INSM_CF_NAMT"), cash_quarter_divisor)} for row in quarterly_cf]
    quarter_fin_cf_series = [{"label": quarter_label(row), "value": scaled_amount(row.get("FIN_CF_NAMT"), cash_quarter_divisor)} for row in quarterly_cf]
    eps_series = [{"label": annual_label(row), "value": round(safe_div(row.get("NET_PROF"), total_shares) or 0, 2)} for row in annual_is]

    latest_eps = eps_series[0]["value"] if eps_series else None
    latest_bvps = bvps_series[0]["value"] if bvps_series else None
    pe = safe_div(latest_price, latest_eps)
    pb = safe_div(latest_price, latest_bvps)

    dividends = sorted_rows(payload_rows(dividend_raw), "CASH_ALLOC_DT", reverse=True)
    dividend_series = [
        {
            "label": f"{row.get('YEAR', '')}{row.get('BGQLX', '')}",
            "value": extract_cash_per_10(row.get("FHFASM"), row.get("BTAX_CASH_AMT")),
        }
        for row in dividends
    ]
    dividend_series = [row for row in dividend_series if row["value"] is not None]

    latest_annual_is = annual_is[0] if annual_is else {}
    latest_annual_cf = annual_cf[0] if annual_cf else {}

    controller_message = payload_empty_reason(controller_raw, CONTROLLER_EMPTY_TEXT)
    lockup_message = payload_empty_reason(lockup_raw, LOCKUP_EMPTY_TEXT)
    dividend_message = payload_empty_reason(dividend_raw, DIVIDEND_EMPTY_TEXT)
    rating_message = RATING_EMPTY_TEXT

    basic_info = {
        "证券代码": basic.get("TRADE_NO", stock_code),
        "证券简称": basic.get("TRADE_SHT_NAME") or basic.get("SHORT_CNAME") or "未知",
        "公司名称": basic.get("SHORT_CNAME", GENERIC_UNAVAILABLE_TEXT),
        "法人代表": basic.get("LEGAL_MAN", GENERIC_UNAVAILABLE_TEXT),
        "证监会行业": basic.get("INDU_NAME_110", GENERIC_UNAVAILABLE_TEXT),
        "申万行业": basic.get("INDU_NAME_151", GENERIC_UNAVAILABLE_TEXT),
        "注册资本": format_wan(basic.get("REGIST_CPTL")),
        "注册地址": basic.get("REGIST_ADDR", GENERIC_UNAVAILABLE_TEXT),
        "上市日期": format_date(basic.get("LIST_DT")),
        "成立日期": format_date(basic.get("FOUND_DT")),
        "公司网址": basic.get("COMPANY_SITE", GENERIC_UNAVAILABLE_TEXT),
        "实控人": controller.get("ACT_CON_NAME") or controller_message,
        "实控人类型": controller.get("ACT_CON_TYPE") or controller_message,
        "实控开始日": format_date(controller.get("BGN_DT")) if controller.get("BGN_DT") else controller_message,
        "实控人说明": controller_message,
    }

    financial_data = {
        "资产负债表_年度": [
            {
                "报告期": annual_label(row),
                "金额单位": balance_unit,
                "总资产": scaled_amount(row.get("TTL_AST"), balance_divisor),
                "总负债": scaled_amount(row.get("TTL_LIAB"), balance_divisor),
                "股东权益": scaled_amount(row.get("SH_EQY_TTL"), balance_divisor),
                "资产负债率": round(safe_div(row.get("TTL_LIAB"), row.get("TTL_AST")) * 100, 2) if safe_div(row.get("TTL_LIAB"), row.get("TTL_AST")) is not None else None,
            }
            for row in annual_bs
        ],
        "利润表_年度": [
            {
                "报告期": annual_label(row),
                "金额单位": income_annual_unit,
                "营业收入": scaled_amount(row.get("OP_TINC"), income_annual_divisor),
                "净利润": scaled_amount(row.get("NET_PROF"), income_annual_divisor),
                "营收同比": round(row.get("OP_TINC_YOY"), 2) if row.get("OP_TINC_YOY") is not None else None,
                "净利同比": round(row.get("NET_PROF_YOY"), 2) if row.get("NET_PROF_YOY") is not None else None,
            }
            for row in annual_is
        ],
        "利润表_季度": [
            {
                "报告期": quarter_label(row),
                "金额单位": income_quarter_unit,
                "营业收入": scaled_amount(row.get("OP_TINC"), income_quarter_divisor),
                "净利润": scaled_amount(row.get("NET_PROF"), income_quarter_divisor),
                "营收同比": round(row.get("OP_TINC_YOY"), 2) if row.get("OP_TINC_YOY") is not None else None,
                "净利同比": round(row.get("NET_PROF_YOY"), 2) if row.get("NET_PROF_YOY") is not None else None,
            }
            for row in quarterly_is
        ],
        "现金流量表_年度": [
            {
                "报告期": annual_label(row),
                "金额单位": cash_annual_unit,
                "经营现金流净额": scaled_amount(row.get("OP_CF_NET_AMT"), cash_annual_divisor),
                "投资现金流净额": scaled_amount(row.get("INSM_CF_NAMT"), cash_annual_divisor),
                "筹资现金流净额": scaled_amount(row.get("FIN_CF_NAMT"), cash_annual_divisor),
                "现金净增加额": scaled_amount(row.get("CASH_EQU_NI_AMT"), cash_annual_divisor),
            }
            for row in annual_cf
        ],
        "现金流量表_季度": [
            {
                "报告期": quarter_label(row),
                "金额单位": cash_quarter_unit,
                "经营现金流净额": scaled_amount(row.get("OP_CF_NET_AMT"), cash_quarter_divisor),
                "投资现金流净额": scaled_amount(row.get("INSM_CF_NAMT"), cash_quarter_divisor),
                "筹资现金流净额": scaled_amount(row.get("FIN_CF_NAMT"), cash_quarter_divisor),
                "现金净增加额": scaled_amount(row.get("CASH_EQU_NI_AMT"), cash_quarter_divisor),
            }
            for row in quarterly_cf
        ],
    }

    shareholders = {
        "股本数据": {
            "总股本": capital.get("TTL_SHR"),
            "流通股合计": capital.get("LIST_NEGO_SHR_TTL"),
            "流通A股": capital.get("NEGO_A_SHR"),
            "流通股合计比例": capital.get("RATI_4"),
            "公告日期": format_date(capital.get("NTC_DT")),
        },
        "解禁数据": {
            "has_data": bool(payload_rows(lockup_raw)),
            "empty_reason": lockup_message,
            "rows": payload_rows(lockup_raw),
        },
        "股东户数最新监测": {
            "日期": latest_quote_date,
            "股东户数": latest_shareholders,
            "户均持股": shareholder_monitor_latest.get("AVG_HLD_SHR"),
            "参考股价": latest_price,
            "参考总市值_亿元": round((latest_market_cap or 0) / 100000000, 2) if latest_market_cap is not None else None,
        },
        "大股东持股比例最新值": {
            "报告期": holder_ratio_latest.get("END_DT_CHAR", GENERIC_UNAVAILABLE_TEXT),
            "合计持股比例": holder_ratio_latest.get("TTL_SHR_RATI_SUM"),
            "较上期变化": holder_ratio_latest.get("CHA_RATI"),
        },
        "前十大股东": [
            {
                "股东": row.get("SH_NAME"),
                "持股数量": row.get("HLD_SHR_VOL"),
                "持股比例": row.get("TTL_SHR_RATI"),
            }
            for row in top10_latest
        ],
        "前十大流通股东": [
            {
                "股东": row.get("SH_NAME"),
                "持股数量": row.get("HLD_SHR_VOL"),
                "持股比例": row.get("TTL_SHR_RATI"),
            }
            for row in top10_float_latest
        ],
        "分红数据": {
            "has_data": bool(dividend_series),
            "empty_reason": dividend_message,
            "rows": [
                {
                    "年度": row.get("YEAR"),
                    "报告类型": row.get("BGQLX"),
                    "每10股派现_元": extract_cash_per_10(row.get("FHFASM"), row.get("BTAX_CASH_AMT")),
                    "方案说明": row.get("FHFASM"),
                    "实施日": format_date(row.get("EX_RT_DT")),
                }
                for row in dividends
                if extract_cash_per_10(row.get("FHFASM"), row.get("BTAX_CASH_AMT")) is not None
            ],
        },
        "实控人数据": {
            "has_data": bool(controller_rows),
            "empty_reason": controller_message,
            "rows": controller_rows,
        },
        "一致评级": {
            "has_data": rating_has_data,
            "empty_reason": rating_message,
            "sections": [
                {
                    "标题": title,
                    "rows": rows,
                }
                for title, rows in rating_sections
                if rows
            ],
        },
    }

    write_json(stock_dir / "basic_info.json", basic_info)
    write_json(stock_dir / "financial_data.json", financial_data)
    write_json(stock_dir / "shareholders.json", shareholders)

    used_queries = [
        f"""ds subject 1000933 --where "TRADE_NO == '{stock_code}'" --output json""",
        f"""ds subject 1001034 --where "TRADE_NO == '{stock_code}'" --sort "-END_DT" --output json""",
        f"""ds subject 1000987 --where "TRADE_NO == '{stock_code}'" --sort "-END_DT" --output json""",
        f"""ds subject 1000991 --where "TRADE_NO == '{stock_code}'" --sort "-END_DT" --output json""",
        f"""ds subject 1000996 --where "TRADE_NO == '{stock_code}'" --sort "-END_DT" --output json""",
        f"""ds subject 1000183 --where "TRADE_NO == '{stock_code}'" --sort "-END_DT" --output json""",
        f"""ds subject 1000989 --where "TRADE_NO == '{stock_code}'" --sort "-END_DT" --output json""",
        f"""ds subject 1000964 --where "TRADE_NO == '{stock_code}'" --where "RPT_TYPE_DESC == '年度报表'" --sort "-END_DT" --page 1 --size 5 --output json""",
        f"""ds subject 1000965 --where "TRADE_NO == '{stock_code}'" --where "RPT_TYPE_DESC == '年度报表'" --sort "-END_DT" --page 1 --size 5 --output json""",
        f"""ds subject 1000966 --where "TRADE_NO == '{stock_code}'" --where "RPT_TYPE_DESC == '年度报表'" --sort "-END_DT" --page 1 --size 5 --output json""",
        f"""ds subject 1000970 --where "TRADE_NO == '{stock_code}'" --sort "-END_DT" --page 1 --size 5 --output json""",
        f"""ds subject 1000971 --where "TRADE_NO == '{stock_code}'" --sort "-END_DT" --page 1 --size 5 --output json""",
        f"""ds subject 1000961 --where "TRADE_NO == '{stock_code}'" --sort "-END_DT" --page 1 --size 20 --output json""",
    ]
    optional_queries = [
        (
            bool(controller_rows),
            f"""ds subject 1000998 --where "TRADE_NO == '{stock_code}'" --output json""",
        ),
        (
            bool(payload_rows(lockup_raw)),
            f"""ds subject 1001006 --where "TRADE_NO == '{stock_code}'" --where "LIST_DT >= '[{date.today().isoformat()}]'" --sort "LIST_DT" --page 1 --size 1 --output json""",
        ),
        (
            bool(dividend_series),
            f"""ds subject 1000978 --where "TRADE_NO == '{stock_code}'" --sort "-END_DT" --output json""",
        ),
        (
            bool(payload_rows(rating_up_raw)),
            f"""ds subject 1001348 --where "SECU_ID == '{stock_code}'" --output json""",
        ),
        (
            bool(payload_rows(rating_cont_up_raw)),
            f"""ds subject 1001352 --where "SECU_ID == '{stock_code}'" --output json""",
        ),
        (
            bool(payload_rows(rating_down_raw)),
            f"""ds subject 1001351 --where "SECU_ID == '{stock_code}'" --output json""",
        ),
        (
            bool(payload_rows(rating_cont_down_raw)),
            f"""ds subject 1001353 --where "SECU_ID == '{stock_code}'" --output json""",
        ),
    ]
    used_queries.extend(command for has_data, command in optional_queries if has_data)
    empty_queries = [command for has_data, command in optional_queries if not has_data]

    data_sources_md = f"""# 数据来源说明

## 生成范围

- 标的：{basic_info["证券简称"]}（{basic_info["证券代码"]}）
- 报告日期：{date.today().isoformat()}
- 数据方式：全部通过 `ds` CLI 获取

## 已使用的查询

```bash
{chr(10).join(used_queries)}
```

## 已查询但该标的暂无数据

```bash
{chr(10).join(empty_queries) if empty_queries else "# 无"}
```
"""
    (stock_dir / "data_sources.md").write_text(data_sources_md, encoding="utf-8")

    executive_table = render_table(
        ["姓名", "职务", "薪酬", "学历"],
        [
            [
                escape(row.get("LEADER_NAME", "数据暂不可得")),
                escape(row.get("PZTION_NAME", "数据暂不可得")),
                escape(format_wan(row.get("CORP_RWRD_GAMT"))),
                escape(row.get("EDU") or "数据暂不可得"),
            ]
            for row in exec_rows
        ] or [[render_empty_state("当前未查询到高管薪酬数据"), "", "", ""]],
    )

    capital_metrics = render_metric_cards(
        [
            ("总股本", format_shares_yi(capital.get("TTL_SHR"))),
            ("流通股合计", format_shares_yi(capital.get("LIST_NEGO_SHR_TTL"))),
            ("流通股占比", format_pct(capital.get("RATI_4"))),
            ("公告日期", format_date(capital.get("NTC_DT"))),
        ]
    )

    lockup_block = (
        render_empty_state(lockup_message)
        if not payload_rows(lockup_raw)
        else render_table(
            ["上市日期", "股份类型", "数量"],
            [
                [
                    escape(format_date(row.get("LIST_DT"))),
                    escape(str(row.get("SHR_TYP_DESC", "数据暂不可得"))),
                    escape(format_num(row.get("LST_VOL"), 0)),
                ]
                for row in (lockup_raw.get("data") or [])
            ],
        )
    )

    top10_table = render_table(
        ["股东", "持股数量（万股）", "持股比例"],
        [
            [
                escape(row.get("SH_NAME", "数据暂不可得")),
                escape(format_shares_wan(row.get("HLD_SHR_VOL"))),
                escape(format_pct(row.get("TTL_SHR_RATI"))),
            ]
            for row in top10_latest
        ],
    )
    top10_float_table = render_table(
        ["股东", "持股数量（万股）", "持股比例"],
        [
            [
                escape(row.get("SH_NAME", "数据暂不可得")),
                escape(format_shares_wan(row.get("HLD_SHR_VOL"))),
                escape(format_pct(row.get("TTL_SHR_RATI"))),
            ]
            for row in top10_float_latest
        ],
    )

    dividend_block = (
        render_empty_state(dividend_message)
        if not dividend_series
        else (
            '<div class="chart-container"><canvas id="dividendChart"></canvas></div>'
            + render_table(
                ["年度", "分红方案", "实施日", "每10股派现"],
                [
                    [
                        escape(f"{row.get('YEAR', '')}{row.get('BGQLX', '')}"),
                        escape(row.get("FHFASM", "数据暂不可得")),
                        escape(format_date(row.get("EX_RT_DT"))),
                        escape(f"{format_num(extract_cash_per_10(row.get('FHFASM'), row.get('BTAX_CASH_AMT')))} 元"),
                    ]
                    for row in dividends[:8]
                    if extract_cash_per_10(row.get("FHFASM"), row.get("BTAX_CASH_AMT")) is not None
                ],
            )
        )
    )

    balance_table = render_table(
        ["报告期", f"总资产（{balance_unit}）", f"总负债（{balance_unit}）", f"股东权益（{balance_unit}）", "资产负债率"],
        [
            [
                escape(annual_label(row)),
                escape(format_amount(row.get("TTL_AST"), balance_unit, balance_divisor)),
                escape(format_amount(row.get("TTL_LIAB"), balance_unit, balance_divisor)),
                escape(format_amount(row.get("SH_EQY_TTL"), balance_unit, balance_divisor)),
                escape(format_pct(safe_div(row.get("TTL_LIAB"), row.get("TTL_AST")) * 100 if safe_div(row.get("TTL_LIAB"), row.get("TTL_AST")) is not None else None)),
            ]
            for row in annual_bs
        ],
    )

    income_annual_table = render_table(
        ["报告期", f"营业收入（{income_annual_unit}）", f"净利润（{income_annual_unit}）", "营收同比", "净利同比"],
        build_financial_table_rows(annual_is, "income", income_annual_unit, income_annual_divisor),
    )
    income_quarter_table = render_table(
        ["报告期", f"营业收入（{income_quarter_unit}）", f"净利润（{income_quarter_unit}）", "营收同比", "净利同比"],
        build_financial_table_rows(quarterly_is, "income", income_quarter_unit, income_quarter_divisor),
    )
    cash_annual_table = render_table(
        ["报告期", f"经营现金流（{cash_annual_unit}）", f"投资现金流（{cash_annual_unit}）", f"筹资现金流（{cash_annual_unit}）", f"现金净增加额（{cash_annual_unit}）"],
        build_financial_table_rows(annual_cf, "cashflow", cash_annual_unit, cash_annual_divisor),
    )
    cash_quarter_table = render_table(
        ["报告期", f"经营现金流（{cash_quarter_unit}）", f"投资现金流（{cash_quarter_unit}）", f"筹资现金流（{cash_quarter_unit}）", f"现金净增加额（{cash_quarter_unit}）"],
        build_financial_table_rows(quarterly_cf, "cashflow", cash_quarter_unit, cash_quarter_divisor),
    )

    business_table = render_table(
        ["业务板块", f"收入（{business_income_unit}）", "收入占比", f"营业利润（{business_income_unit}）", "毛利率"],
        [
            [
                escape(row.get("MAINB_NAME", "数据暂不可得")),
                escape(format_amount(row.get("OP_INC"), business_income_unit, business_income_divisor)),
                escape(format_pct(row.get("MUP_OP_TINC_RATI"))),
                escape(format_amount(row.get("OP_PROF"), business_income_unit, business_income_divisor)),
                escape(format_pct(row.get("GROSS_RATE"))),
            ]
            for row in business_rows[:8]
        ],
    )

    rating_html = render_empty_state(rating_message)
    if rating_has_data:
        blocks = []
        for title, rows in rating_sections:
            if not rows:
                continue
            if "不断" in title:
                table_html = render_table(
                    [
                        "证券代码",
                        "证券简称",
                        "最新机构数（家）",
                        "最新综合评级",
                        "最新环比调整（%）",
                        "一月前综合评级",
                        "二月前综合评级",
                        "三月前综合评级",
                        "3月内涨跌幅（%）",
                        "最新收盘价（元）",
                    ],
                    [
                        [
                            escape(str(row.get("SECU_ID") or stock_code)),
                            escape(str(row.get("SECU_SHT") or basic_info["证券简称"])),
                            escape(format_num(row.get("RAT_AGY_NUM_LAT"), 0)),
                            escape(format_num(row.get("RAT_VAL_LAT"))),
                            escape(format_pct(row.get("RAT_VAL_CHG_PCT_LAT_1M"))),
                            escape(format_num(row.get("RAT_VAL_1M"))),
                            escape(format_num(row.get("RAT_VAL_2M"))),
                            escape(format_num(row.get("RAT_VAL_3M"))),
                            escape(format_pct(row.get("PRICE_CHG_PCT"))),
                            escape(format_num(row.get("LATEST_CPRC"))),
                        ]
                        for row in rows[:10]
                    ],
                )
            else:
                table_html = render_table(
                    [
                        "证券代码",
                        "证券简称",
                        "统计区间",
                        "评级机构数（家）",
                        "最新综合评级",
                        "期初综合评级",
                        "调整幅度（%）",
                        "区间涨跌幅（%）",
                        "最新收盘价（元）",
                    ],
                    [
                        [
                            escape(str(row.get("SECU_ID") or stock_code)),
                            escape(str(row.get("SECU_SHT") or basic_info["证券简称"])),
                            escape(str(row.get("STAT_PRD") or GENERIC_UNAVAILABLE_TEXT)),
                            escape(format_num(row.get("RAT_AGY_NUM"), 0)),
                            escape(format_num(row.get("RAT_VAL_LAT"))),
                            escape(format_num(row.get("RAT_VAL_BEG"))),
                            escape(format_pct(row.get("RAT_VAL_CHG_PCT"))),
                            escape(format_pct(row.get("PRICE_CHG_PCT"))),
                            escape(format_num(row.get("LATEST_CPRC"))),
                        ]
                        for row in rows[:10]
                    ],
                )
            blocks.append(render_section_title(title) + table_html)
        rating_html = "".join(blocks) if blocks else rating_html

    report_html = f"""<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{escape(basic_info["证券简称"])}（{escape(stock_code)}）投资分析报告 | XYC Research</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700;900&family=Crimson+Pro:wght@300;400;500;600&family=JetBrains+Mono:wght@300;400;500;600&family=Noto+Sans+SC:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
    <style>
        :root {{
            --color-primary: #1a365d;
            --color-primary-light: #2c5282;
            --color-accent: #c9a227;
            --color-accent-light: #d4a843;
            --color-positive: #1b5e20;
            --color-negative: #c41e3a;
            --color-info: #0369a1;
            --bg-primary: #ffffff;
            --bg-secondary: #fafafa;
            --bg-tertiary: #f5f5f5;
            --bg-card: #ffffff;
            --bg-elevated: #fafafa;
            --text-primary: #1a1a1a;
            --text-secondary: #4a4a4a;
            --text-tertiary: #737373;
            --text-muted: #a3a3a3;
            --border-light: #e5e5e5;
            --border-medium: #d4d4d4;
            --border-dark: #a3a3a3;
            --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
            --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.07);
            --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
            --shadow-xl: 0 20px 25px rgba(0, 0, 0, 0.12);
            --space-xs: 0.25rem;
            --space-sm: 0.5rem;
            --space-md: 1rem;
            --space-lg: 1.5rem;
            --space-xl: 2rem;
            --space-2xl: 3rem;
            --space-3xl: 4rem;
            --font-display: 'Playfair Display', 'Noto Serif SC', serif;
            --font-serif: 'Crimson Pro', 'Noto Serif SC', serif;
            --font-mono: 'JetBrains Mono', 'SF Mono', monospace;
            --font-body: 'Noto Sans SC', 'Source Sans Pro', -apple-system, sans-serif;
            --transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }}

        * {{
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }}

        html {{
            scroll-behavior: smooth;
            font-size: 16px;
        }}

        body {{
            font-family: var(--font-body);
            background: var(--bg-secondary);
            color: var(--text-primary);
            line-height: 1.75;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
        }}

        body::before {{
            content: '';
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            opacity: 0.4;
            pointer-events: none;
            z-index: 0;
            background-image:
                repeating-linear-gradient(
                    0deg,
                    transparent,
                    transparent 2px,
                    rgba(0, 0, 0, 0.01) 2px,
                    rgba(0, 0, 0, 0.01) 4px
                );
        }}

        .nav-bar {{
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            z-index: 1000;
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            border-bottom: 1px solid var(--border-light);
            box-shadow: var(--shadow-sm);
        }}

        .nav-content {{
            max-width: 1200px;
            margin: 0 auto;
            padding: 0 var(--space-xl);
            height: 56px;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }}

        .nav-brand {{
            font-family: var(--font-display);
            font-size: 1.1rem;
            font-weight: 700;
            letter-spacing: 0.1em;
            color: var(--color-primary);
        }}

        .nav-links {{
            display: flex;
            gap: var(--space-sm);
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
        }}

        .nav-links::-webkit-scrollbar {{
            display: none;
        }}

        .nav-link {{
            font-size: 0.75rem;
            font-weight: 500;
            color: var(--text-secondary);
            text-decoration: none;
            padding: var(--space-xs) var(--space-md);
            border-radius: 3px;
            white-space: nowrap;
            transition: var(--transition);
            letter-spacing: 0.05em;
            text-transform: uppercase;
        }}

        .nav-link:hover,
        .nav-link.active {{
            color: var(--color-primary);
            background: rgba(26, 54, 93, 0.08);
        }}

        .main-container {{
            max-width: 1200px;
            margin: 0 auto;
            padding: 72px var(--space-xl) var(--space-3xl);
            position: relative;
            z-index: 1;
        }}

        .report-header {{
            text-align: center;
            padding: var(--space-3xl) 0 var(--space-2xl);
            border-bottom: 3px double var(--border-light);
            margin-bottom: var(--space-2xl);
            animation: fadeIn 0.8s ease-out;
        }}

        .report-meta {{
            display: flex;
            justify-content: center;
            gap: var(--space-lg);
            margin-bottom: var(--space-md);
            font-family: var(--font-mono);
            font-size: 0.65rem;
            color: var(--text-tertiary);
            letter-spacing: 0.15em;
            text-transform: uppercase;
            flex-wrap: wrap;
        }}

        .report-title {{
            font-family: var(--font-display);
            font-size: clamp(1.75rem, 4vw, 2.75rem);
            font-weight: 700;
            line-height: 1.3;
            margin-bottom: var(--space-sm);
            color: var(--text-primary);
        }}

        .report-subtitle {{
            font-family: var(--font-serif);
            font-size: 1.1rem;
            color: var(--text-secondary);
            font-weight: 400;
            font-style: italic;
        }}

        .ornament {{
            width: 60px;
            height: 3px;
            background: var(--color-accent);
            margin: var(--space-lg) auto 0;
        }}

        .quote-ticker {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
            gap: var(--space-md);
            margin-bottom: var(--space-2xl);
            animation: fadeIn 0.8s ease-out 0.1s both;
        }}

        .ticker-item {{
            background: var(--bg-card);
            border: 1px solid var(--border-light);
            border-radius: 8px;
            padding: var(--space-md) var(--space-sm);
            text-align: center;
            transition: var(--transition);
            position: relative;
            box-shadow: var(--shadow-sm);
        }}

        .ticker-item:hover {{
            transform: translateY(-2px);
            box-shadow: var(--shadow-md);
            border-color: var(--border-medium);
        }}

        .ticker-label {{
            font-family: var(--font-mono);
            font-size: 0.6rem;
            color: var(--text-tertiary);
            letter-spacing: 0.1em;
            text-transform: uppercase;
            margin-bottom: var(--space-xs);
        }}

        .ticker-value {{
            font-family: var(--font-mono);
            font-size: 1.5rem;
            font-weight: 600;
            color: var(--text-primary);
        }}

        .card {{
            background: var(--bg-card);
            border: 1px solid var(--border-light);
            border-radius: 12px;
            padding: var(--space-2xl);
            margin-bottom: var(--space-xl);
            box-shadow: var(--shadow-sm);
            animation: fadeIn 0.8s ease-out both;
        }}

        .card:hover {{
            box-shadow: var(--shadow-lg);
        }}

        .card-header {{
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: var(--space-xl);
            padding-bottom: var(--space-md);
            border-bottom: 1px solid var(--border-light);
        }}

        .card-title {{
            font-family: var(--font-display);
            font-size: 1.75rem;
            font-weight: 600;
            color: var(--text-primary);
        }}

        .card-number {{
            font-family: var(--font-mono);
            font-size: 0.7rem;
            font-weight: 600;
            color: var(--bg-card);
            background: var(--color-primary);
            padding: var(--space-sm) var(--space-md);
            border-radius: 3px;
            letter-spacing: 0.1em;
        }}

        .info-grid {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
            gap: var(--space-md);
        }}

        .info-item {{
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: var(--space-md);
            background: var(--bg-elevated);
            border-radius: 6px;
            border: 1px solid var(--border-light);
            transition: var(--transition);
            gap: var(--space-md);
        }}

        .info-item:hover {{
            border-color: var(--color-primary);
        }}

        .info-label {{
            font-size: 0.875rem;
            color: var(--text-secondary);
            font-weight: 500;
        }}

        .info-value {{
            font-family: var(--font-mono);
            font-size: 0.875rem;
            color: var(--text-primary);
            font-weight: 600;
            text-align: right;
        }}

        .section-subtitle {{
            font-size: 1.1rem;
            font-weight: 600;
            color: var(--text-primary);
            margin: 0;
            padding-left: var(--space-md);
            border-left: 3px solid var(--color-accent);
            position: relative;
        }}

        .section-subtitle::before {{
            content: '';
            position: absolute;
            left: 0;
            width: 3px;
            height: 100%;
            background: var(--color-accent);
        }}

        .section-heading {{
            display: flex;
            align-items: flex-end;
            justify-content: space-between;
            gap: var(--space-md);
            margin: var(--space-xl) 0 var(--space-md);
        }}

        .section-meta {{
            font-family: var(--font-mono);
            font-size: 0.72rem;
            color: var(--text-tertiary);
            letter-spacing: 0.04em;
            white-space: nowrap;
        }}

        .section-paragraph {{
            font-size: 0.95rem;
            line-height: 1.8;
            color: var(--text-secondary);
            margin: var(--space-md) 0;
        }}

        .evidence-card {{
            background: var(--bg-elevated);
            border-left: 3px solid var(--color-primary);
            padding: var(--space-md) var(--space-lg);
            margin: var(--space-md) 0;
            border-radius: 0 6px 6px 0;
        }}

        .evidence-card.positive {{
            border-left-color: var(--color-positive);
            background: rgba(27, 94, 32, 0.05);
        }}

        .evidence-card.negative {{
            border-left-color: var(--color-negative);
            background: rgba(196, 30, 58, 0.05);
        }}

        .evidence-card.neutral {{
            border-left-color: var(--color-primary);
            background: rgba(26, 54, 93, 0.05);
        }}

        .evidence-header {{
            display: flex;
            align-items: center;
            gap: var(--space-sm);
            font-family: var(--font-display);
            font-size: 1rem;
            font-weight: 600;
            color: var(--text-primary);
            margin-bottom: var(--space-sm);
        }}

        .evidence-content {{
            font-size: 0.875rem;
            color: var(--text-secondary);
            line-height: 1.6;
        }}

        .evidence-data {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
            gap: var(--space-sm);
            margin: var(--space-sm) 0;
        }}

        .evidence-data-item {{
            display: flex;
            flex-direction: column;
            gap: 2px;
        }}

        .evidence-data-item .label {{
            font-size: 0.7rem;
            color: var(--text-tertiary);
        }}

        .evidence-data-item .value {{
            font-family: var(--font-mono);
            font-size: 0.85rem;
            font-weight: 600;
            color: var(--text-primary);
        }}

        .data-table-container {{
            overflow-x: auto;
            margin: var(--space-md) 0;
            border: 1px solid var(--border-light);
            border-radius: 8px;
            box-shadow: var(--shadow-sm);
        }}

        .data-table {{
            width: 100%;
            border-collapse: collapse;
            background: var(--bg-card);
        }}

        .data-table th,
        .data-table td {{
            padding: 0.875rem 1rem;
            text-align: left;
            border-bottom: 1px solid var(--border-light);
            white-space: nowrap;
        }}

        .data-table th {{
            font-family: var(--font-mono);
            font-size: 0.7rem;
            font-weight: 600;
            color: var(--text-secondary);
            background: var(--bg-elevated);
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }}

        .data-table td {{
            font-size: 0.875rem;
            color: var(--text-primary);
        }}

        .data-table tbody tr:hover {{
            background: rgba(26, 54, 93, 0.02);
        }}

        .data-table tbody tr:last-child td {{
            border-bottom: none;
        }}

        .chart-container {{
            position: relative;
            height: 320px;
            margin: var(--space-lg) 0;
            padding: var(--space-md);
            background: var(--bg-elevated);
            border-radius: 8px;
            border: 1px solid var(--border-light);
        }}

        .tab-group {{
            margin-top: var(--space-md);
        }}

        .tab-buttons {{
            display: inline-flex;
            gap: var(--space-xs);
            padding: 4px;
            background: var(--bg-tertiary);
            border-radius: 999px;
            margin-bottom: var(--space-md);
        }}

        .tab-button {{
            border: 0;
            background: transparent;
            color: var(--text-secondary);
            padding: 0.45rem 0.9rem;
            border-radius: 999px;
            cursor: pointer;
            font-family: var(--font-body);
            font-size: 0.85rem;
            transition: var(--transition);
        }}

        .tab-button.active {{
            background: var(--color-primary);
            color: white;
            box-shadow: var(--shadow-sm);
        }}

        .tab-panel {{
            display: none;
        }}

        .tab-panel.active {{
            display: block;
        }}

        .empty-state {{
            padding: var(--space-xl);
            border: 1px dashed var(--border-medium);
            border-radius: 8px;
            background: var(--bg-elevated);
            color: var(--text-secondary);
            text-align: center;
        }}

        .list-styled {{
            list-style: none;
            padding-left: var(--space-md);
        }}

        .list-styled li {{
            position: relative;
            padding-left: var(--space-lg);
            margin-bottom: var(--space-sm);
        }}

        .list-styled li::before {{
            content: '●';
            position: absolute;
            left: 0;
            color: var(--color-accent);
        }}

        .list-driver {{
            list-style: none;
            padding: 0;
        }}

        .list-driver li {{
            padding: var(--space-md);
            background: var(--bg-elevated);
            border-left: 3px solid var(--color-accent);
            margin-bottom: var(--space-sm);
            border-radius: 0 6px 6px 0;
        }}

        .badge {{
            display: inline-block;
            padding: var(--space-xs) var(--space-sm);
            background: var(--bg-tertiary);
            border-radius: 4px;
            font-family: var(--font-mono);
            font-size: 0.65rem;
            font-weight: 600;
            letter-spacing: 0.05em;
            color: var(--text-secondary);
            margin-right: var(--space-xs);
        }}

        .badge.badge-good {{
            background: rgba(27, 94, 32, 0.15);
            color: var(--color-positive);
        }}

        .badge.badge-warning {{
            background: rgba(201, 162, 39, 0.15);
            color: #b8860b;
        }}

        .badge.negative {{
            background: rgba(196, 30, 58, 0.1);
            color: var(--color-negative);
        }}

        @keyframes fadeIn {{
            from {{
                opacity: 0;
                transform: translateY(10px);
            }}
            to {{
                opacity: 1;
                transform: translateY(0);
            }}
        }}

        @media (max-width: 768px) {{
            .main-container {{
                padding-left: var(--space-md);
                padding-right: var(--space-md);
            }}

            .nav-content {{
                padding: 0 var(--space-md);
            }}

            .card {{
                padding: var(--space-lg);
            }}

            .card-header {{
                align-items: flex-start;
                gap: var(--space-sm);
            }}

            .chart-container {{
                height: 280px;
            }}

            .section-heading {{
                align-items: flex-start;
                flex-direction: column;
            }}
        }}
    </style>
</head>
<body>
    <div class="nav-bar">
        <div class="nav-content">
            <div class="nav-brand">XYC Research</div>
            <div class="nav-links">
                <a href="#intro" class="nav-link">公司简介</a>
                <a href="#capital" class="nav-link">股本和股东</a>
                <a href="#finance" class="nav-link">财务数据</a>
                <a href="#business" class="nav-link">主营业务行业数据</a>
                <a href="#rating" class="nav-link">一致评级</a>
            </div>
        </div>
    </div>

    <main class="main-container">
        <header class="report-header">
            <div class="report-meta">
                <span>{escape(stock_code)}</span>
                <span>{escape(basic_info["申万行业"])}</span>
                <span>{date.today().isoformat()}</span>
            </div>
            <h1 class="report-title">{escape(basic_info["证券简称"])}（{escape(stock_code)}）数据报告</h1>
            <p class="report-subtitle">本报告聚焦 DS CLI 已抓取到的公司、股东、财务和主营业务数据，按固定 5 章结构展示，便于后续复用到更多标的。</p>
            <div class="ornament"></div>
        </header>

        {render_metric_cards([
            ("参考股价", f"{format_num(latest_price)} 元"),
            ("参考总市值", format_yi(latest_market_cap)),
            ("股东户数", format_num(latest_shareholders, 0)),
            ("PE", f"{format_num(pe)}x"),
            ("PB", f"{format_num(pb)}x"),
            ("口径日期", latest_quote_date),
        ])}

        <section class="card" id="intro">
            <div class="card-header">
                <h2 class="card-title">公司简介</h2>
                <span class="card-number">01</span>
            </div>
            {render_section_title("基本信息")}
            <div class="info-grid">
                {''.join(render_info_item(label, value) for label, value in [
                    ("证券代码", basic_info["证券代码"]),
                    ("证券简称", basic_info["证券简称"]),
                    ("公司名称", basic_info["公司名称"]),
                    ("法人代表", basic_info["法人代表"]),
                    ("证监会行业", basic_info["证监会行业"]),
                    ("申万行业", basic_info["申万行业"]),
                    ("注册资本", basic_info["注册资本"]),
                    ("注册地址", basic_info["注册地址"]),
                    ("上市日期", basic_info["上市日期"]),
                    ("成立日期", basic_info["成立日期"]),
                    ("公司网址", basic_info["公司网址"]),
                ])}
            </div>
            {render_section_title("实控人")}
            {render_empty_state(controller_message) if not controller_rows else f'''
            <div class="evidence-card neutral">
                <div class="evidence-header"><span>◎</span><span>控制人信息</span></div>
                <div class="evidence-data">
                    <div class="evidence-data-item"><span class="label">实控人</span><span class="value">{escape(basic_info["实控人"])}</span></div>
                    <div class="evidence-data-item"><span class="label">控制人类型</span><span class="value">{escape(basic_info["实控人类型"])}</span></div>
                    <div class="evidence-data-item"><span class="label">开始日期</span><span class="value">{escape(basic_info["实控开始日"])}</span></div>
                </div>
            </div>
            '''}
            {render_section_title("高管薪酬", f"合计高管薪酬 {format_wan(exec_total_reward)}" if exec_rows else None)}
            {executive_table}
        </section>

        <section class="card" id="capital">
            <div class="card-header">
                <h2 class="card-title">股本和股东</h2>
                <span class="card-number">02</span>
            </div>
            {render_section_title("股本数据")}
            {capital_metrics}
            {render_section_title("解禁数据")}
            {lockup_block}
            {render_section_title("股东数据")}
            <div class="evidence-card positive">
                <div class="evidence-header"><span>◎</span><span>最新股东监测</span></div>
                <div class="evidence-data">
                    <div class="evidence-data-item"><span class="label">日期</span><span class="value">{escape(latest_quote_date)}</span></div>
                    <div class="evidence-data-item"><span class="label">股东户数</span><span class="value">{escape(format_num(latest_shareholders, 0))}</span></div>
                    <div class="evidence-data-item"><span class="label">户均持股</span><span class="value">{escape(format_num(shareholder_monitor_latest.get("AVG_HLD_SHR")))} 股</span></div>
                    <div class="evidence-data-item"><span class="label">大股东持股比例</span><span class="value">{escape(format_pct(holder_ratio_latest.get("TTL_SHR_RATI_SUM")))}</span></div>
                </div>
            </div>
            {render_section_title("前十大股东", f"公告日 {top10_notice_date}" if top10_notice_date else None)}
            {top10_table}
            {render_section_title("前十大流通股东", f"公告日 {top10_float_notice_date}" if top10_float_notice_date else None)}
            {top10_float_table}
            {render_section_title("分红数据")}
            {dividend_block}
        </section>

        <section class="card" id="finance">
            <div class="card-header">
                <h2 class="card-title">财务数据</h2>
                <span class="card-number">03</span>
            </div>
            {render_section_title("资产负债表")}
            <div class="chart-container"><canvas id="balanceChart"></canvas></div>
            {balance_table}
            {render_section_title("利润表")}
            <div class="tab-group" data-tab-group="income">
                <div class="tab-buttons">
                    <button class="tab-button active" data-tab-target="income-annual">年度</button>
                    <button class="tab-button" data-tab-target="income-quarter">季度</button>
                </div>
                <div class="tab-panel active" id="income-annual">
                    <div class="chart-container"><canvas id="incomeAnnualChart"></canvas></div>
                    {income_annual_table}
                </div>
                <div class="tab-panel" id="income-quarter">
                    <div class="chart-container"><canvas id="incomeQuarterChart"></canvas></div>
                    {income_quarter_table}
                </div>
            </div>
            {render_section_title("现金流量表")}
            <div class="tab-group" data-tab-group="cashflow">
                <div class="tab-buttons">
                    <button class="tab-button active" data-tab-target="cashflow-annual">年度</button>
                    <button class="tab-button" data-tab-target="cashflow-quarter">季度</button>
                </div>
                <div class="tab-panel active" id="cashflow-annual">
                    <div class="chart-container"><canvas id="cashflowAnnualChart"></canvas></div>
                    {cash_annual_table}
                </div>
                <div class="tab-panel" id="cashflow-quarter">
                    <div class="chart-container"><canvas id="cashflowQuarterChart"></canvas></div>
                    {cash_quarter_table}
                </div>
            </div>
        </section>

        <section class="card" id="business">
            <div class="card-header">
                <h2 class="card-title">主营业务行业数据</h2>
                <span class="card-number">04</span>
            </div>
            {render_section_title("主营构成")}
            <div class="chart-container"><canvas id="businessChart"></canvas></div>
            {business_table}
            {render_section_title("业务观察")}
            <div class="evidence-card neutral">
                <div class="evidence-header"><span>◎</span><span>简要判断</span></div>
                <div class="evidence-content">
                    <ul class="list-driver">
                        <li><strong>收入主线：</strong>{escape((business_rows[0].get("MAINB_NAME") if business_rows else "数据暂不可得"))}、{escape((business_rows[1].get("MAINB_NAME") if len(business_rows) > 1 else "数据暂不可得"))}是当前主要收入来源。</li>
                        <li><strong>盈利质量：</strong>可优先关注毛利率更高且收入占比更高的业务条线，观察其在不同市场环境下的稳定性。</li>
                        <li><strong>行业定位：</strong>公司属于{escape(basic_info["证监会行业"])}，当前页面以主营构成数据为主，不扩展长篇行业评论。</li>
                    </ul>
                </div>
            </div>
        </section>

        <section class="card" id="rating">
            <div class="card-header">
                <h2 class="card-title">一致评级</h2>
                <span class="card-number">05</span>
            </div>
            {rating_html}
        </section>
    </main>

    <script>
        const balanceChartData = {json.dumps({
            "labels": [item["label"] for item in asset_series],
            "assets": [item["value"] for item in asset_series],
            "liabilities": [item["value"] for item in liability_series],
            "equity": [item["value"] for item in equity_series],
            "unit": balance_unit,
        }, ensure_ascii=False)};
        const incomeAnnualData = {json.dumps({
            "labels": [item["label"] for item in revenue_series],
            "revenue": [item["value"] for item in revenue_series],
            "profit": [item["value"] for item in profit_series],
            "unit": income_annual_unit,
        }, ensure_ascii=False)};
        const incomeQuarterData = {json.dumps({
            "labels": [item["label"] for item in quarter_revenue_series],
            "revenue": [item["value"] for item in quarter_revenue_series],
            "profit": [item["value"] for item in quarter_profit_series],
            "unit": income_quarter_unit,
        }, ensure_ascii=False)};
        const cashflowAnnualData = {json.dumps({
            "labels": [item["label"] for item in annual_op_cf_series],
            "operate": [item["value"] for item in annual_op_cf_series],
            "invest": [item["value"] for item in annual_insm_cf_series],
            "finance": [item["value"] for item in annual_fin_cf_series],
            "unit": cash_annual_unit,
        }, ensure_ascii=False)};
        const cashflowQuarterData = {json.dumps({
            "labels": [item["label"] for item in quarter_op_cf_series],
            "operate": [item["value"] for item in quarter_op_cf_series],
            "invest": [item["value"] for item in quarter_insm_cf_series],
            "finance": [item["value"] for item in quarter_fin_cf_series],
            "unit": cash_quarter_unit,
        }, ensure_ascii=False)};
        const businessChartData = {json.dumps({
            "labels": [row.get("MAINB_NAME") for row in business_rows[:6]],
            "revenue": [scaled_amount(row.get("OP_INC"), business_income_divisor) for row in business_rows[:6]],
            "unit": business_income_unit,
        }, ensure_ascii=False)};
        const dividendChartData = {json.dumps({
            "labels": [row["label"] for row in dividend_series],
            "values": [row["value"] for row in dividend_series],
        }, ensure_ascii=False)};

        function buildBarLineChart(canvasId, labels, bars, line, barLabel, lineLabel) {{
            const canvas = document.getElementById(canvasId);
            if (!canvas) return;
            new Chart(canvas, {{
                data: {{
                    labels,
                    datasets: [
                        {{
                            type: 'bar',
                            label: barLabel,
                            data: bars,
                            backgroundColor: 'rgba(26, 54, 93, 0.75)',
                            borderRadius: 4
                        }},
                        {{
                            type: 'line',
                            label: lineLabel,
                            data: line,
                            borderColor: '#c9a227',
                            backgroundColor: 'rgba(201, 162, 39, 0.18)',
                            fill: false,
                            tension: 0.35,
                            pointBackgroundColor: '#fff',
                            pointBorderColor: '#c9a227',
                            pointBorderWidth: 2
                        }}
                    ]
                }},
                options: {{
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: {{ mode: 'index', intersect: false }},
                    scales: {{ y: {{ beginAtZero: true }} }}
                }}
            }});
        }}

        function buildMultiBarChart(canvasId, labels, datasets) {{
            const canvas = document.getElementById(canvasId);
            if (!canvas) return;
            new Chart(canvas, {{
                type: 'bar',
                data: {{ labels, datasets }},
                options: {{
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: {{ mode: 'index', intersect: false }},
                    scales: {{ y: {{ beginAtZero: true }} }}
                }}
            }});
        }}

        buildMultiBarChart('balanceChart', balanceChartData.labels, [
            {{ label: '总资产(' + balanceChartData.unit + ')', data: balanceChartData.assets, backgroundColor: 'rgba(26, 54, 93, 0.75)' }},
            {{ label: '总负债(' + balanceChartData.unit + ')', data: balanceChartData.liabilities, backgroundColor: 'rgba(196, 30, 58, 0.7)' }},
            {{ label: '股东权益(' + balanceChartData.unit + ')', data: balanceChartData.equity, backgroundColor: 'rgba(201, 162, 39, 0.75)' }}
        ]);
        buildBarLineChart('incomeAnnualChart', incomeAnnualData.labels, incomeAnnualData.revenue, incomeAnnualData.profit, '营业收入(' + incomeAnnualData.unit + ')', '净利润(' + incomeAnnualData.unit + ')');
        buildBarLineChart('incomeQuarterChart', incomeQuarterData.labels, incomeQuarterData.revenue, incomeQuarterData.profit, '营业收入(' + incomeQuarterData.unit + ')', '净利润(' + incomeQuarterData.unit + ')');
        buildMultiBarChart('cashflowAnnualChart', cashflowAnnualData.labels, [
            {{ label: '经营现金流(' + cashflowAnnualData.unit + ')', data: cashflowAnnualData.operate, backgroundColor: 'rgba(26, 54, 93, 0.75)' }},
            {{ label: '投资现金流(' + cashflowAnnualData.unit + ')', data: cashflowAnnualData.invest, backgroundColor: 'rgba(3, 105, 161, 0.7)' }},
            {{ label: '筹资现金流(' + cashflowAnnualData.unit + ')', data: cashflowAnnualData.finance, backgroundColor: 'rgba(201, 162, 39, 0.75)' }}
        ]);
        buildMultiBarChart('cashflowQuarterChart', cashflowQuarterData.labels, [
            {{ label: '经营现金流(' + cashflowQuarterData.unit + ')', data: cashflowQuarterData.operate, backgroundColor: 'rgba(26, 54, 93, 0.75)' }},
            {{ label: '投资现金流(' + cashflowQuarterData.unit + ')', data: cashflowQuarterData.invest, backgroundColor: 'rgba(3, 105, 161, 0.7)' }},
            {{ label: '筹资现金流(' + cashflowQuarterData.unit + ')', data: cashflowQuarterData.finance, backgroundColor: 'rgba(201, 162, 39, 0.75)' }}
        ]);
        buildMultiBarChart('businessChart', businessChartData.labels, [
            {{ label: '收入(' + businessChartData.unit + ')', data: businessChartData.revenue, backgroundColor: 'rgba(26, 54, 93, 0.75)' }}
        ]);
        if (document.getElementById('dividendChart')) {{
            buildMultiBarChart('dividendChart', dividendChartData.labels, [
                {{ label: '每10股派现(元)', data: dividendChartData.values, backgroundColor: 'rgba(201, 162, 39, 0.75)' }}
            ]);
        }}

        document.querySelectorAll('.tab-group').forEach((group) => {{
            const buttons = group.querySelectorAll('.tab-button');
            const panels = group.querySelectorAll('.tab-panel');
            buttons.forEach((button) => {{
                button.addEventListener('click', () => {{
                    buttons.forEach((item) => item.classList.remove('active'));
                    panels.forEach((panel) => panel.classList.remove('active'));
                    button.classList.add('active');
                    const panel = group.querySelector('#' + button.dataset.tabTarget);
                    if (panel) panel.classList.add('active');
                }});
            }});
        }});

        const sections = document.querySelectorAll('.card[id]');
        const navLinks = document.querySelectorAll('.nav-link');
        function setActiveLink() {{
            let current = '';
            sections.forEach((section) => {{
                const top = section.offsetTop - 100;
                if (window.scrollY >= top) current = section.id;
            }});
            navLinks.forEach((link) => {{
                link.classList.toggle('active', link.getAttribute('href') === '#' + current);
            }});
        }}
        window.addEventListener('scroll', setActiveLink);
        setActiveLink();
    </script>
</body>
</html>
"""

    (report_dir / "report.html").write_text(report_html, encoding="utf-8")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
