FROM node:22-bookworm-slim AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY package*.json ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
RUN npm ci
COPY tsconfig.base.json ./
COPY apps ./apps
ARG API_INTERNAL_URL=http://api:4000
ENV API_INTERNAL_URL=$API_INTERNAL_URL
RUN npm run build && chown -R node:node /app/apps/web/.next
FROM build AS runtime
RUN npm prune --omit=dev --ignore-scripts --no-audit
FROM runtime AS api
USER node
EXPOSE 4000
CMD ["npm", "start", "-w", "@signalhop/api"]
FROM runtime AS worker
USER node
CMD ["npm", "run", "start:worker", "-w", "@signalhop/api"]
FROM runtime AS web
USER node
ENV NODE_ENV=production
EXPOSE 3000
CMD ["npm", "start", "-w", "@signalhop/web"]
