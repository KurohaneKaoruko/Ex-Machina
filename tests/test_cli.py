import json
import tempfile
import unittest
from pathlib import Path

from exmachina.cli import main


class CliTests(unittest.TestCase):
    def test_export_settings_writes_settings_bundle(self) -> None:
        with tempfile.TemporaryDirectory() as tmpdir:
            output = Path(tmpdir) / "out"
            exit_code = main(
                [
                    "export-settings",
                    "--task",
                    "把 ExMachina 的多智能体配置载入 OpenClaw 设置",
                    "--out",
                    str(output),
                ]
            )

            self.assertEqual(exit_code, 0)
            settings_bundle = json.loads((output / "openclaw.settings.json").read_text(encoding="utf-8"))
            self.assertEqual(settings_bundle["mode"], "lite")
            self.assertIn("settings_patch", settings_bundle)
            self.assertIn("dialogue_contracts", settings_bundle)
            self.assertEqual(settings_bundle["dialogue_contracts"]["exmachina-main"]["role_name"], "主控体")
            self.assertTrue(settings_bundle["dialogue_contracts"]["exmachina-main"]["sample_utterances"])
            self.assertTrue((output / "install" / "SETTINGS.md").exists())

    def test_build_command_exports_lite_pack_by_default(self) -> None:
        with tempfile.TemporaryDirectory() as tmpdir:
            workspace = Path(tmpdir) / "workspace"
            output = Path(tmpdir) / "out"
            workspace.mkdir()
            (workspace / "README.md").write_text("# demo\n", encoding="utf-8")
            (workspace / "tests").mkdir()
            (workspace / "tests" / "test_sample.py").write_text("def test_ok():\n    assert True\n", encoding="utf-8")

            exit_code = main(
                [
                    "build",
                    "--task",
                    "为 OpenClaw 补充运行时拓扑与详细角色契约",
                    "--repo",
                    "https://code.example.com/example/exmachina",
                    "--workspace",
                    str(workspace),
                    "--out",
                    str(output),
                ]
            )

            self.assertEqual(exit_code, 0)
            manifest = json.loads((output / "openclaw-pack" / "manifest.json").read_text(encoding="utf-8"))
            mission = json.loads((output / "mission.json").read_text(encoding="utf-8"))
            settings_bundle = json.loads((output / "openclaw-pack" / "openclaw.settings.json").read_text(encoding="utf-8"))
            runtime_spec = json.loads(
                (output / "openclaw-pack" / "runtime" / "agents" / "exmachina-main" / "spec.json").read_text(
                    encoding="utf-8"
                )
            )
            task_board = json.loads((output / "openclaw-pack" / "runtime" / "task-board.json").read_text(encoding="utf-8"))
            child_doc = next((output / "openclaw-pack" / "subagents").glob("*.md")).read_text(encoding="utf-8")
            bootstrap_doc = (output / "openclaw-pack" / "BOOTSTRAP.md").read_text(encoding="utf-8")
            prompt_doc = (output / "openclaw-pack" / "examples" / "openclaw-prompt.md").read_text(encoding="utf-8")

            self.assertEqual(mission["mode"], "lite")
            self.assertEqual(manifest["mode"], "lite")
            self.assertFalse(manifest["compatibility"]["requires_multi_agent_binding"])
            self.assertFalse(manifest["compatibility"]["requires_external_routing"])
            self.assertEqual(settings_bundle["mode"], "lite")
            self.assertTrue(settings_bundle["supports_direct_import"])
            self.assertIn("settings_patch", settings_bundle)
            self.assertIn("openclaw_settings_bundle", manifest)
            self.assertIn("openclaw_directive", manifest)
            self.assertTrue(manifest["openclaw_directive"]["quick_start"])
            self.assertEqual(runtime_spec["runtime_role"], "single-agent-conductor")
            self.assertIn("ordered_execution_steps", task_board)
            self.assertTrue(task_board["ordered_execution_steps"])
            self.assertIn("single_session_brief", task_board)
            self.assertIn("recommended_skill", runtime_spec)
            self.assertTrue((output / "openclaw-pack" / "install" / "SETTINGS.md").exists())
            self.assertTrue((output / "openclaw-pack" / "install" / "install_openclaw_settings.py").exists())
            self.assertFalse((output / "openclaw-pack" / "install" / "workspaces").exists())
            self.assertFalse((output / "openclaw-pack" / "install" / "compat" / "workspaces").exists())
            self.assertFalse((output / "openclaw-pack" / "install" / "compat" / "openclaw.agents.plan.json").exists())
            self.assertIn("## 工作流", child_doc)
            self.assertIn("## 对话口吻", child_doc)
            self.assertIn("## 输出契约", child_doc)
            self.assertIn("## 对话口吻契约", bootstrap_doc)
            self.assertIn("分层口吻", prompt_doc)
            self.assertIn("优先词汇", bootstrap_doc)
            self.assertIn("已接收", prompt_doc)

    def test_build_command_exports_full_pack_when_requested(self) -> None:
        with tempfile.TemporaryDirectory() as tmpdir:
            workspace = Path(tmpdir) / "workspace"
            output = Path(tmpdir) / "out"
            workspace.mkdir()
            (workspace / "README.md").write_text("# demo\n", encoding="utf-8")
            (workspace / "tests").mkdir()
            (workspace / "tests" / "test_sample.py").write_text("def test_ok():\n    assert True\n", encoding="utf-8")

            exit_code = main(
                [
                    "build",
                    "--mode",
                    "full",
                    "--task",
                    "为 OpenClaw 补充运行时拓扑与详细角色契约",
                    "--repo",
                    "https://code.example.com/example/exmachina",
                    "--workspace",
                    str(workspace),
                    "--out",
                    str(output),
                ]
            )

            self.assertEqual(exit_code, 0)
            manifest = json.loads((output / "openclaw-pack" / "manifest.json").read_text(encoding="utf-8"))
            install_plan = json.loads(
                (output / "openclaw-pack" / "install" / "compat" / "openclaw.agents.plan.json").read_text(encoding="utf-8")
            )
            topology = json.loads((output / "openclaw-pack" / "runtime" / "topology.json").read_text(encoding="utf-8"))
            workspace_bootstrap = (
                output / "openclaw-pack" / "install" / "compat" / "workspaces" / "exmachina-main" / "BOOTSTRAP.md"
            ).read_text(encoding="utf-8")

            self.assertEqual(manifest["mode"], "full")
            self.assertTrue(manifest["compatibility"]["requires_multi_agent_binding"])
            self.assertTrue(manifest["compatibility"]["requires_external_routing"])
            self.assertGreater(len(install_plan["agents"]), 1)
            self.assertTrue(topology["routes"])
            self.assertEqual(manifest["openclaw_settings_bundle"]["path"], "openclaw.settings.json")
            self.assertEqual(manifest["openclaw_compat_bundle"]["install_plan"], "install/compat/openclaw.agents.plan.json")
            self.assertTrue((output / "openclaw-pack" / "install" / "compat" / "workspaces" / "exmachina-main").exists())
            self.assertFalse((output / "openclaw-pack" / "install" / "workspaces").exists())
            self.assertIn("## 对话口吻契约", workspace_bootstrap)
            self.assertIn("优先词汇", workspace_bootstrap)


if __name__ == "__main__":
    unittest.main()
