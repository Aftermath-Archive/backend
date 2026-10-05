FROM node:26-alpine

# Set working directory
WORKDIR /app
ENV NODE_ENV=production

# Copy package.json and package-lock.json before installing dependencies
COPY package.json package-lock.json ./
COPY .husky/install.mjs .husky/install.mjs

# Install dependencies
RUN HUSKY=0 npm ci --omit=dev

# Copy the rest of the application
COPY --chown=node:node . .
USER node

# Start the application
CMD ["npm", "start"]
