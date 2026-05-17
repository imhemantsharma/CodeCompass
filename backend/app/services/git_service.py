import hashlib
import os
import shutil
import stat
import tempfile

from dulwich import porcelain


def get_repo_id(github_url: str) -> str:
    return hashlib.md5(github_url.encode()).hexdigest()[:8]


def get_clone_path(repo_id: str) -> str:
    return os.path.join(tempfile.gettempdir(), f"codecompass_{repo_id}")


def _force_remove(path: str) -> None:
    def _on_error(func, fpath, _exc):
        os.chmod(fpath, stat.S_IWRITE)
        func(fpath)
    shutil.rmtree(path, onerror=_on_error)


def clone_repo(github_url: str) -> tuple:
    repo_id = get_repo_id(github_url)
    clone_path = get_clone_path(repo_id)

    if os.path.exists(clone_path):
        _force_remove(clone_path)

    porcelain.clone(github_url, clone_path, depth=1, checkout=True)

    repo_name = github_url.rstrip("/").split("/")[-1]
    if repo_name.endswith(".git"):
        repo_name = repo_name[:-4]

    return repo_id, repo_name, clone_path
