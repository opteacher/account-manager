import puppeteer from 'puppeteer-core'

export async function colcElements(ctx) {
  try {
    /** 打开页面，配置好全局变量
     * @param {Unknown} ctx
     * @returns {Unknown}
     * @returns {Unknown}
     * @returns {Unknown}
     * @returns {Unknown}
     **/
    const browser = await puppeteer.launch({
      executablePath: '/home/jdga/Apps/chrome-linux64/chrome',
      headless: false,
      ignoreHTTPSErrors: true,
      defaultViewport: null,
      args: [
        "--proxy-server='direct://'",
        '--proxy-bypass-list=*',
        '--disable-gpu',
        '--disable-dev-shm-usage',
        '--disable-setuid-sandbox',
        '--no-first-run',
        '--no-sandbox',
        '--no-zygote',
        '--single-process',
        '--ignore-certificate-errors',
        '--ignore-certificate-errors-spki-list',
        '--enable-features=NetworkService'
      ]
    })
    const page = await browser.newPage()
    await page.setViewport({
      width: ctx.request.query.width ? parseInt(ctx.request.query.width) : 800,
      height: ctx.request.query.height ? parseInt(ctx.request.query.height) : 600
    })
    page.setDefaultTimeout(300000)
    const ignTags = ['style', 'script', 'link', 'meta', 'head', 'header', 'title']
    let elements = []

    // 判断是URL页面还是登录端页面
    if (ctx.request.query.url) {
      /** 跳转URL页面
       * @param {Unknown} ctx
       * @param {Unknown} page
       **/
      await Promise.all([
        page.waitForNavigation(),
        page.goto(ctx.request.query.url, {
          waitUntil: 'networkidle0', // Remove the timeout
          timeout: 0
        })
      ])
      await page.content()
    } else if (ctx.request.query.endpoint) {
      /** 查询登录端和指定页面
       * @param {Unknown} ctx
       * @param {Unknown} page
       * @returns {Unknown}
       * @returns {Unknown}
       **/
      let [eid, pIdx] = ctx.request.query.endpoint.split('_')
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
          },
          {
            slots: [
              {
                key: -1,
                xpath: '/html/body/div[2]/a[1]',
                itype: 'click',
                value: '',
                valEnc: false
              },
              {
                key: -1,
                xpath: '//*[@id="username"]',
                itype: 'input',
                value: 'administrator@vsphere.local',
                valEnc: false
              },
              {
                key: -1,
                xpath: '//*[@id="password"]',
                itype: 'input',
                value: {
                  type: 'Buffer',
                  data: [
                    28, 25, 26, 191, 255, 134, 230, 123, 61, 192, 249, 139, 182, 230, 235, 205, 42,
                    97, 106, 172, 198, 163, 193, 161, 2, 43, 13, 85, 226, 18, 170, 172, 23, 91, 98,
                    65, 74, 113, 150, 76, 20, 220, 96, 66, 227, 166, 107, 97, 3, 137, 71, 7, 172,
                    253, 199, 58, 16, 169, 60, 133, 10, 160, 5, 132, 89, 140, 200, 223, 40, 36, 158,
                    123, 81, 182, 36, 198, 92, 72, 4, 148, 158, 246, 43, 81, 125, 18, 230, 100, 8,
                    217, 144, 33, 215, 84, 158, 91, 93, 63, 33, 25, 14, 190, 115, 46, 194, 147, 58,
                    196, 69, 82, 223, 86, 161, 161, 206, 232, 155, 180, 77, 103, 35, 165, 134, 163,
                    214, 231, 185, 67, 226, 119, 23, 168, 223, 40, 217, 180, 73, 26, 114, 136, 202,
                    116, 115, 107, 71, 215, 0, 109, 124, 74, 41, 31, 231, 233, 115, 236, 62, 193,
                    47, 234, 2, 85, 241, 135, 42, 83, 217, 131, 223, 173, 5, 174, 171, 141, 115, 8,
                    89, 86, 70, 127, 172, 146, 139, 232, 25, 140, 158, 5, 247, 174, 64, 81, 50, 51,
                    37, 117, 155, 80, 8, 98, 114, 253, 143, 16, 113, 41, 90, 49, 34, 183, 3, 174,
                    234, 132, 79, 108, 25, 226, 215, 93, 55, 120, 17, 93, 102, 188, 39, 25, 100,
                    169, 148, 33, 238, 152, 110, 142, 34, 8, 72, 110, 32, 30, 151, 8, 178, 77, 241,
                    4, 126, 6, 84, 237, 168, 110, 197, 114
                  ]
                },
                valEnc: true
              },
              {
                key: -1,
                xpath: '//*[@id="submit"]',
                itype: 'click',
                value: '',
                valEnc: false
              }
            ],
            id: 3,
            url: 'https://38.152.0.181',
            createdAt: '2025-05-22T07:51:02.000Z',
            updatedAt: '2025-05-22T07:51:02.000Z',
            fkPages: 2
          }
        ]
      }
      pIdx = parseInt(pIdx)
      pIdx = isNaN(pIdx) ? endpoint.pages.length - 1 : pIdx
      console.log(pIdx)

      /** 获取当前用户的公钥
       * @param {Unknown} ctx
       * @returns {Unknown}
       **/
      const pubKey =
        '-----BEGIN PUBLIC KEY----- MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAtphwq249G+JVSgiycc5Q xy8K+E6GwL6JwOl+EWSiOtc1AhnV1PrvIReKhuX5yk/a73I/wDbS3100mhcQX7CH PPZFfxxiZoF8jggOxVERND0hqOm70rfM+od+/AEC4ecoe94ieBR3b7CUNIuaFY3J okBJCK1KKzN8E7dmiKNsQ7OPCZUc24kS+a3TsMlT0GKyCZVATchz4WKv/Y9TfJJq rEAWhEkyiohyxsBW2igCtgZn2nc87oE7KH+71uukbMdjBfxBy+iKn+f4IhcQ0CV1 nqbLxcxbjQ+JsDqmBRr/MyjEpDu7pRjPwf9jrWwG45CrYk1gvuqWlzBB2WbhTt2K RwIDAQAB -----END PUBLIC KEY----- '

      /** 跳转到指定页面
       * @param {Any} array 集合
       * @returns {Any} 索引
       **/
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
        if (i === pIdx) {
          // 如果已到达当前页面，则不做操作跳出循环
          break
        }
        for (const slot of pgInf.slots) {
          const ele = await page.waitForXPath(slot.xpath)
          switch (slot.itype) {
            case 'input':
              await ele?.type(
                slot.valEnc ? crypto.publicDecrypt(pubKey, slot.value).toString('utf8') : slot.value
              )
              break
            case 'click':
              await ele?.click()
              break
          }
        }
        await page.waitForNavigation({ waitUntil: 'networkidle0' })
      }
    }

    /** 遍历所有元素
     * @param {Any} array 集合
     * @returns {Any} 索引
     **/
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

    /** 关闭浏览器
     * @param {Unknown} browser
     * @param {Unknown} elements
     * @param {Unknown} treeData
     **/
    await browser.close()
    return { elements, treeData }
  } catch (e) {
    console.error(e)
    ctx.throw(400, e.message || JSON.stringify(e))
  }
}

console.log(
  await colcElements({
    request: {
      query: {
        endpoint: '2_1'
      }
    },
    throw(_code, msg) {
      throw new Error(msg)
    }
  })
)
