To install dependencies:

```sh
bun install
```

To run:

```sh
bun run dev
```

open http://localhost:3000

ENV FILE STRUCTURE

```
POSTGRES_USER=""
POSTGRES_PASSWORD=""
POSTGRES_DB=""
POSTGRES_NAME=""
POSTGRES_PORT=""

DATABASE_URL="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_NAME}:${POSTGRES_PORT}/${POSTGRES_DB}?schema=public"

WEB_CLIENT_ID = ""
IOS_CLIENT_ID = ""
ANDROID_CLIENT_ID = ""

APPLE_CLIENT_ID = ""

JWT_SECRET = ""
JWT_REFRESH_SECRET = ""

UNSPLASH_ACCESS_KEY=""

BUCKET_REGION=""
BUCKET_ACCESS_KEY=""
BUCKET_SECRET_KEY=""
BUCKET_NAME=""
```

To run container

```
  docker compose up -d backend
  docker compose exec backend bun db:migrate
  // docker image prune -f
```
