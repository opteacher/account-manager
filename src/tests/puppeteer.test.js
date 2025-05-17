import puppeteer from 'puppeteer-core'
// import WebSocket from 'ws'

const ignTags = ['style', 'script', 'link', 'meta', 'head', 'header', 'title']
const browser = await puppeteer.launch({
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  headless: false
  // args: ['--no-sandbox', '--disable-setuid-sandbox']
})
// const browserWSEndpoint = 'ws://127.0.0.1:9222/devtools/browser/78af481a-6348-4e9d-8c45-addaf6bdfed2'
// const browser = await puppeteer.connect({ browserWSEndpoint })
const page = await browser.newPage()
let width = 990,
  height = 550
await page.setViewport({
  width,
  height
})

const endpoint = {"key":1,"name":"hotmail","icon":"","login":"web","pages":[{"key":4,"url":"http://124.28.221.82:8096","slots":[{"key":-1,"xpath":"//*[@id=\"txtManualName\"]","itype":"input","value":"zjc","valEnc":false},{"key":-1,"xpath":"//*[@id=\"txtManualPassword\"]","itype":"input","value":"zjc","valEnc":true},{"key":-1,"xpath":"//*[@id=\"loginPage\"]/div[1]/form[1]/button[1]","itype":"click","value":"","valEnc":false}]}]}
let pIdx = 0
for  (const i of Array.from({ length: endpoint.pages }, (v, k) => k)) {
  
  /** 跳转页面（如果需要）
   * @param {Unknown} page 
   * @param {Unknown} i 
   * @param {Unknown} endpoint 
   * @returns {Unknown} 
  **/
  const pgInf = endpoint.pages[i]
  if (pgInf.url) {
    await Promise.all([
      page.waitForNavigation(),
      page.goto(pgInf.url, {
        waitUntil: 'load', // Remove the timeout
        timeout: 0
      })
    ])
  }
  await page.content()
  await page.waitForNetworkIdle()

  /** 遍历动作槽在页面上操作
   * @param {Unknown} page 
   * @param {Unknown} pgInf 
   * @param {Unknown} pIdx 
  **/
  if (i === pIdx) {
    // 如果是指定的页面，则不做页面操作
    break
  }
  for (const slot of pgInf.slots) {
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

}

await page.waitForTimeout(10000)
await browser.close()