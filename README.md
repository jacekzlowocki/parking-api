# parking-api

This is a REST API for getting, creating, updating and deleting Parking Spot bookings.

### How to start
- install dependencies with
  ```
  nvm use
  # or install node v20

  npm install
  ```
- with docker: run docker containers with
  ```
  docker composer up
  ```
- OR on host machine:
  ```
  # export DB env variables (see index.ts for details)
  export DB_SERVER=127.0.0.1
  export DB_...

  # Run build & start
  npm run build && npm start

  # Alternatively run in development mode with active watchers & compilators
  npm run start-dev
  ```


At this point service is startede, which means:
- app is available at http://localhost:8000

If in development mode (e.g. via docker):
- file watchers & compilators are active
- app's DB along with test DB is running

### How it's build

The API consisit of following components:
- Typescript language compiler
- Express.js node framework
- TypeScript OpenAPI (TSOA) library - for structuring and describing the API in open standard
- Swagger UI - for easy API documentation and testing
- TypeORM - as typed data layer solution
- PostgreSQL - as DB itself
- ESlint & Prettier with pre-commit hook - for maintaining the consistent code style and quality
- Jest & Supertest - for unit & e2e testing

### Running tests

The application utilizes e2e tests, that require DB to be running so the real behavior of the Application can be tested.

To run the tests on local machine:
- Start entire docker compose setup: `docker compose up`
- OR run just the test DB with `docker-compose run -p 5433:5433 db-test` so the test DB is available for tests
- Run `npm run test`

### Accessing DB

To manually access the API database, docker compose needs to be running:
```
docker compose up
```

Then the DB is available on (see the compose.yml for details):
- host 127.0.0.1
- port: 5432
- db name: parking
- db user: postgres
- password: (see / update `password.txt` file)

Or if preferred to use existng DB running elswhere:
- update DB_* env variables in compose.yml for `server` container, if running app with docker
- provide all the DB_* env variable in the terminal, if running app on the host machine with ``


### Deploying your application to the cloud

This hasn't been tested, but application is ready to be used in production, with the cloud provider with container support.

First, build your image, e.g.: `docker build -t parking-api .`.
If your cloud uses a different CPU architecture than your development
machine (e.g., you are on a Mac M1 and your cloud provider is amd64),
you'll want to build the image for that platform, e.g.:
`docker build --platform=linux/amd64 -t parking-api .`.

Then, push it to your registry, e.g. `docker push myregistry.com/myapp`.

### Author
Jacek Złowocki
