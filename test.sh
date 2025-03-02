docker compose --env-file=.env.test --file=compose.test.yaml up -d
cd tests

# Use --test-reporter=tap for fuller, more accurate, but uglier, output
# Use --test-only if you are adding `.only` to tests (why node :P)
node --import=tsx --test-reporter=spec --test app/*

cd ..
docker compose --env-file=.env.test --file=compose.test.yaml down -v
