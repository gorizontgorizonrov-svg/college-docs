import { join, dirname } from "path";
import { existsSync, accessSync, constants } from "fs";
import { fileURLToPath } from "url";
import { tmpdir } from "os";

let _projectRoot: string | null = null;
let _uploadsDir: string | null = null;

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

function isWritable(dir: string): boolean {
  try {
    accessSync(dir, constants.W_OK);
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
  const root = getProjectRoot();
  if (!existsSync(root) || !isWritable(root)) {
    _uploadsDir = join(tmpdir(), "uploads");
  } else {
    _uploadsDir = primary;
  }
  return _uploadsDir;
}

export function getAvatarsDir(): string {
  return join(getUploadsDir(), "avatars");
}

export function getTempDir(): string {
  const root = getProjectRoot();
  if (!existsSync(root) || !isWritable(root)) {
    return join(tmpdir(), "temp");
  }
  return join(root, "private", "temp");
}
