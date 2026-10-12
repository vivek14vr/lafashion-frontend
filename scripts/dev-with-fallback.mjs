import net from 'node:net'
import path from 'node:path'
import { spawn } from 'node:child_process'

const startingPort = Number(process.argv[2] || process.env.PORT || 3001)
const maxAttempts = 20

function canUsePort(port) {
  return new Promise((resolve) => {
    const server = net.createServer()
    server.once('error', () => resolve(false))
    server.listen({ port, host: '127.0.0.1' }, () => server.close(() => resolve(true)))
  })
}

const port = await (async () => {
  for (let offset = 0; offset < maxAttempts; offset += 1) {
    const candidate = startingPort + offset
    if (await canUsePort(candidate)) return candidate
  }
  throw new Error(`Could not find an available port from ${startingPort} to ${startingPort + maxAttempts - 1}.`)
})()

if (port !== startingPort) console.log(`Port ${startingPort} is busy; starting the frontend on ${port}.`)
else console.log(`Starting the frontend on ${port}.`)

const nextBin = path.resolve('node_modules/next/dist/bin/next')
const child = spawn(process.execPath, [nextBin, 'dev', '--hostname', '0.0.0.0', '--port', String(port)], {
  stdio: 'inherit',
  env: { ...process.env, PORT: String(port) },
})

const forwardSignal = (signal) => child.kill(signal)
process.once('SIGINT', () => forwardSignal('SIGINT'))
process.once('SIGTERM', () => forwardSignal('SIGTERM'))
child.once('exit', (code, signal) => process.exit(code ?? (signal ? 1 : 0)))
