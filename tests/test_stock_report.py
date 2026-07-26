from dataclasses import fields
from pathlib import Path
import runpy
import unittest


REPO_ROOT = Path(__file__).resolve().parents[1]
SCRIPTS_ROOT = REPO_ROOT / "skills" / "finance" / "stock-report" / "scripts"


class StockReportTest(unittest.TestCase):
    def test_scripts_resolve_repo_without_data_directory(self) -> None:
        for script_name in [
            "fetch_and_generate_stock_report.py",
            "generate_ds_report.py",
        ]:
            module = runpy.run_path(
                str(SCRIPTS_ROOT / script_name),
                run_name=f"test_{script_name}",
            )
            self.assertEqual(module["ROOT"], REPO_ROOT)

    def test_report_renderer_includes_accessible_interactions(self) -> None:
        module = runpy.run_path(
            str(SCRIPTS_ROOT / "generate_ds_report.py"),
            run_name="test_generate_ds_report",
        )
        report_view = module["ReportView"]
        values = {field.name: [] for field in fields(report_view)}
        for field in fields(report_view):
            if field.name.endswith(("_table", "_block", "_html", "_message", "_unit")):
                values[field.name] = ""
        values.update(
            {
                "stock_code": "000001.SZ",
                "report_css": (SCRIPTS_ROOT / "templates" / "report.css").read_text(),
                "basic_info": {
                    "证券代码": "000001.SZ",
                    "证券简称": "测试",
                    "公司名称": "测试",
                    "法人代表": "测试",
                    "证监会行业": "测试",
                    "申万行业": "测试",
                    "注册资本": "0",
                    "注册地址": "测试",
                    "上市日期": "",
                    "成立日期": "",
                    "公司网址": "",
                    "实控人": "",
                    "实控人类型": "",
                    "实控开始日": "",
                },
                "holder_ratio_latest": {},
                "shareholder_monitor_latest": {},
                "capital_metrics": [],
                "business_income_divisor": 1,
                "latest_price": None,
                "latest_market_cap": None,
                "latest_shareholders": None,
                "latest_quote_date": "",
                "exec_total_reward": 0,
                "pe": None,
                "pb": None,
            }
        )

        html = module["render_report_html"](report_view(**values))

        self.assertIn('href="#main-content"', html)
        self.assertIn('role="tablist"', html)
        self.assertIn('role="tabpanel"', html)
        self.assertIn('aria-selected="true"', html)
        self.assertIn("prefers-reduced-motion: reduce", html)


if __name__ == "__main__":
    unittest.main()
