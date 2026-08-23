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

RUN npx tsc --target ES2022 --module NodeNext --moduleResolution NodeNext --declaration --outDir packages/game-rules/dist --skipLibCheck packages/game-rules/src/*.ts

EXPOSE 3000

CMD ["sh", "-c", "npm run db:migrate --workspace @cultivation/server && exec npm run dev --workspace @cultivation/server"]
