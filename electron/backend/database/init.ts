import { MySQL } from './mysql'
import { SQLite } from './sqlite'
import { defineAllModels } from '../models'
import { getDatabaseConfig } from '../config'

let currentDB: MySQL | SQLite | null = null
let currentDBType: 'mysql' | 'sqlite' = 'sqlite'

export async function initializeBackend() {
  const config = getDatabaseConfig()

  if (config.type === 'mysql') {
    currentDB = new MySQL(config)
    currentDB.connect()
    currentDBType = 'mysql'
  } else {
    currentDB = new SQLite(config)
    await currentDB.connect()
    currentDBType = 'sqlite'
  }

  defineAllModels(currentDB)
  console.log('Backend initialized successfully with', currentDBType)
  return currentDB
}

export function getDatabase(): any {
  if (!currentDB) {
    throw new Error('Database not initialized. Call initializeBackend() first.')
  }
  return currentDB
}

export function getDatabaseType(): 'mysql' | 'sqlite' {
  return currentDBType
}

export { getAllModels } from '../models'
