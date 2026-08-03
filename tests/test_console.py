import os
import sys

from rich.console import Console
from rich.progress import Progress

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from analyzers.console import console, stage_progress  # noqa: E402


def test_console_is_shared_rich_console():
    assert isinstance(console, Console)


def test_stage_progress_binds_shared_console_and_completes():
    # 非 TTY 环境（pytest 捕获输出）下也必须能正常创建、推进、结束
    with stage_progress() as progress:
        assert isinstance(progress, Progress)
        assert progress.console is console
        task = progress.add_task('测试阶段', total=3)
        for _ in range(3):
            progress.advance(task)
        assert progress.tasks[0].finished
