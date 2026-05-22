import { spawn } from "node:child_process"
import { existsSync, mkdirSync, openSync, readFileSync, writeFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, resolve } from "node:path"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const root = resolve(__dirname, "..")
const logDir = resolve(root, "logs")
const pidFile = resolve(logDir, "nuxt-dev.pid")
const logFile = resolve(logDir, "nuxt-dev.log")

mkdirSync(logDir, { recursive: true })

if (existsSync(pidFile)) {
  try {
    const pid = Number.parseInt(readFileSync(pidFile, "utf-8"), 10)
    process.kill(pid, 0)
    console.log(`Dev server already running (PID ${pid})`)
    process.exit(0)
  } catch {
    // Stale PID file
  }
}

const logFd = openSync(logFile, "a")

const child = spawn("npx", ["nuxt", "dev"], {
  cwd: root,
  detached: true,
  stdio: ["ignore", logFd, logFd],
})

writeFileSync(pidFile, String(child.pid))
child.unref()

console.log(`Dev server starting (PID ${child.pid})`)
console.log(`Logs: ${logFile}`)
console.log(`Stop: kill ${child.pid}`)

process.exit(0)
