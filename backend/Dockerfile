# Build argument to determine environment
ARG BUILD_ENV=development

FROM node:18-alpine

RUN apk add --no-cache openssl

WORKDIR /app

COPY package*.json ./

# Install dependencies based on environment
RUN if [ "$BUILD_ENV" = "production" ]; then \
        npm install --production; \
    else \
        npm install; \
    fi

COPY . .

# Generate Prisma client
RUN npx prisma generate

EXPOSE 5000

# Development uses nodemon, production uses node directly
CMD if [ "$BUILD_ENV" = "production" ]; then \
        sh -c "npx prisma migrate deploy && node src/server.js"; \
    else \
        sh -c "npx prisma generate && npm start"; \
    fi
