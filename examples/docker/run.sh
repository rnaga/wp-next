#!/bin/bash

# Set default values for environment variables
export WORDPRESS_HOSTNAME=${WORDPRESS_HOSTNAME:-localhost}

# Check if the first argument is provided (up or down), and if so, use it
if [ $# -gt 0 ]; then
  ACTION="$1"
else
  ACTION="up"
fi

PROJECT_NAME=${PROJECT_NAME:-wp-next-example}

# Run docker-compose with the specified action and project name
if [ "$ACTION" = "up" ]; then
  docker compose -p "$PROJECT_NAME" up
elif [ "$ACTION" = "down" ]; then
  docker compose -p "$PROJECT_NAME" down
else
  echo "Invalid action. Use 'up' or 'down'."
  exit 1
fi
