# parking-api

### Building and running the application for development

Start the application with live compilation and reload by running:
`docker compose up`.

Application will be available at http://localhost:8000.

### Running tests

The application uses e2e tests to ensure the correct behavior.

To run the tests on local machine:
- Run `docker-compose run -p 5433:5433 db-test` so the test DB is available for tests
- Run `npm run test`

### Deploying your application to the cloud

First, build your image, e.g.: `docker build -t parking-api .`.
If your cloud uses a different CPU architecture than your development
machine (e.g., you are on a Mac M1 and your cloud provider is amd64),
you'll want to build the image for that platform, e.g.:
`docker build --platform=linux/amd64 -t parking-api .`.

Then, push it to your registry, e.g. `docker push myregistry.com/myapp`.

Consult Docker's [getting started](https://docs.docker.com/go/get-started-sharing/)
docs for more detail on building and pushing.

### References
* [Docker's Node.js guide](https://docs.docker.com/language/nodejs/)
