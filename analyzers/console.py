"""共享的 rich 输出设施。

main.py 与各 analyzer 模块都从这里拿同一个 Console 实例。进行中的
逐条日志一律打到这个 console 上：Progress 活跃时 rich 会把它们滚动
在进度条上方，进度条固定在底部原地刷新——这就是「有记录但不刷屏」。

注意：插值了动态内容（URL、论文标题、文件名）的 print 必须加
markup=False，论文标题常含 [...]，会被 rich 当成 markup 标签。
"""
from rich.console import Console
from rich.progress import (
    BarColumn,
    MofNCompleteColumn,
    Progress,
    SpinnerColumn,
    TextColumn,
    TimeElapsedColumn,
)

console = Console()


def stage_progress(transient=False):
    """统一样式的阶段进度条。用法：

        with stage_progress() as progress:
            task = progress.add_task('阶段名', total=n)   # total=None 则显示脉冲条
            ...
            progress.advance(task)
    """
    return Progress(
        SpinnerColumn(),
        TextColumn('[progress.description]{task.description}'),
        BarColumn(),
        MofNCompleteColumn(),
        TimeElapsedColumn(),
        console=console,
        transient=transient,
    )
