FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
COPY apps/dashboard/package.json apps/dashboard/package.json
RUN npm install

FROM deps AS build
COPY apps/dashboard apps/dashboard
RUN npm run build -w apps/dashboard

FROM nginx:alpine AS runner
COPY --from=build /app/apps/dashboard/dist /usr/share/nginx/html
