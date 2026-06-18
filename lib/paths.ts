import { join, dirname } from "path";
import { existsSync, mkdirSync } from "fs";
import { fileURLToPath } from "url";
import { tmpdir } from "os";

let _projectRoot: string | null = null;
let _uploadsDir: string | null = null;
let _tempDir: string | null = null;

export function getProjectRoot(): string {
  if (_projectRoot) return _projectRoot;
  const cwd = process.cwd();
  if (existsSync(join(cwd, "package.json"))) {
    _projectRoot = cwd;
    return cwd;
  }
  try {
    let dir = dirname(fileURLToPath(import.meta.url));
    for (let i = 0; i < 10; i++) {
      if (existsSync(join(dir, "package.json"))) {
        _projectRoot = dir;
        return dir;
      }
      dir = dirname(dir);
    }
  } catch {}
  _projectRoot = cwd;
  return cwd;
}

function tryMkdir(dir: string): boolean {
  try {
    mkdirSync(dir, { recursive: true });
    return true;
  } catch {
    return false;
  }
}

export function getUploadsDir(): string {
  if (_uploadsDir) return _uploadsDir;
  if (process.env.UPLOAD_DIR) {
    _uploadsDir = process.env.UPLOAD_DIR;
    return _uploadsDir;
  }
  const primary = join(getProjectRoot(), "private", "uploads");
  if (tryMkdir(primary)) {
    _uploadsDir = primary;
  } else {
    _uploadsDir = join(tmpdir(), "uploads");
    tryMkdir(_uploadsDir);
  }
  return _uploadsDir;
}

export function getAvatarsDir(): string {
  return join(getUploadsDir(), "avatars");
}

export function getTempDir(): string {
  if (_tempDir) return _tempDir;
  const primary = join(getProjectRoot(), "private", "temp");
  if (tryMkdir(primary)) {
    _tempDir = primary;
  } else {
    _tempDir = join(tmpdir(), "temp");
    tryMkdir(_tempDir);
  }
  return _tempDir;
}
