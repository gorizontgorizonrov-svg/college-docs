import { join, dirname } from "path";
import { existsSync } from "fs";
import { fileURLToPath } from "url";

let _projectRoot: string | null = null;

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

export function getUploadsDir(): string {
  return process.env.UPLOAD_DIR || join(getProjectRoot(), "private", "uploads");
}

export function getAvatarsDir(): string {
  return join(getUploadsDir(), "avatars");
}

export function getTempDir(): string {
  return join(getProjectRoot(), "private", "temp");
}
