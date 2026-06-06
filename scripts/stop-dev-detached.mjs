import { existsSync, readFileSync, unlinkSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const pidFile = resolve(__dirname, "..", "logs", "nuxt-dev.pid")

if (!existsSync(pidFile)) {
  console.log("No running dev server found (no PID file)")
  process.exit(1)
}

const pid = Number.parseInt(readFileSync(pidFile, "utf-8"), 10)

try {
  process.kill(pid, "SIGTERM")
  console.log(`Dev server (PID ${pid}) stopped`)
} catch {
  console.log(`Dev server (PID ${pid}) was not running`)
}

unlinkSync(pidFile)
process.exit(0)
