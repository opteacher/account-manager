/**
 * Secret Configuration
 */

export function getSecret(): string {
  return process.env.SERVER_SECRET || 'your-secret-key-change-in-production'
}

export function getServerInfo() {
  return {
    secret: getSecret(),
    admin: process.env.ADMIN || 'admin'
  }
}
