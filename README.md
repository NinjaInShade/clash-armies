# Introduction

Clash Armies is a website where users can find, create, share and learn clash of clans armies.

Join the [discord server](https://discord.gg/9wCmfXhZM6) to keep up to date with discussions, sneak peaks and releases!

# Run locally

If you need extra help, or have suggestions on improving the dev workflow, give me a message on discord/github.

## Prerequisites

- `npm` >= 10.5.0
- `node` >= 24.11.0
- `docker` >= 20.10.24
- `docker compose` >= 2.20.3

## Running app

Clone the repo and go into:

```bash
git clone https://github.com/NinjaInShade/clash-armies.git
cd clash-armies
```

The first setup step before being able to run the app and have it function is to create a google oAuth project and generate a client id and secret which are needed for the login to work. This is totally free. These are the steps:

- Go to the [Google API dashboard](https://console.cloud.google.com/apis/dashboard)
- Go to `credentials` and create an oAuth client id/secret. In the setup wizard add `http://localhost:5173` as an authorized javascript origin, and `http://localhost:5173/api/login/google/callback` as an authorized redirect URI.
- Go to `oAuth consent screen` and customize the oAuth consent screen to your liking

Next thing you will need to do is create a `.env` file at the root of the project with the following vars:

- DB_PORT
- DB_ROOT_PASSWORD
- DB_USER
- DB_PASSWORD
- BASE_APP_URL (set this to `http://localhost:5173`)
- GOOGLE_AUTH_CLIENT_ID (use the google client id from before)
- GOOGLE_AUTH_SECRET (use the google secret from before)

Once all that is done, install the dependencies:

```bash
npm i
```

And run the app:

```bash
npm start
```

You should now have the app running locally on port 5173!

# Contributing

I appreciate any contributions, I find it really cool people can help make the project better for everyone.

If you wish to contribute, give me a shout on discord/github and we can discuss the idea/fix you want to do (or I can help with ideas).

# Useful documentation/reading

During the making of this I had to find resources myself so for anyone making a similar tool, or even anything to do with clash of clans, these may be useful.

## Army links

Found on the [Clash API Developers discord](https://discord.gg/clashapi) FAQs. For internal troop/spell ID's see [Static data](./README.md#static-data)

> Army Link URLs enable sharing of army compositions externally from the Clash of Clans game client. Other players can then use the link to import the army composition to one of their army slots in game. These URLs can be generated programmatically if you know the troop and spell IDs.
>
> Example of a simple army link breakdown:
>
> https://link.clashofclans.com/en?action=CopyArmy&army=u10x0-2x3s1x9-3x2
>
> First are troops, (prefixed with the "u" character):<br />
> First item is 10 troops with id 0, which are Barbarians.<br />
> Next item is 2 troops with id 3, which are Giants.<br />
>
> Then come the spells (starting with the s character):<br />
> First is 1 spell with id 9, which is a Poison Spell.<br />
> Second is 3 spells with id 2, which is a Rage Spell.<br />
>
> The army= query string value can be parsed with regex into two groups (troops and spells):
>
> u([\d+x-]+)s([\d+x-]+)

## Static data

To achieve this I needed the metadata for things such as troops, spools etc. I realized early on this wasn't going to be feasible, maintainable and prone to error if I tried to manually enter data myself from wikis etc. Also some of the properties like internal troop IDs aren't easy to find.

I found some resources from [Clash API Developers discord](https://discord.gg/clashapi) FAQs:

## Sanitised JSON Files

> Provided by @Magic?! | ClashKing (docs)
>
> https://api.clashking.xyz/json/troops <br/> > https://api.clashking.xyz/json/spells <br/> > https://api.clashking.xyz/json/heroes <br/> > https://api.clashking.xyz/json/buildings <br/> > https://api.clashking.xyz/json/pets <br/> > https://api.clashking.xyz/json/supers <br/> > https://api.clashking.xyz/json/translations <br/>
>
> https://api.clashking.xyz/assets (Zip File of Game Assets) <br/> > https://api.clashking.xyz/csv (Zip File of all Game CSV's) <br/>

### Raw JSON Conversions

> Provided by @spAnser
>
> Root URL path: https://coc.guide/static/json/
>
> Followed by:
>
> capital_buildings.json<br />
> capital_characters.json<br />
> capital_obstacles.json<br />
> capital_projectiles.json<br />
> capital_spells.json<br />
> capital_traps.json<br />
> characters.json<br />
> client_globals.json<br />
> globals.json<br />
> heroes.json<br />
> languages.json<br />
> object_ids.json<br />
> obstacles.json<br />
> pass_tasks.json<br />
> pets.json<br />
> projectiles.json<br />
> replay.json<br />
> spells.json<br />
> supers.json<br />
> tasks.json<br />
> townhall_levels.json<br />
> traps.json<br />
> upgrade_tasks.json<br />
> weapons.json<br />
>
> Localisation:
>
> lang/texts_AR.json<br />
> lang/texts_CN.json<br />
> lang/texts_CNT.json<br />
> lang/texts_DE.json<br />
> lang/texts_EN.json<br />
> lang/texts_ES.json<br />
> lang/texts_FA.json<br />
> lang/texts_FI.json<br />
> lang/texts_FR.json<br />
> lang/texts_ID.json<br />
> lang/texts_IT.json<br />
> lang/texts_JP.json<br />
> lang/texts_KR.json<br />
> lang/texts_MS.json<br />
> lang/texts_NL.json<br />
> lang/texts_NO.json<br />
> lang/texts_PT.json<br />
> lang/texts_RU.json<br />
> lang/texts_TH.json<br />
> lang/texts_VI.json<br />
> lang/texts_TR.json<br />

## Official API considerations

This refers to the [Official API](https://developer.clashofclans.com/#/).

**Response caching**

Found on the [Clash API Developers discord](https://discord.gg/clashapi) FAQs:

> Each API response from the Clash of Clans API is cached for a certain amount of time. This means that the response will not change until the cache timer has expired, therefore there isn't any benefit from repeating the request again until this time. The cache timer varies by API endpoint:
>
> Clan - 120 seconds (2 minutes)<br />
> Current War (Classic) - 120 seconds (2 minutes)<br />
> Other War (CWL) - 600 seconds (10 minutes)<br />
> Player - 60 seconds (1 minute)<br />
>
> When making an API request, you can check the response headers for a cache-control header and the value of this is the number of seconds until the cache expires.

**Rate limit**

Found on the [Clash API Developers discord](https://discord.gg/clashapi) FAQs:

> Each API Token for the Clash of Clans API is to rate limitations. There isn't an official rate limit figure provided, however we have tested 30-40 requests per second without issues.
>
> If you exceed the rate limit, the API will respond with a 429 error and you will be temporarily unable to make API requests with that token (it can last 1 hour).

**IP restrictions**

Found on the [Clash API Developers discord](https://discord.gg/clashapi) FAQs:

> Each API Tokens for the Clash of Clans API is restricted to specific IP addresses (IPv4). This can cause issues when attempting to access it from a connection with a dynamic IP address. There are a couple workarounds:
>
> 1. Use a library with dynamic IP address support
>
> A number of the community created API libraries have the ability to create and use a new API token each time your IP address changes. This happens seamlessly with each request, so enable you to make API requests without needing to manually create a new API Token each time your IP changes.
>
> 2. Use an API proxy
>
> Making your API requests via a proxy will mean that the API will "see" the requests as coming from the IP address of the proxy service. If you create your token using the IP address of the proxy service and then make your API calls via that service, you will be able to make API requests from any IP address.
