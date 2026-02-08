# 数据库部署完成总结

## 已完成的工作

### 1. Docker 部署 ✅
- 创建了 `docker-compose.dev.yml` 配置文件
- MySQL 8.0 容器已启动并运行
- 数据库 `login_platform` 已创建
- 数据持久化存储在 Docker volume `mysql-data`
- 端口映射：`3306:3306`

### 2. 环境变量配置 ✅
- `.env` 文件已更新，包含数据库连接信息：
  ```env
  DB_DATABASE=login_platform
  DB_USERNAME=root
  DB_PASSWORD=account123
  DB_HOST=localhost
  DB_PORT=3306
  SERVER_SECRET=account-manager-secret-key-change-in-production
  VITE_PJT=login_platform
  ```

### 3. 数据库连接测试 ✅
- 测试脚本 `test-db-connection.js` 已创建
- 连接测试通过：`SELECT 1 AS test` 返回正确结果

## 数据库架构说明

### 已创建的表结构
- `account` - 用户账户表（用户名、密码、公钥、私钥）
- `endpoint` - 端点表（名称、图标、登录方式）
- `page` - 页面表（URL、元素配置）
- `record` - 访问记录表（IP地址）
- `endpoint_pages` - 端点-页面关联表

### 测试账户
- 用户名：`admin`
- 密码：`admin123`
- 密钥已在 `init.sql` 中设置

## 使用建议

### 开发环境

1. 启动 MySQL 容器（如果未启动）：
   ```bash
   docker compose -f docker-compose.dev.yml up -d
   ```

2. 运行数据库连接测试：
   ```bash
   node test-db-connection.js
   ```
   
   应看到：`✅ 数据库连接成功！`

3. 启动 Electron 应用：
   ```bash
   npm run dev
   ```

4. 登录应用：
   - 用户名：`admin`
   - 密码：`admin123`

### 生产环境

1. 修改密码：
   - 不要在生产环境使用 `account123` 密码
   - 在 `.env` 中设置强密码
   - 更新 MySQL root 密码

2. 数据备份：
   ```bash
   docker exec account-manager-mysql mysqldump -u root -paccount123 login_platform > backup.sql
   ```

3. 持久化数据：
   - Docker volume `mysql-data` 会持久化数据
   - 即使容器删除重建，数据仍然保留

4. 日志查看：
   ```bash
   docker logs account-manager-mysql
   ```

### 常见问题排查

#### 问题1：连接被拒绝
**症状**：`Access denied for user 'root'@'localhost'`
**解决**：
- 检查 MySQL 容器日志：`docker logs account-manager-mysql`
- 确认 `DB_PASSWORD` 和 MySQL root 密码一致
- 重启 MySQL 容器：`docker restart account-manager-mysql`

#### 问题2：端口被占用
**症状**：`bind: address already in use`
**解决**：
```bash
# 检查占用进程
netstat -ano | findstr ":3306"

# 或
lsof -i :3306

# 停止占用进程后重启容器
docker restart account-manager-mysql
```

#### 问题3：环境变量未生效
**症状**：`Cannot read properties of undefined (reading 'DB_HOST')`
**解决**：
- Windows 需要重启 Electron 应用或终端以加载新环境变量
- Linux/Mac 可以直接使用 `.env` 文件

#### 问题4：Sequelize 同步表失败
**症状**：连接正常但表未创建
**解决**：
- 检查 `init.sql` 语法是否正确
- 手动执行初始化：
```bash
docker exec -i account-manager-mysql mysql -u root -paccount123 login_platform < mysql-init/init.sql
```

### 数据库管理

#### 查看所有表
```bash
docker exec -i account-manager-mysql mysql -u root -paccount123 login_platform
```

#### 导出数据库
```bash
docker exec account-manager-mysql mysqldump -u root -paccount123 login_platform > backup.sql
```

#### 导入数据库
```bash
docker exec -i account-manager-mysql mysql -u root -paccount123 login_platform < backup.sql
```

#### 完全清空数据库
```bash
docker exec -i account-manager-mysql mysql -u root -paccount123 -e "DROP DATABASE IF EXISTS login_platform; CREATE DATABASE login_platform;"
```

### 表结构参考

#### Account 表
```sql
CREATE TABLE account (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'user',
  privateKey BLOB,
  publicKey BLOB,
  createdAt DATETIME,
  updatedAt DATETIME
)
```

#### Endpoint 表
```sql
CREATE TABLE endpoint (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  icon VARCHAR(255),
  login VARCHAR(50),
  createdAt DATETIME,
  updatedAt DATETIME
)
```

#### Page 表
```sql
CREATE TABLE page (
  id INT AUTO_INCREMENT PRIMARY KEY,
  url LONGTEXT,
  slots JSON,
  createdAt DATETIME,
  updatedAt DATETIME
)
```

#### Record 表
```sql
CREATE TABLE record (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ip VARCHAR(255),
  createdAt DATETIME,
  updatedAt DATETIME
)
```

### 下一步

1. 运行 `npm run dev` 启动应用
2. 测试登录功能（用户名：admin，密码：admin123）
3. Sequelize 会自动在首次启动时同步表结构
4. 添加测试端点和页面数据
