make install:
	npm install

index:
	npx babel-node -- src/index.js

start:
	npx babel-node -- src/bin/page-loader-2.js

build:
	rm -rf dist
	npm run build

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
