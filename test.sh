docker compose --env-file=.env.test --file=compose.test.yaml up -d
cd tests

# FIX THIS
# If you start the container then instantly try querying with @ninjalib/sql you sometimes get "Connection lost: The server closed the connection"
# This should be handled better in @ninjalib/sql so it re-tries if it can't connect instantly, but the temp fix is just waiting here :/
sleep 3

# Use --test-reporter=tap for fuller, more accurate, but uglier, output
# Use --test-only if you are adding `.only` to tests (why node :P)
node --import=tsx --test-reporter=spec --test app/*

cd ..
docker compose --env-file=.env.test --file=compose.test.yaml down -v
