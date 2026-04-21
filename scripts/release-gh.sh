# release-gh.sh
#
# This script automates the process of publishing a package to the GitHub Packages registry.
# It supports two release targets: "beta" and "prod".
#
# Usage:
#   ./release-gh.sh <TARGET> [VERSION_TYPE]
#
# Arguments:
#   TARGET: Specifies the release target. Must be either "beta" or "prod".
#           - "beta": Publishes a pre-release version to GitHub Packages.
#           - "prod": Publishes a production version to GitHub Packages.
#   VERSION_TYPE: Specifies the type of version bump for production releases. Must be one of "patch", "minor", or "major".
#                 Defaults to "patch" if not provided.
#
# Behavior:
#   - For "beta":
#       - Bumps the version with a pre-release identifier (e.g., 1.0.0-beta.0).
#       - Publishes the package to GitHub Packages with the "beta" tag.
#   - For "prod":
#       - Validates the VERSION_TYPE argument.
#       - Bumps the version based on VERSION_TYPE (e.g., patch, minor, major).
#       - Publishes the package to GitHub Packages only (not npm registry).
#
# Notes:
#   - The dist directory is used as the staging area for publishing.
#   - The script ensures proper validation of input arguments to prevent accidental misconfigurations.

TARGET=$1 # "beta" or "prod"
VERSION_TYPE=$2 # "patch", "minor", or "major"

# Validate TARGET input
if [ "$TARGET" != "beta" ] && [ "$TARGET" != "prod" ]; then
  echo "Error: TARGET must be either 'beta' or 'prod'."
  exit 1
fi

GITHUB_REGISTRY="https://npm.pkg.github.com"

# If beta is specified, bump the version with a pre-release identifier
# and publish to GitHub Packages only
if [ "$TARGET" = "beta" ]; then
    # Bump version with pre-release identifier
    # This will create a version like 1.0.0-beta.0, *-beta.1, etc.
    npm version prerelease --preid beta --no-git-tag-version
    # Prepare dist directory
    cp package.json ./dist/

    # Publish to GitHub Packages with beta tag
    cd ./dist/
    npm publish --registry "$GITHUB_REGISTRY" --tag beta # --dry-run
    exit 0
fi

# For prod release, set VERSION_TYPE to "patch" by default if not passed
if [ -z "$VERSION_TYPE" ]; then
  VERSION_TYPE="patch"
fi

# Validate VERSION_TYPE input
if [ "$VERSION_TYPE" != "patch" ] && [ "$VERSION_TYPE" != "minor" ] && [ "$VERSION_TYPE" != "major" ]; then
  echo "Error: VERSION_TYPE must be 'patch', 'minor', or 'major'."
  exit 1
fi

# Bump version based on VERSION_TYPE
npm version $VERSION_TYPE --no-git-tag-version

# Copy package.json to dist
cp package.json ./dist/

# Copy README.md to dist
cp ../../README.md ./dist/

# Move to dist directory — this is where the package will be published from
cd ./dist/

# Publish to GitHub Packages only
npm publish --registry "$GITHUB_REGISTRY" # --dry-run
