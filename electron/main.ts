import { app, BrowserWindow, ipcMain } from 'electron'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import puppeteer from 'puppeteer-core'
import crypto from 'node:crypto'
import axios from 'axios'
import * as ChromeLauncher from 'chrome-launcher'
import { spawnSync } from 'node:child_process'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.mjs
// │
process.env.APP_ROOT = path.join(__dirname, '..')

// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, 'public')
  : RENDERER_DIST

let win: BrowserWindow | null

function execCmd(cmd: string) {
  switch (process.platform) {
    case 'win32':
      // echo y | plink.exe -C -ssh -legacy-stdio-prompts -pw 12345 -P 2022 op@124.28.221.82
      spawnSync('cmd', ['/K', 'wsl', cmd], { shell: true })
      break
    case 'linux':
      spawnSync('deepin-terminal', ['-e', 'bash', '-c', `"${cmd}; exec bash"`], {
        shell: true
      })
      break
  }
}

async function createWindow() {
  win = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC, 'electron-vite.svg'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      webviewTag: true
    }
  })
  win.maximize()

  // Test active push message to Renderer-process.
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', new Date().toLocaleString())
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    // win.loadFile('dist/index.html')
    win.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }

  console.log('createWindow called, registering IPC handlers...')
  try {
    const { registerAllIPCHandlers } = await import('./backend/ipc')
    registerAllIPCHandlers()
    console.log('IPC handlers registered successfully')
  } catch (error: any) {
    console.error('Failed to register IPC handlers:', error.message)
  }

  ipcMain.handle('detect-chrome', () => {
    return ChromeLauncher.Launcher.getInstallations()
  })
  ipcMain.handle('login-endpoint', async (_e, sEpInfo, sChrome) => {
    const epInfo = JSON.parse(sEpInfo)
    switch (epInfo.login) {
      case 'web':
        {
          const chrome = JSON.parse(sChrome)
          const browser = await puppeteer.launch({
            executablePath: chrome.chromeExecPath,
            ignoreHTTPSErrors: true,
            defaultViewport: null,
            args: ['--start-maximized', '--disable-blink-features=IdleDetection'],
            ignoreDefaultArgs: ['--enable-automation'],
            headless: false
          })
          const pages = await browser.pages()
          let page = null
          if (pages.length) {
            page = pages[0]
          } else {
            page = await browser.newPage()
          }

          for (const pgInfo of epInfo.pages) {
            if (pgInfo.url) {
              await page.goto(pgInfo.url, { waitUntil: 'networkidle0' })
            }

            for (const slot of pgInfo.slots) {
              const ele = await page.waitForXPath(slot.element.xpath)
              await page.waitForTimeout(typeof slot.timeout !== 'undefined' ? slot.timeout : 200)
              switch (slot.otype) {
                case 'input':
                  await ele?.type(slot.value)
                  break
                case 'click':
                  await ele?.click()
                  break
              }
            }
          }
          browser.disconnect()
        }
        break
      case 'ssh':
        {
          const pgInfo = epInfo.pages[0]
          const [host, port] = pgInfo.url.split(':')
          const usrSlot = pgInfo.slots.find((slot: any) => slot.element.xpath === 'username')
          const username = usrSlot ? usrSlot.value : 'root'
          const pwdSlot = pgInfo.slots.find((slot: any) => slot.element.xpath === 'password')
          const password = pwdSlot ? pwdSlot.value : undefined
          execCmd(
            [
              'sshpass',
              password ? `-p ${password}` : '',
              'ssh -o StrictHostKeyChecking=no',
              `-p ${port || 22}`,
              `${username}@${host}`
            ]
              .filter(cmd => cmd)
              .join(' ')
          )
        }
        break
    }
  })
  ipcMain.handle('upload-file', async (_e, sEpInfo, sFileInfo) => {
    const epInfo = JSON.parse(sEpInfo)
    const pgInfo = epInfo.pages[0]
    const [host, port] = pgInfo.url.split(':')
    const usrSlot = pgInfo.slots.find((slot: any) => slot.element.xpath === 'username')
    const username = usrSlot ? usrSlot.value : 'root'
    const pwdSlot = pgInfo.slots.find((slot: any) => slot.element.xpath === 'password')
    const password = pwdSlot ? pwdSlot.value : undefined
    const flInfo = JSON.parse(sFileInfo)
    if (flInfo.coverExists) {
      execCmd(
        [
          'sshpass',
          password ? `-p ${password}` : '',
          `ssh ${username}@${host}`,
          `"rm ${flInfo.isFolder ? '-r' : ''}`,
          `/${flInfo.destPath.join('/')}"`
        ]
          .filter(cmd => cmd)
          .join(' ')
      )
    }
    execCmd(
      [
        'sshpass',
        password ? `-p ${password}` : '',
        'scp -o StrictHostKeyChecking=no',
        `-P ${port || 22}`,
        flInfo.isFolder ? '-r' : '',
        process.platform === 'win32'
          ? flInfo.localPath
              .replaceAll('\\', '/')
              .replace(/(\w)\:/, (_m: string, p: string) => `/mnt/${p.toLowerCase()}`)
          : flInfo.localPath,
        `${username}@${host}:/${flInfo.destPath.join('/')}`
      ]
        .filter(cmd => cmd)
        .join(' ')
    )
  })
  ipcMain.handle('decode-value', async (_e, tkn, buf) => {
    try {
      for (const url of [
        import.meta.env.VITE_HLW_URL,
        import.meta.env.VITE_GAW_URL,
        import.meta.env.VITE_GZW_URL
      ]) {
        try {
          await axios.get(url, { timeout: 1000 })
        } catch (e: any) {
          if (e.status) {
            axios.defaults.baseURL = e.config.url
            break
          }
        }
      }

      const resp = await axios.get(`/${import.meta.env.VITE_PJT}/api/v1/account/public-key`, {
        headers: { Authorization: 'Bearer ' + tkn }
      })

      if (resp.status !== 200) {
        throw new Error(resp.statusText + JSON.stringify(resp.data))
      }

      const resultBuf = Buffer.from(resp.data.result)
      const bufParsed = JSON.parse(buf as string)
      const bufBuffer = typeof bufParsed === 'string' ? Buffer.from(bufParsed) : bufParsed

      return crypto
        .publicDecrypt(resultBuf, bufBuffer)
        .toString('utf8')
    } catch (error: any) {
      throw error
    }
  })
}

app.commandLine.appendSwitch('--ignore-certificate-errors', 'true')

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

app.on('activate', async () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    await createWindow()
  }
})

app.whenReady().then(async () => {
  try {
    const { initializeBackend } = await import('./backend/database/init')
    await initializeBackend()
    console.log('Database initialized')
  } catch (error: any) {
    console.error('Failed to initialize database:', error.message)
  }
  createWindow()
})
