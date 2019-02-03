import fs from 'fs';
import os from 'os';
import nock from 'nock';
import path from 'path';
import axios from 'axios';
import httpAdapter from 'axios/lib/adapters/http';

import pageLoader from '../src';

axios.defaults.adapter = httpAdapter;
nock.disableNetConnect();

const { promises } = fs;
const host = 'http://hexlet.io';

const getHtml = '/courses';
const pathToBeforeHtml = '__tests__/__fixtures__/pageBefore.html';
const pathToAftertHtml = '__tests__/__fixtures__/pageAfter.html';
const pathToAFterErrHtml = '__tests__/__fixtures__/pageAfterErr.html';
const htmlPageName = 'hexlet-io-courses.html';

const getImg = '/courses/assets/celt.jpg';
const pathToImg = '__tests__/__fixtures__/celt.jpg';
const imgName = 'hexlet-io-courses_files/assets-celt.jpg';

const getCss = '/courses/assets/main.css';
const pathToCss = '__tests__/__fixtures__/main.css';
const cssName = 'hexlet-io-courses_files/assets-main.css';

const getScript = '/courses/assets/script.js';
const pathToScript = '__tests__/__fixtures__/script.js';
const scriptName = 'hexlet-io-courses_files/assets-script.js';

describe('Testing Load Resourses', () => {
  let pathToTemp;
  const osTempDir = os.tmpdir();

  beforeEach(async () => {
    pathToTemp = await promises.mkdtemp(path.join(osTempDir, 'temp'));
  });

  it('downloaded succesfully...', async () => {
    nock(host)
      .get(getHtml)
      .replyWithFile(200, pathToBeforeHtml)
      .get(getImg)
      .replyWithFile(200, pathToImg)
      .get(getCss)
      .reply(200, pathToCss)
      .get(getScript)
      .replyWithFile(200, pathToScript);

    const testHtml = await promises.readFile(pathToAftertHtml, 'utf8');
    await pageLoader(`${host}${getHtml}`, pathToTemp);

    const fileContent = await promises.readFile(path.join(pathToTemp, htmlPageName), 'utf8');
    console.log(pathToTemp);
    expect(fileContent).toMatch(testHtml);

    const checkFile = fileName => fs.statSync(path.join(pathToTemp, fileName)).isFile();

    const checkImg = checkFile(imgName);
    expect(checkImg).toBeTruthy();
    const checkCss = checkFile(cssName);
    expect(checkCss).toBeTruthy();
    const checkScript = checkFile(scriptName);
    expect(checkScript).toBeTruthy();
  });

  it('downloaded not all files...', async () => {
    nock(host)
      .get(getHtml)
      .replyWithFile(200, pathToBeforeHtml)
      .get(getImg)
      .reply(404)
      .get(getCss)
      .reply(503)
      .get(getScript)
      .replyWithFile(200, pathToScript);

    const testHtml2 = await promises.readFile(pathToAFterErrHtml, 'utf8');
    await pageLoader(`${host}${getHtml}`, pathToTemp);

    const fileContent = await promises.readFile(path.join(pathToTemp, htmlPageName), 'utf8');
    console.log(pathToTemp);
    expect(fileContent).toMatch(testHtml2);

    const checkFile = fileName => promises.access(path.join(pathToTemp, fileName));

    const checkScript = checkFile(scriptName);
    expect(checkScript).toBeTruthy();

    try {
      await checkFile(imgName);
    } catch (err) {
      expect(err.code).toBe('ENOENT');
    }

    try {
      await checkFile(cssName);
    } catch (err) {
      expect(err.code).toBe('ENOENT');
    }
  });
});

describe('Testing File System Mistakes', () => {
  it('wrong directory', async () => {
    nock(host)
      .get(getHtml)
      .replyWithFile(200, pathToBeforeHtml);

    try {
      await pageLoader(`${host}${getHtml}`, 'some_dir');
    } catch (err) {
      expect(err.code).toBe('ENOENT');
    }
  });

  it('directory exist', async () => {
    nock(host)
      .get(getHtml)
      .replyWithFile(200, pathToBeforeHtml);

    try {
      await pageLoader(`${host}${getHtml}`, pathToBeforeHtml);
    } catch (err) {
      expect(err.code).toBe('ENOTDIR');
    }
  });
});
