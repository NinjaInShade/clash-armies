#!/bin/bash
source .env &&
docker compose up -d &&
kysely-codegen --out-file src/lib/server/db-types.d.ts --dialect mysql --url mysql://$DB_USER:$DB_PASSWORD@localhost:$DB_PORT/clash-armies
