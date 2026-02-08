import * as crypto from 'crypto'
import { getDatabase } from '../database/init'
import { getAccountModel } from '../models'
import { getSecret, sessionManager } from './session'

export async function sign(username: string, password: string) {
  username = username.toString()
  password = password.toString()
  const db = getDatabase()
  const Account = getAccountModel()
  const secret = getSecret()
  const hashedPassword = crypto.createHmac('sha256', secret).update(password).digest('hex')
  const tests = await db.select(Account, { username })
  console.log(tests)

  const accounts = await db.select(Account, { username, password: hashedPassword })

  if (!Array.isArray(accounts) || !accounts.length) {
    throw new Error('登录失败！用户名或密码错误')
  }

  const account = accounts[0]
  const sessionId = sessionManager.login(account.id, account.username)

  return {
    record: account,
    sessionId,
    message: '登录成功！'
  }
}

export async function verify(sessionId: string) {
  const session = sessionManager.verify(sessionId)
  if (!session) {
    throw new Error('未登录或会话已过期')
  }
  return session
}

export async function getPubKey(userId: number) {
  const db = getDatabase()
  const Account = getAccountModel()
  const account = await db.select(Account, { _index: userId })
  return account?.publicKey
}

export async function register(username: string, password: string) {
  username = username.toString()
  password = password.toString()
  const db = getDatabase()
  const Account = getAccountModel()
  const secret = getSecret()
  const hashedPassword = crypto.createHmac('sha256', secret).update(password).digest('hex')

  const existingAccounts = await db.select(Account, { username })
  if (Array.isArray(existingAccounts) && existingAccounts.length) {
    throw new Error('用户名已存在！')
  }

  const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
  })

  const account = await db.save(Account, {
    username,
    password: hashedPassword,
    role: 'user',
    publicKey,
    privateKey
  })

  const sessionId = sessionManager.login(account.id, account.username)

  return {
    record: account,
    sessionId,
    message: '注册成功！'
  }
}
