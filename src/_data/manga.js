const groupBy = require("lodash/groupBy");
const { readFromCache } = require("../_11ty/helpers");

const metadata = require("./metadata.json");
const {sortBy} = require("lodash/collection");

const CACHE_FILE_PATH = "src/_cache/goodreads.json";

function sortManga(manga) {
  const perYear = groupBy(manga, "yearRead");
  const grouped = {};

  Object.keys(perYear).forEach((year)=>{
    const yearManga = perYear[year].filter(value => value.type === "manga" || value.type === "comic").filter(value => value.status === 'finished');

    if (yearManga.length === 0) {
      return;
    }

    const newYear = year !== "undefined" ? year : 0;
     const asd = groupBy(yearManga, 'series');
     grouped[newYear] = asd;
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
  return sortManga(cache);

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
