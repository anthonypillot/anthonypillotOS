# First stage is to build the application
FROM node:24 AS build

# Define working directory
WORKDIR /app

ARG APP_VERSION
ENV APP_VERSION=${APP_VERSION}

# Copy all content into the first stage
COPY ./ ./

# Install app dependencies
RUN npm ci

# Build the application
RUN npm run build

# Second stage is to run the application
FROM gcr.io/distroless/nodejs24-debian13 AS application

WORKDIR /app

# Copy dependencies from the first stage
COPY --from=build /app/node_modules ./node_modules

# Copy the build files from the first stage
COPY --from=build /app/.output ./

COPY --from=build /app/package.json ./bootstrap/package.json
COPY --from=build /app/runtime ./bootstrap/runtime

ARG APP_VERSION
ENV APP_VERSION=${APP_VERSION}

ARG GIT_SHA=not_set
ENV GIT_SHA=${GIT_SHA}

EXPOSE 3000

CMD [ "--import", "./bootstrap/runtime/register-telemetry.mts", "./server/index.mjs" ]
