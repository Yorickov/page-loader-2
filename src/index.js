import path from 'path';
import axios from 'axios';
import fs from 'fs';
import url from 'url';
import cheerio from 'cheerio';
import _ from 'lodash';
import debug from 'debug';
import Listr from 'listr';

import {
  errorHandler,
  buildRelativeLink,
  buildAbsoluteLink,
  isValideLink,
} from './utils';

const { promises } = fs;
const log = debug('page-loader-2');

const makeAssetsName = link => link
  .split('/')
  .filter(item => item)
  .join('-');

const makeHtmlAndFolder = (urlStr) => {
  const { host, pathname } = url.parse(urlStr);
  const getHost = `${host}`.replace(/[^а-яА-ЯёЁa-zA-Z0-9]/g, '-');
  const getPath = makeAssetsName(`${getHost}${pathname}`);
  const htmlPageName = `${getPath}.html`;
  const htmlDir = `${getPath}_files`;
  return { htmlPageName, htmlDir };
};

const requestPromise = (urlQuery, options) => axios.get(urlQuery, options);
const writeHtml = (html, pathToHtml) => promises.writeFile(pathToHtml, html);

const tagsMapping = {
  script: 'src',
  link: 'href',
  img: 'src',
};

const getLinks = (html, urlHost) => {
  const $ = cheerio.load(html);
  const tags = Object.keys(tagsMapping);

  const refs = tags
    .map((tag) => {
      const attrb = tagsMapping[tag];
      const links = $(`${tag}[${attrb}]`)
        .map((index, item) => $(item).attr(attrb))
        .filter((index, item) => isValideLink(item, urlHost))
        .get();
      return links;
    });
  return _.uniq(_.flatten(refs));
};

const replaceLink = (link, contentHtml, htmlDir) => {
  const pathReplace = path.join(htmlDir, makeAssetsName(buildRelativeLink(link)));
  const newHtml = contentHtml.replace(new RegExp(link, 'g'), pathReplace);
  log(`html updated, old link: ${link}, new link: ${pathReplace}`);
  return newHtml;
};

const getResourses = async (contentHtml, urlQuery, pathToAssets, htmlDir) => {
  const links = getLinks(contentHtml, urlQuery);
  let html = contentHtml;

  log(`start downloading resourses from url: ${urlQuery}`);
  await Promise.all(links.map(async (link) => {
    const absLink = buildAbsoluteLink(link, urlQuery);
    const pathToResourse = path.join(pathToAssets, makeAssetsName(buildRelativeLink(link)));

    const task = async () => {
      const { data } = await requestPromise(absLink, { responseType: 'stream' });
      html = replaceLink(link, html, htmlDir);
      data.pipe(fs.createWriteStream(pathToResourse));
      log(`resourse ${link} written to path: ${pathToResourse}`);
    };

    try {
      await new Listr([{ title: `Downloading resourse ${absLink}`, task }]).run();
    } catch (err) {
      errorHandler(err, log, absLink);
    }
  }));

  log('dowloading completed, start writing html');
  return html;
};

const loadResourses = async ({ data }, urlQuery, pathToAssets, htmlDir) => {
  await promises.mkdir(pathToAssets);
  log(`got html end create folder for assets on path: ${pathToAssets}`);
  return getResourses(data, urlQuery, pathToAssets, htmlDir);
};

export default async (urlQuery, pathToDir = path.resolve('temp')) => {
  log('START');
  try {
    const { htmlPageName, htmlDir } = makeHtmlAndFolder(urlQuery);
    const pathToHtml = path.resolve(pathToDir, htmlPageName);
    const pathToAssets = path.resolve(pathToDir, htmlDir);
    const html = await requestPromise(urlQuery);
    const updatedHtml = await loadResourses(html, urlQuery, pathToAssets, htmlDir);
    await writeHtml(updatedHtml, pathToHtml);
    return log(`SUCCESS! Download from ${urlQuery} completed, path-page: ${pathToHtml} path-resourses: ${pathToAssets}`);
  } catch (err) {
    errorHandler(err, log, urlQuery);
    return Promise.reject(err);
  }
};
