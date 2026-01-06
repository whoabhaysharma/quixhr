FROM node:18-alpine

WORKDIR /app

# Install dependencies needed for some node modules and prisma
RUN apk add --no-available --update --no-cache \
    openssl \
    openssl-dev \
    libc6-compat

COPY package*.json ./
COPY prisma ./prisma/

RUN npm install

# Copy source code
COPY . .

# Generate Prisma Client
RUN npx prisma generate

EXPOSE 3000

CMD ["npm", "run", "dev:watch"]