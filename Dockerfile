# First stage is to build the application
FROM node:22.4-alpine AS build

# Define working directory
WORKDIR /app

# Copy all content into the first stage
COPY ./ ./

# Install app dependencies
RUN npm ci

# Build the application
RUN npm run build

# Second stage is to run the application
FROM node:22.4-alpine AS application

WORKDIR /app

# Copy the build files from the first stage
COPY --from=build /app/.output ./

EXPOSE 3000

CMD [ "./server/index.mjs" ]
