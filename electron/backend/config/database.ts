/**
 * Database Configuration
 * Read from environment variables or use defaults
 */

export interface DatabaseConfig {
  type: 'mysql' | 'sqlite'
  host?: string
  port?: number
  database: string
  username: string
  password: string
}

export function getDatabaseConfig(): DatabaseConfig {
  const dbType = process.env.DB_TYPE || 'sqlite'

  if (dbType === 'mysql') {
    return {
      type: 'mysql',
      database: process.env.DB_DATABASE || 'login_platform',
      username: process.env.DB_USERNAME || 'root',
      password: process.env.DB_PASSWORD || '12345',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306', 10)
    }
  }

  return {
    type: 'sqlite',
    database: process.env.DB_DATABASE || 'account-manager.db',
    username: '',
    password: ''
  }
}
