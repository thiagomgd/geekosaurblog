const groupBy = require("lodash/groupBy");
const { readFromCache } = require("../_11ty/helpers");

const metadata = require("./metadata.json");
const {sortBy} = require("lodash/collection");

const CACHE_FILE_PATH = "src/_cache/manga.json";

function sortManga(manga) {
  const perYear = groupBy(manga, "year_read");
  const grouped = {};

  Object.keys(perYear).forEach((year)=>{
    // const bySeries = groupBy(perYear[year], 'series');
    // Object.keys(bySeries).forEach((series)=>{
    //   const sorted = sortBy(series[series], 'volume');
    //
    //   if (sorted.length > 4) {
    //     const final = [];
    //   } else {
    //     grouped[year]
    //   }
    // }
    grouped[year] = groupBy(perYear[year], 'series');
  })

  return grouped;
}

module.exports = async function () {
  // return [];
  console.log(">>> Reading manga from cache...");
  const cache = readFromCache(CACHE_FILE_PATH);

  if (cache.length) {
    console.log(`>>> Manga loaded from cache`);
  }

  // // Only fetch new mentions in production
  // if (process.env.ELEVENTY_ENV === "development") 
  return sortManga(cache.data);

  // console.log(">>> Downloading manga list...");
  // const newManga = await fetchBooks(cache.lastFetched);

  // // TODO: getting only new items, merge cache and new

  // if (!newManga) {
  //   return sortManga(cache.data);
    
  // }

  // const newData = {...cache.data, ...newManga}
  
  // const newCache = {
  //   lastFetched: new Date().toISOString(),
  //   data: newData,
  // };

  // if (process.env.ELEVENTY_ENV === "devbuild") {
  //   writeToCache(newCache, CACHE_FILE_PATH, "manga");
  // }

  // return sortManga(newData);
};
