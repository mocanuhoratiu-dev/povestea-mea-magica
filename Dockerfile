FROM node:22-alpine AS base
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

FROM base AS builder
ARG NEXT_PUBLIC_STRIPE_ENABLED=true
ARG NEXT_PUBLIC_SUPPORT_EMAIL=office@povestea-mea-magica.ro
ENV NEXT_PUBLIC_STRIPE_ENABLED=${NEXT_PUBLIC_STRIPE_ENABLED}
ENV NEXT_PUBLIC_SUPPORT_EMAIL=${NEXT_PUBLIC_SUPPORT_EMAIL}
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM base AS runner
ENV NODE_ENV=production
ENV PORT=8080
ENV HOSTNAME=0.0.0.0
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
EXPOSE 8080
CMD ["node", "server.js"]
