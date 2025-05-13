# 网页、SSH账号管理器
保存各平台账号及登录方式，对秘钥进行加密保存。
## 生产打包
### 使用前环境调整
#### 后台部署
* 将后台`login_platform`从`server-package`中导出，导入到生产服务器的docker中。
* 构建`ttyd`镜像：`docker build -t ssh/ttyd:latest ./ttyd/`，并一同导入生产服务器docker。
   > `ttyd`用于ssh在electron界面上展示命令行，是命令行在前端页面展示的技术。
* 将`chrome-linux64`放到指定目录，从[chromedriver](https://chromedriver.storage.googleapis.com/index.html)下载对应的chrome版本。
* 启动login_platform和ttyd
   ```yaml
   service:
      login_platform:
         image: login_platform
         container_name: login_platform
         restart: always
         privileged: true
         networks:
            - middles
         ports:
            - 8051:8051
         volumes:
            -  /root/chrome-linux64:/app/puppeteer/chrome-linux
      ttyd:
         image: ssh/ttyd
         container_name: ttyd
         restart: always
         privileged: true
         ports:
            - 7681:7681
         command: ttyd -p 7681 -W -a bash

   # 配置外部网络，确保外部网络中有运行中的mysql容器
   networks:
      middles:
         name: middles
         external: true
   ```
#### 安装sshpass
`sshpass`用于SSH明密登录，由于是electron帮助用户登录SSH，密码需在登录时一并给出。该程序只有Linux版本，所以Windows平台需要在WSL子系统中安装（Windows需先有WSL子系统）。从[pkgs.org](https://pkgs.org/download/sshpass)下载对应安装包。
### 打包时注意点
* 由于网路问题，打包可能卡在下载github上的各类工具包
   * **解决方法**：打包时会打印下载的工具包地址，可以外部下载好后放到electron的缓存目录
   * `Windows`系统在：`%USERPROFILE%\AppData\Local\electron[-builder]\Cache\`
   * 注意下载的工具需要解压，并放到正确的目录（下载过程中，构建工具会在Cache目录创建对应的文件夹）
## 开发部署
## 常见问题
* Linux安装deb无法启动，调用unpacked下可执行文件报chrome-sandbox出错问题
   `FATAL:setuid_sandbox_host.cc(158)] The SUID sandbox helper binary was found, but is not configured correctly. Rather than run without sandboxing I'm aborting now. You need to make sure that /tmp/.mount_AnotheUExhKn/chrome-sandbox is owned by root and has mode 4755.`
   * 该问题为使用Electron给软件打包时产生的错误，是Linux内核的user_namespaces没有自动打开的问题。
   * **解决方法** 开机时自启动用户名称空间：`sudo echo 'kernel.unprivileged_userns_clone=1' > /etc/sysctl.d/userns.conf && sudo  sysctl -p`