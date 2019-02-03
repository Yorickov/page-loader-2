make install:
	npm install

build:
	rm -rf dist
	npm run build

loader:
	DEBUG=page-loader-2 page-loader-2 --output /var/tmp https://hexlet.io/courses

index:
	npx babel-node -- src/index.js

start:
	DEBUG='page-loader-2' npx babel-node -- src/bin/page-loader-2.js --output /var/tmp https://hexlet.io/courses

test:
	npm test

test-debug:
	DEBUG=page-loader-2 npm test

test-watch:
	npm test -- --watchAll

test-coverage:
	npm test -- --coverage

lint:
	npx eslint .

publish:
	npm publish

clean:
	rm -rf dist

.PHONY: test
