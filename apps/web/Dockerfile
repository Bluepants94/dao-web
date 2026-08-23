FROM node:22-alpine

WORKDIR /app

COPY package.json ./package.json
COPY package-lock.json ./package-lock.json
COPY apps/server/package.json ./apps/server/package.json
COPY apps/web/package.json ./apps/web/package.json
COPY packages/game-rules/package.json ./packages/game-rules/package.json
COPY packages/shared/package.json ./packages/shared/package.json

RUN npm ci --workspaces --include-workspace-root

COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev", "--workspace", "@cultivation/web", "--", "--host", "0.0.0.0"]
