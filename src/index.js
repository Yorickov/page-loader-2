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
  builAbsoluteLink,
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

const replaceLink = (link, contentHtml, pathToHtml, htmlDir) => {
  const replacer = new RegExp(link, 'g');
  const pathReplace = path.join(htmlDir, makeAssetsName(buildRelativeLink(link)));
  const newHtml = contentHtml.replace(replacer, pathReplace);

  log(`html updated, old link: ${link}, new link: ${pathReplace}`);
  return newHtml;
};

const requestPromise = (urlQuery, options) => axios.get(urlQuery, options);

const getResourses = (contentHtml, urlQuery, pathToAssets, pathToHtml, htmlDir) => {
  const links = getLinks(contentHtml, urlQuery);
  let html = contentHtml;

  log(`start downloading resourses from url: ${urlQuery}`);
  return Promise.all(links.map((link) => {
    const absLink = builAbsoluteLink(link, urlQuery);
    const pathToResourse = path.join(pathToAssets, makeAssetsName(buildRelativeLink(link)));
    return new Listr([
      {
        title: `Downloading resourse ${absLink}`,
        task: () => requestPromise(absLink, { responseType: 'stream' })
          .then(({ data }) => {
            html = replaceLink(link, html, pathToHtml, htmlDir);
            return data.pipe(fs.createWriteStream(pathToResourse));
          })
          .then(() => log(`resourse ${link} written to path: ${pathToResourse}`)),
      }])
      .run()
      .catch(err => errorHandler(err, log, absLink));
  }))
    .then(() => {
      log('dowloading completed, start writing html');
      return html;
    });
};

const loadResourses = ({ data }, urlQuery, pathToAssets, pathToHtml, htmlDir) => promises
  .mkdir(pathToAssets).then(() => {
    log(`got html end create folder for assets on path: ${pathToAssets}`);
    return getResourses(data, urlQuery, pathToAssets, pathToHtml, htmlDir);
  });

const writeHtml = (html, pathToHtml) => promises.writeFile(pathToHtml, html);

export default (urlQuery, pathToDir = path.resolve('temp')) => {
  log('START');
  const { htmlPageName, htmlDir } = makeHtmlAndFolder(urlQuery);
  const pathToHtml = path.resolve(pathToDir, htmlPageName);
  const pathToAssets = path.resolve(pathToDir, htmlDir);
  return requestPromise(urlQuery)
    .then(res => loadResourses(res, urlQuery, pathToAssets, pathToHtml, htmlDir))
    .then(html => writeHtml(html, pathToHtml))
    .then(() => log(`SUCCESS! Download from ${urlQuery} completed, path-page: ${pathToHtml} path-resourses: ${pathToAssets}`))
    .catch((err) => {
      errorHandler(err, log, urlQuery);
      return Promise.reject(err);
    });
};
