FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
COPY backend/package.json backend/package.json
RUN npm install

FROM deps AS build
COPY backend backend
RUN npm run build -w backend

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/node_modules node_modules
COPY --from=build /app/backend/dist backend/dist
COPY --from=build /app/backend/prisma backend/prisma
COPY --from=build /app/backend/package.json backend/package.json
CMD ["node", "backend/dist/src/server.js"]
