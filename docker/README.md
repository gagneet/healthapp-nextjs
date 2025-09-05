# Local Development Environment

This document provides instructions on how to set up and run the local development environment for the HealthApp application. The local setup uses Docker and Docker Compose to orchestrate the necessary services.

## Prerequisites

Before you begin, ensure you have the following installed on your system:

-   [Docker](https://docs.docker.com/get-docker/)
-   [Docker Compose](https://docs.docker.com/compose/install/)

## Services

The local development environment consists of the following services:

-   `app`: The Next.js application, including the frontend and backend API.
-   `postgres`: The PostgreSQL database.
-   `redis`: The Redis server for caching and session management.

## Setup

1.  **Clone the repository:**

    ```bash
    git clone <repository-url>
    cd <repository-directory>
    ```

2.  **Configure Environment Variables:**

    The `docker-compose.local.yml` file is configured to use your local IP address for hot-reloading. You can set the `HOST_IP` environment variable to your machine's IP address. If you don't set it, it will default to `192.168.0.148`.

    To set the `HOST_IP` environment variable, you can create a `.env` file in the root of the project:

    ```bash
    echo "HOST_IP=$(hostname -I | awk '{print $1}')" > .env
    ```

    Alternatively, you can manually create the `.env` file and add the following line:

    ```
    HOST_IP=your_ip_address
    ```

    Replace `your_ip_address` with your actual local IP address.

## Running the Environment

To start the local development environment, run the following command from the root of the project:

```bash
docker-compose -f docker/docker-compose.local.yml up --build
```

This command will:
-   Build the Docker image for the `app` service.
-   Start all the services defined in the `docker-compose.local.yml` file.
-   Mount the local source code into the `app` container, allowing for hot-reloading.

Once the services are up and running, you can access the application at [http://localhost:3002](http://localhost:3002).

## Stopping the Environment

To stop the services, press `Ctrl+C` in the terminal where `docker-compose` is running.

To stop and remove the containers, run the following command:

```bash
docker-compose -f docker/docker-compose.local.yml down
```

This will stop and remove the containers, but it will not remove the data volumes for PostgreSQL and Redis. To remove the volumes as well, you can add the `-v` flag:

```bash
docker-compose -f docker/docker-compose.local.yml down -v
```
