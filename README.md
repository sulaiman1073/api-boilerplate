# popitalk-server-api

## Info
`@popitalk/popitalk-server-api` is the primary api for interacting with: 

* [`@popitalk/popitalk-client`](https://github.com/Popitalk/popitalk-client)
* [`@popitalk/popitalk-server-ws`](https://github.com/Popitalk/popitalk-server-ws)

You can watch a demo [here](https://placeholder.youtube.com).

## Codebase
The codebase for `popitalk-server-api` is written in Node.js with [Hapi](https://hapi.dev/), PostgreSQL and Redis.

### First time setup

1. Clone the repository

```
git clone https://github.com/Popitalk/popitalk-server-api
```

2. The API setup requires PostgreSQL & Redis

* Install [PostgreSQL](https://www.postgresql.org/) and install this [extension](https://github.com/iCyberon/pg_hashids).
* Install [Redis](https://redis.io/.).
* For Windows, Redis can be setup with: 
  - https://github.com/microsoftarchive/redis/releases 
  - https://github.com/ServiceStack/redis-windows

3. Next, create a database:

```
CREATE DATABASE playnows;
CREATE USER playnows WITH ENCRYPTED PASSWORD 'playnows123';
GRANT ALL PRIVILEGES ON DATABASE playnows TO playnows;
ALTER ROLE playnows superuser;
```

4. Finally to run the repository locally:

```
npm install
npm run devserver
```

#### Checklist

 - You need to install the required dependencies by running `npm`.
 - Make sure you have the most recent `.env` file.
 - Ensure that `.env.example` is either copied and renamed to `.env`, or is simply renamed to `.env`.

#### Installation
*Important* The following services need to be set up alongside `@popitalk/popitalk-server-api` for the site to run on your local machine:

* [`@popitalk/popitalk-client`](https://github.com/Popitalk/popitalk-client)
* [`@popitalk/popitalk-server-ws`](https://github.com/Popitalk/popitalk-server-ws)

### Folder Structure
```
popitalk/popitalk-server-ws/
├── controllers # Placeholder
├── helpers # placeholder explanation
├── Placeholder # placeholder explanation
├── Placeholder # placeholder explanation
├── Placeholder # placeholder explanation
└── Placeholder # placeholder explanation
```

