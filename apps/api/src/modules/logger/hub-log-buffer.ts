interface LogEntry {
  timestamp: string
  level: string
  message: string
  context?: string
  data?: Record<string, unknown>
}

export class HubLogBuffer {
  private buffer: LogEntry[] = []
  private timer: ReturnType<typeof setInterval> | null = null
  private flushing = false

  constructor(
    private readonly hubUrl: string,
    private readonly serviceKey: string,
    private readonly batchSize = 100,
    flushIntervalMs = 5000,
  ) {
    this.timer = setInterval(() => this.flush(), flushIntervalMs)

    // Graceful shutdown — best-effort flush before exit
    const onExit = () => {
      if (this.timer) clearInterval(this.timer)
      this.timer = null
      // Fire-and-forget: signal handlers cannot await, but fetch will
      // attempt to complete before the process exits
      this.flush()
    }
    process.on('SIGTERM', onExit)
    process.on('SIGINT', onExit)
  }

  push(level: string, message: string, context?: string, data?: Record<string, unknown>): void {
    this.buffer.push({
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      data,
    })
    // Batch-size trigger is a no-op if a flush is already in progress;
    // those logs will be picked up by the next interval-based flush
    if (this.buffer.length >= this.batchSize) {
      this.flush()
    }
  }

  private async flush(): Promise<void> {
    if (this.flushing || this.buffer.length === 0) return
    this.flushing = true

    const batch = this.buffer.splice(0)

    try {
      await fetch(`${this.hubUrl}/api/logs/ingest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Hub-Service-Key': this.serviceKey,
        },
        body: JSON.stringify({ logs: batch }),
        signal: AbortSignal.timeout(5000),
      })
    } catch {
      // Silently ignore — Hub unreachable, don't crash the app
    } finally {
      this.flushing = false
    }
  }

  async destroy(): Promise<void> {
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
    await this.flush()
  }
}
