# =================================================================================================
# BUILDER STAGE
# This stage builds the Next.js application and generates the standalone output.
# =================================================================================================
# Base image with Node.js 22, based on Alpine for a smaller size.
FROM node:22-alpine AS builder

# Set the working directory inside the container.
WORKDIR /app

# Install OpenSSL, which is a required dependency for Prisma.
RUN apk add --no-cache openssl

# Copy package.json and package-lock.json to leverage Docker's layer caching.
COPY package*.json ./

# Copy the Prisma schema and migrations.
COPY prisma ./prisma/

# Install all dependencies, including devDependencies needed for the build.
RUN npm install

# Copy the rest of the application source code.
COPY . .

# Generate the Prisma client based on the schema.
RUN npx prisma generate

# Build the Next.js application. This will also generate the standalone output
# because of the `output: 'standalone'` option in next.config.js.
RUN npm run build

# =================================================================================================
# RUNNER STAGE
# This stage creates the final, lightweight production image.
# =================================================================================================
# Use the same lightweight Node.js 22 Alpine base image.
FROM node:22-alpine AS runner

# Set the working directory inside the container.
WORKDIR /app

# Set the environment to production.
ENV NODE_ENV=production

# Install OpenSSL, which is a required dependency for Prisma.
RUN apk add --no-cache openssl

# Copy the standalone output from the builder stage.
# This includes the server.js file, the .next/server directory, and node_modules.
COPY --from=builder /app/.next/standalone ./

# Copy the public assets directory from the builder stage.
COPY --from=builder /app/public ./public

# Copy the static assets from the .next directory.
# These are the assets served by the Next.js server (e.g., CSS, JS).
COPY --from=builder /app/.next/static ./.next/static

# Expose the port the application will run on. The project is configured to use port 3002.
EXPOSE 3002

# The command to start the Next.js server in production mode.
# The standalone output creates a `server.js` file for this purpose.
CMD ["node", "server.js"]
