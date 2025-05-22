import puppeteer from 'puppeteer-core'
// import WebSocket from 'ws'

const ignTags = ['style', 'script', 'link', 'meta', 'head', 'header', 'title']
// C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe
const browser = await puppeteer.launch({
  executablePath: '/home/jdga/Apps/chrome-linux64/chrome',
  headless: false,
  ignoreHTTPSErrors: true,
  defaultViewport: null
  // args: ['--no-sandbox', '--disable-setuid-sandbox']
})
// const browserWSEndpoint = 'ws://127.0.0.1:9222/devtools/browser/78af481a-6348-4e9d-8c45-addaf6bdfed2'
// const browser = await puppeteer.connect({ browserWSEndpoint })
const pages = await browser.pages()
const page = pages.length ? pages[0] : await browser.newPage()

const endpoint = {
  id: 2,
  name: 'VM虚拟',
  icon: '',
  login: 'web',
  createdAt: '2025-05-20T09:11:04.000Z',
  updatedAt: '2025-05-20T09:11:04.000Z',
  pages: [
    {
      slots: [
        {
          key: -1,
          xpath: '/html/body/div[2]/a[1]',
          itype: 'click',
          value: '',
          valEnc: false
        }
      ],
      id: 2,
      url: 'https://38.152.0.181',
      createdAt: '2025-05-21T09:20:59.000Z',
      updatedAt: '2025-05-21T09:20:59.000Z',
      fkPages: 2
    }
  ]
}

let pIdx = 0
for (const i of Array.from({ length: pIdx + 1 }, (v, k) => k)) {
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
        waitUntil: 'networkidle0', // Remove the timeout
        timeout: 0
      })
    ])
  }
  await page.content()

  /** 遍历动作槽在页面上操作
   * @param {Unknown} page
   * @param {Unknown} pgInf
   * @param {Unknown} pIdx
   **/
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
  await page.waitForNavigation({ waitUntil: 'networkidle0' })
}

console.log(await page.title())

/** 遍历所有元素
 * @param {Any} array 集合
 * @returns {Any} 索引
 **/
let elements = []
for (const el of await page.$$('*')) {
  /** 执行递归生成元素xpath
   * @param {Unknown} el
   * @param {Unknown} ignTags
   * @param {Unknown} elements
   **/
  elements.push(
    await el.evaluate(function (el, ignTags) {
      const tagName = el.tagName.toLowerCase()
      const ret = {
        tagName,
        clazz: el.className,
        rectBox: el.getBoundingClientRect().toJSON()
      }
      if (ignTags.includes(tagName)) {
        return
      }
      if (el === document.body) {
        return { xpath: '/html/body', ...ret }
      }
      if (el.id !== '') {
        return { xpath: `//*[@id="${el.id}"]`, id: el.id, ...ret }
      }

      let index = 1
      const siblings =
        el.parentElement && el.parentElement.children ? el.parentElement.children : []
      for (const sibling of siblings) {
        if (sibling === el) {
          // 递归调用，获取父节点的 XPath 路径，然后拼接当前元素的标签名和索引
          const prtEl = arguments.callee(el.parentElement, ignTags)
          return prtEl
            ? {
                xpath: prtEl.xpath + `/${tagName}[${index}]`,
                ...ret
              }
            : undefined
        }

        if (sibling.nodeType === 1 && sibling.tagName === el.tagName) {
          index++ // 增加索引值
        }
      }
    }, ignTags)
  )
}

/** 生成元素节点树
 * @param {Unknown} elements
 * @returns {Unknown}
 **/
elements = elements.filter(el => el)
let treeData = []

/** 遍历元素，生成节点数
 * @param {Any} array 集合
 * @returns {Any} 索引
 **/
for (const element of elements) {
  /** 分解xpath以生成节点树
   * @param {Unknown} element
   * @param {Unknown} treeData
   * @returns {Unknown}
   * @returns {Unknown}
   * @returns {Unknown}
   **/
  const xpaths = element.xpath.split('/').filter(sec => sec)
  let subNodes = treeData
  let lastNode = null

  /** 分割xpath
   * @param {Any} array 集合
   * @returns {Any} 索引
   **/
  for (const [idx, xp] of xpaths.entries()) {
    /** 填入树节点
     * @param {Unknown} xp
     * @param {Unknown} idx
     * @param {Unknown} subNodes
     * @param {Unknown} xpaths
     * @param {Unknown} element
     **/
    lastNode = subNodes.find(nd => nd.title === xp)
    if (lastNode) {
      subNodes = lastNode.children || []
    } else {
      const prefix = xpaths[0].startsWith('*') ? '//' : '/'
      lastNode = {
        key: prefix + xpaths.slice(0, idx + 1).join('/'),
        title: xp,
        children: []
      }
      subNodes.push(lastNode)
      subNodes = lastNode.children
    }
  }

  /** 为最后节点添加元素信息
   * @param {Unknown} lastNode
   * @param {Unknown} element
   **/
  lastNode.element = element
}

console.log(treeData)

await page.waitForTimeout(10000)
await browser.close()
