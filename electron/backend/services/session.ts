import * as crypto from 'crypto'

export function getSecret(): string {
  return process.env.SERVER_SECRET || 'your-secret-key-change-in-production'
}

export function getServerInfo() {
  return {
    secret: getSecret(),
    admin: process.env.ADMIN || 'admin'
  }
}

class SessionManager {
  private sessions = new Map<string, { userId: number; username: string }>()
  
  login(userId: number, username: string): string {
    const sessionId = crypto.randomBytes(16).toString('hex')
    this.sessions.set(sessionId, { userId, username })
    return sessionId
  }
  
  verify(sessionId: string) {
    return this.sessions.get(sessionId)
  }
  
  logout(sessionId: string) {
    this.sessions.delete(sessionId)
  }
}

export const sessionManager = new SessionManager()
