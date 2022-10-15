# api-boilerplate

## Info
`@sulaiman1073/api-boilerplate` is the primary api for interacting with: 

* [`@sulaiman1073/client-boilerplate`](https://github.com/sulaiman1073/client-boilerplate)
* [`@sulaiman1073/ws-boilerplate`](https://github.com/sulaiman1073/ws-boilerplate)

You can watch a demo [here](https://placeholder.youtube.com).

## Codebase
The codebase for `api-boilerplate` is written in Node.js with [Hapi](https://hapi.dev/), PostgreSQL and Redis.

### First time setup

1. Clone the repository

```
git clone https://github.com/sulaiman1073/api-boilerplate
```

2. The API setup requires PostgreSQL & Redis

* Install [PostgreSQL](https://www.postgresql.org/) and install this [extension](https://github.com/iCyberon/pg_hashids).
* Install [Redis](https://redis.io/.).
* For Windows, Redis can be setup with: 
  - https://github.com/microsoftarchive/redis/releases 
  - https://github.com/ServiceStack/redis-windows

3. Next, create a database:

```
CREATE DATABASE apidb;
CREATE USER apidb WITH ENCRYPTED PASSWORD 'apidb123';
GRANT ALL PRIVILEGES ON DATABASE apidb TO apidb;
ALTER ROLE apidb superuser;
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
*Important* The following services need to be set up alongside `@sulaiman1073/api-boilerplate` for the site to run on your local machine:

* [`@sulaiman1073/client-boilerplate`](https://github.com/sulaiman1073/client-boilerplate)
* [`@sulaiman1073/ws-boilerplate`](https://github.com/sulaiman1073/ws-boilerplate)

### Folder Structure
```
sulaiman1073/ws-boilerplate/
├── controllers # Placeholder
├── helpers # placeholder explanation
├── Placeholder # placeholder explanation
├── Placeholder # placeholder explanation
├── Placeholder # placeholder explanation
└── Placeholder # placeholder explanation
```

