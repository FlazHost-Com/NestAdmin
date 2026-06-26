import { DataSource, DataSourceOptions } from 'typeorm'
import * as dotenv from 'dotenv'
import { join } from 'path'

dotenv.config()

// 'sqlite' in env maps to 'better-sqlite3' (TypeORM CLI driver name)
const rawType = process.env.DB_TYPE || 'sqlite'
const dbType = (rawType === 'sqlite' ? 'better-sqlite3' : rawType) as any
const isSqlite = dbType === 'better-sqlite3'

const baseOptions: DataSourceOptions = {
  type: dbType,
  ...(isSqlite
    ? { database: process.env.DB_NAME === ':memory:' ? ':memory:' : join(process.cwd(), process.env.DB_NAME || 'nestadmin.sqlite') }
    : {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '3306'),
        username: process.env.DB_USER || 'root',
        password: process.env.DB_PASS || '',
        database: process.env.DB_NAME || 'nestadmin',
      }),
  entities: [join(__dirname, '../modules/**/*.entity{.ts,.js}')],
  migrations: [join(__dirname, '../modules/**/migrations/*{.ts,.js}')],
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
}

export default new DataSource(baseOptions)
