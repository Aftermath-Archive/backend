FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json before installing dependencies
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install --omit=dev

# Copy the rest of the application
COPY . .

# Start the application
CMD ["npm", "start"]