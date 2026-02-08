const mysql = require('mysql2/promise')

const config = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || 'account123',
  database: process.env.DB_DATABASE || 'login_platform'
}

async function testConnection() {
  console.log('=== 数据库连接测试 ===')
  console.log('配置信息：')
  console.log(`  主机：${config.host}`)
  console.log(`  端口：${config.port}`)
  console.log(`  用户：${config.user}`)
  console.log(`  数据库：${config.database}`)
  console.log()

  try {
    const connection = await mysql.createConnection(config)
    console.log('✅ 数据库连接成功！')
    
    const [rows] = await connection.query('SELECT 1 AS test')
    console.log(`✅ 查询测试成功，结果：${rows[0].test}`)
    
    await connection.end()
    console.log('✅ 连接已关闭')
    console.log()
    console.log('=== 测试结果 ===')
    console.log('✅ 数据库连接正常，Electron 应用可以正常启动')
    console.log()
    console.log('提示：')
    console.log('- 运行 npm run dev 启动 Electron 应用')
    console.log('- 使用 admin / account123 登录（密钥已在 init.sql 中设置）')
    console.log('- 数据库表将由 Sequelize 自动创建（在首次运行时）')
  } catch (error) {
    console.error('❌ 数据库连接失败：', error.message)
    console.error()
    console.error('请检查：')
    console.error('1. MySQL 容器是否正常运行：')
    console.error('   运行：docker ps | grep mysql')
    console.error()
    console.error('2. 数据库端口是否可访问：')
    console.error('   Windows: netstat -an | findstr ":3306"')
    console.error('   Linux/Mac: netstat -an | grep ":3306"')
    console.error()
    console.error('3. 环境变量是否正确：')
    console.error('   检查 .env 文件内容')
    console.error()
    console.error('4. Windows 用户可能需要重启系统加载环境变量')
    console.error()
    process.exit(1)
  }
}

testConnection()

