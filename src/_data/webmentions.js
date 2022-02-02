const fetch = require("node-fetch");
const unionBy = require("lodash/unionBy");
const domain = require("./metadata.json").domain;
const { readFromCache, writeToCache } = require("../_11ty/helpers");

// Define Cache Location and API Endpoint
const CACHE_FILE_PATH = "src/_cache/webmentions.json";
const API = "https://webmention.io/api";
const TOKEN = "gbdqcZXnxQEW6viIwKa_1Q"; //process.env.WEBMENTION_IO_TOKEN

async function fetchWebmentions(since, perPage = 10000) {
  // If we dont have a domain name or token, abort
  if (!domain || !TOKEN) {
    console.warn(">>> unable to fetch webmentions: missing domain or token");
    return false;
  }

  let url = `${API}/mentions.jf2?domain=${domain}&token=${TOKEN}&per-page=${perPage}`;
  if (since) url += `&since=${since}`; // only fetch new mentions

  const response = await fetch(url);
  if (response.ok) {
    const feed = await response.json();
    console.log(
      `>>> ${feed.children.length} new webmentions fetched from ${API}`
    );
    return feed;
  }

  return null;
}

// Merge fresh webmentions with cached entries, unique per id
function mergeWebmentions(a, b) {
  return unionBy(a.children, b.children, "wm-id");
}

module.exports = async function () {
  console.log(">>> Reading webmentions from cache...");
  const cache = readFromCache(CACHE_FILE_PATH);

  if (cache.children.length) {
    console.log(`>>> ${cache.children.length} webmentions loaded from cache`);
  }

  // Only fetch new mentions in production
  if (process.env.ELEVENTY_ENV === "development") return cache;

  console.log(">>> Checking for new webmentions...");
  const feed = await fetchWebmentions(cache.lastFetched);
  if (feed) {
    const webmentions = {
      lastFetched: new Date().toISOString(),
      children: mergeWebmentions(cache, feed),
    };

    if (process.env.ELEVENTY_ENV === "devbuild") {
      writeToCache(webmentions, CACHE_FILE_PATH, "webmentions");
    }
    
    return webmentions;
  }

  return cache;
};
