# Build stage
FROM node:18-alpine as build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the app
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Install server dependencies
COPY server/package*.json ./
RUN npm ci --only=production

# Copy server code
COPY server/ ./

# Copy built React app
COPY --from=build /app/build ./build

# Expose port 2001
EXPOSE 2001

# Start the server
CMD ["node", "server.js"]
