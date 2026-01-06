FROM node:18-alpine AS builder

WORKDIR /app

# Install dependencies needed for some node modules
RUN apk add --no-cache openssl openssl-dev libc6-compat

COPY package*.json ./
COPY prisma ./prisma/

RUN npm install

COPY . .

# Generate Prisma Client & Build
RUN npx prisma generate
RUN npm run build

# Production image
FROM node:18-alpine

WORKDIR /app

RUN apk add --no-cache openssl libc6-compat

COPY package*.json ./
COPY prisma ./prisma/

# Install only production dependencies
RUN npm install --only=production

# Copy generated Prisma Client from builder
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client

COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD ["npm", "start"]