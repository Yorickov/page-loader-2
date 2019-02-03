# page-loader v.2

[![Build Status](https://travis-ci.org/Yorickov/page-loader-2.svg?branch=master)](https://travis-ci.org/Yorickov/page-loader-2)
[![Maintainability](https://api.codeclimate.com/v1/badges/51c54dcfe77734542488/maintainability)](https://codeclimate.com/github/Yorickov/page-loader-2/maintainability)
[![Test Coverage](https://api.codeclimate.com/v1/badges/51c54dcfe77734542488/test_coverage)](https://codeclimate.com/github/Yorickov/page-loader-2/test_coverage)

CLI-utility, downloads web page with resourses

*Improved version of page-loader*

## Changes compared to version v.1
- add async/await
- fs.promises instead mz

## Technologies
- Npm / Babel / ESLint
- Jest
- commander
- axios
- cheerio
- listr

## Feautures
- file system I/O
- nodejs: fs, url, path, etc.
- error handling
- debug
- DOM: basic manipulations
- asynchronous programming: promises, async await
- HTTP
- test-driven development: mock/stub

## Setup
`make install`

*`npm install -g page-loader-2`*

## Usage
`$ page-loader-2 --output [path/to/dir] [url]`

## Example
```
$ page-loader-2 --output /var/tmp https://redmine.org/projects
$ open /var/tmp/redmine-org-projects.html
```
