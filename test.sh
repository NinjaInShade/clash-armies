cd tests
docker compose up -d
# FIX THIS
# If you start the container then instantly try querying with @ninjalib/sql you sometimes get "Connection lost: The server closed the connection"
# This should be handled better in @ninjalib/sql so it re-tries if it can't connect instantly, but the temp fix is just waiting here :/
sleep 3
node --experimental-specifier-resolution=node --import=tsx --test-reporter=spec --test app/*.{ts,js,mjs}
# Use this if you need to see full chai assertion failure output (spec reporter truncates/doesn't always show it accurately)
# node --experimental-specifier-resolution=node --import=tsx --test-reporter=tap --test app/*.{ts,js,mjs}
docker compose down -v
