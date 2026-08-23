# 修仙文字游戏

这是一个基于 TypeScript 的纯文字修仙网页游戏 Monorepo（多包仓库）基础配置。

## 项目结构

- `apps/server`：Fastify 服务端应用。
- `apps/web`：React 网页应用。
- `packages/game-rules`：游戏规则包，后续实现数值公式与校验。
- `packages/shared`：前后端共享类型。

## 启动

游戏统一由 Docker Compose（容器编排）控制。首次启动前复制环境变量模板：

```bash
cp .env.example .env
docker compose up --build
```

Windows PowerShell 可使用：

```powershell
Copy-Item .env.example .env
docker compose up --build
```

默认端口：网页端 `5173`、服务端 `3000`、Postgres `5432`。网页端通过 `VITE_API_URL` 访问服务端，服务端 CORS 来源配置为 `CORS_ORIGIN=http://localhost:5173`。

停止服务并移除容器：

```bash
docker compose down
```

查看实时日志或指定服务日志：

```bash
docker compose logs -f
docker compose logs -f server
```

## 测试、构建与检查

```bash
npm test
npm run build
npm run lint
```

镜像构建会依据根目录 `package-lock.json` 在容器内使用 `npm ci` 安装依赖，确保 workspace 依赖可复现；本地不需要执行 `npm install`。

## 数据库

Compose 会启动 Postgres 16，并通过 `postgres-data` 命名卷持久化数据。服务端仅在 Postgres 健康检查通过后启动，然后先执行数据库迁移，再启动开发服务器：

```bash
npm run db:migrate --workspace @cultivation/server
npm run dev --workspace @cultivation/server
```

迁移命令失败时，服务端容器会直接退出，不会启动开发服务器；网页端依赖服务端容器启动。网页端 API 地址使用 `VITE_API_URL` 配置。

数据库连接信息与 CORS 配置通过 `.env` 注入，模板见 [.env.example](./.env.example)。不要提交包含真实凭据的 `.env` 文件。

停止并删除容器，但保留数据库卷：

```bash
docker compose down
```

重置数据库（会删除本地 Postgres 数据）：

```bash
docker compose down -v
```

## CodeGraph

仓库使用 CodeGraph（代码图谱）维护代码结构索引：

```bash
codegraph index
codegraph explore "<文件名或符号名>"
```

`.codegraph/` 已加入 `.gitignore`，索引文件仅用于本地开发。
