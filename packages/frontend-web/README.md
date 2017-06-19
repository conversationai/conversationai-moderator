## Getting Started

Requirement:

- NodeJS LTS 6.11.x

Install dependencies:

```
./bin/install
```

## Running Storybook

```
./bin/storybook
```

Visit [http://localhost:9001/](http://localhost:9001/).

## Interactive Storybook Testing

```
cd packages/frontend-web
npm run storybook:test -- -u
```

## Running front-end development server

Run webpack dev server:

```
cd packages/frontend-web
npm run start
```

Visit [http://localhost:8000/](http://localhost:8000/).

### Linting

To run linters, use:

```
./bin/lint
```

### Testing

To run tests, use:

```
./bin/test
```
