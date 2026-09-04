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
RUN npm run build -- --webpack

FROM base AS runner
ENV NODE_ENV=production
ENV PORT=8080
ENV HOSTNAME=0.0.0.0
RUN apk add --no-cache fontconfig \
  && mkdir -p /usr/share/fonts/truetype/liberation
COPY --from=builder /app/public ./public
COPY --from=builder /app/public/fonts/LiberationSans-Bold.ttf /usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
RUN fc-cache -f
EXPOSE 8080
CMD ["node", "server.js"]
