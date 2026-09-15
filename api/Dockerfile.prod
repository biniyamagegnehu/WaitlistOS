FROM node:22-alpine

RUN apk add --no-cache bash openssl ca-certificates libc6-compat

# Install Nest CLI, TypeScript, and Prisma globally
RUN npm i -g @nestjs/cli typescript ts-node prisma

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install --legacy-peer-deps

COPY . .

# Generate Prisma Client (uses dummy URL during build if none is set)
ENV DATABASE_URL="postgresql://postgres:postgres@localhost:5432/placeholder"
RUN npx prisma generate

# Build application
RUN npm run build

# Copy entrypoint scripts and make them executable
COPY ./wait-for-it.sh /opt/wait-for-it.sh
COPY ./startup.prod.sh /opt/startup.prod.sh
RUN chmod +x /opt/wait-for-it.sh /opt/startup.prod.sh

# Create persistent storage directories
RUN mkdir -p /usr/src/app/files /usr/src/app/uploads

EXPOSE 3000

CMD ["/opt/startup.prod.sh"]
