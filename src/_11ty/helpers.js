const fs = require("fs");
const fetch = require("node-fetch");
const Image = require("@11ty/eleventy-img");

const IMG_CACHE_FILE_PATH = "src/_cache/images.json";
const external = /https?:\/\/((?:[\w\d-]+\.)+[\w\d]{2,})/i;
// Matches bookmark links that are not inline
const mdBookmarkRegex = /^\[bookmark]\(([^)]+)\)$/gm;
// TODO: test
const mdImageRegex = /^\!\[\]\(((?:\/|https?:\/\/)[\w\d./?=#]+)\)$/;

function replaceNotionBookmark(markdownString) {
  console.log("!!!!!!!!!!!!!!!!");
  console.log(markdownString.match(mdBookmarkRegex));
  return markdownString.replace(mdBookmarkRegex, `{% anyEmbed '$1' %}`);
}

function replaceNotionMarkdown(markdownString) {
  const newString = replaceNotionBookmark(markdownString);
  console.log(newString);
  return newString;
}

// get cache contents from json file
function readFromCache(cacheFilePath) {
  if (fs.existsSync(cacheFilePath)) {
    const cacheFile = fs.readFileSync(cacheFilePath);
    return JSON.parse(cacheFile);
  }

  // no cache found.
  return {
    lastFetched: null,
  };
}

// save combined webmentions in cache file
function writeToCache(data, cacheFilePath, descriptor) {
  // Don't actually write to cache on dev or cloudflare
  if (process.env.ELEVENTY_ENV !== "devbuild") return;

  const dir = "src/_cache";
  const fileContent = JSON.stringify(data, null, 2);
  // create cache folder if it doesnt exist already
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }
  // write data to cache json file
  fs.writeFileSync(cacheFilePath, fileContent, (err) => {
    if (err) throw err;
    console.log(`>>> ${descriptor} cached to ${cacheFilePath}`);
  });
}

function hash(text) {
  "use strict";

  var hash = 5381,
    index = text.length;

  while (index) {
    hash = (hash * 33) ^ text.charCodeAt(--index);
  }

  const hashNumber = hash >>> 0;
  return hashNumber.toString();
}

function shortHash(text) {
  return hash(text).substring(0, 7);
}

function getFileName(url) {
  // get the filename from the path
  const pathComponents = url.split("/");

  // break off cache busting string if there is one
  let filename = pathComponents[pathComponents.length - 1].split("?");
  return `${shortHash(url)}-${filename[0]}`;
}

function getLocalImageLink(imgUrl, fileName = "", folder = "ext") {
  if (!imgUrl) return "";

  if (!external.test(imgUrl) || process.env.ELEVENTY_ENV === "development") {
    return imgUrl;
  }

  const cache = readFromCache(IMG_CACHE_FILE_PATH);
  if (cache[imgUrl]) {
    return cache[imgUrl].url;
  }

  const fn = fileName || getFileName(imgUrl);
  const imagePath = `/img/${folder}/${fn}`;
  const path = `./src${imagePath}`;

  if (!fs.existsSync(path)) {
    fetch(imgUrl).then((res) => res.body.pipe(fs.createWriteStream(path)));
    cache[imgUrl] = { url: imagePath };
    writeToCache(cache, IMG_CACHE_FILE_PATH, "images");
  } else {
    console.error("> collision downloading image", imgUrl);
  }

  return imagePath;
}

async function optimizeImage(src) {
  if (!src) {
    return src;
  }

  console.log(src);
  const fileSource = src.startsWith("/img") ? `./src${src}` : src;

  let metadata = await Image(fileSource, {
    widths: [1200],
    outputDir: "_site/img",
  });

  let data = metadata.jpeg[metadata.jpeg.length - 1];
  return data.url;
}

module.exports = {
  replaceNotionMarkdown,
  readFromCache,
  writeToCache,
  getLocalImageLink,
  optimizeImage,
};
