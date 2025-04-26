import { app, BrowserWindow, ipcMain } from 'electron'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import puppeteer from 'puppeteer-core'
import { spawn } from 'child_process'

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

function createWindow() {
  win = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC, 'electron-vite.svg'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  })

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

  ipcMain.handle('login-page', async (_e, sPgInfo, sChrome) => {
    const pgInfo = JSON.parse(sPgInfo)
    switch (pgInfo.login) {
      case 'web':
        {
          const chrome = JSON.parse(sChrome)
          const browser = await puppeteer.launch({
            executablePath: chrome.execPath,
            args: ['--start-maximized'],
            headless: false
          })
          const pages = await browser.pages()
          let page = null
          if (pages.length) {
            page = pages[0]
          } else {
            page = await browser.newPage()
          }
          await page.goto(pgInfo.url, { waitUntil: 'networkidle0' })

          for (const slot of pgInfo.slots) {
            const ele = await page.waitForXPath(slot.xpath)
            switch (slot.itype) {
              case 'input':
                await ele?.type(slot.value)
                break
              case 'click':
                await ele?.click()
                break
            }
          }

          browser.disconnect()
        }
        break
      case 'ssh':
        {
          const [host, port] = pgInfo.url.split(':')
          const usrSlot = pgInfo.slots.find((slot: any) => slot.xpath === 'username')
          const username = usrSlot ? usrSlot.value : 'root'
          const pwdSlot = pgInfo.slots.find((slot: any) => slot.xpath === 'password')
          const password = pwdSlot ? pwdSlot.value : undefined
          // echo y | plink.exe -C -ssh -legacy-stdio-prompts -pw 12345 -P 2022 op@124.28.221.82
          spawn(
            'cmd',
            [
              '/K',
              'wsl',
              [
                'sshpass',
                password ? `-p ${password}` : '',
                'ssh -o StrictHostKeyChecking=no',
                `-p ${port || 22}`,
                `${username}@${host}`
              ].join(' ')
            ],
            {
              detached: true,
              shell: true
            }
          )
        }
        break
    }
  })
}

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.whenReady().then(createWindow)
