# First stage is to build the application
FROM node:22 AS build

# Define working directory
WORKDIR /app

# Copy all content into the first stage
COPY ./ ./

# Install app dependencies
RUN npm ci

# Build the application
RUN npm run build

# Second stage is to run the application
FROM gcr.io/distroless/nodejs22-debian12 AS application

WORKDIR /app

# Copy dependencies from the first stage
COPY --from=build /app/node_modules ./node_modules

# Copy the build files from the first stage
COPY --from=build /app/.output ./

ARG GIT_SHA=not_set
ENV GIT_SHA=${GIT_SHA}

EXPOSE 3000

CMD [ "./server/index.mjs" ]
