const groupBy = require("lodash/groupBy");
const { readFromCache, writeToCache } = require("../_11ty/helpers");
const { fetchFromNotion, getNotionProps } = require("../_11ty/notionHelpers");

const { Client } = require("@notionhq/client"); const metadata = require("./metadata.json");
const {sortBy} = require("lodash/collection");

// // Define Cache Location and API Endpoint
const CACHE_FILE_PATH = "src/_cache/manga.json";
const TOKEN = process.env.NOTION_API_KEY;
// const imageFolder = "/img/books/"

const notion = new Client({ auth: TOKEN });

// const getImages = (note) => {
//   const imagesNotion = note.properties.Images.files;
//   const images = []
//   for (const img of imagesNotion) {
//     const fileName = `${note.id.substr(0, note.id.indexOf("-"))}-${img.name}`;
//     const path = `./src${imageFolder}${fileName}`;
//     const imagePath = `${imageFolder}${fileName}`;

//     if (img.file.url.includes("secure.notion-static.com") && !process.env.ELEVENTY_ENV === "devbuild") break;

//     if (!process.env.ELEVENTY_ENV === "devbuild") {
//       images.push(img.file.url);
//       break;
//     }

//     if (!fs.existsSync(path)) {
//       fetch(img.file.url)
//         .then(res =>
//           res.body.pipe(fs.createWriteStream(path))
//         )
//     }
//     images.push(imagePath);
//   }

//   return images;
// }

async function fetchBooks(since) {
  // If we dont have a domain name or token, abort
  if (!metadata["notion_books"] || !TOKEN) {
    console.warn(">>> unable to fetch books: missing token or db id");
    return null;
  }

  const p = {
    and: [
      { property: "Edited", date: { after: since } },
      {
        property: "Status",
        select: {
          equals: "read",
        },
      },
      {
        or: [
          {
            property: "Type",
            select: {
              equals: "manga",
            },
          },
          {
            property: "Type",
            select: {
              equals: "comic",
            },
          },
        ],
      },
    ],
  };

  const results = await fetchFromNotion(notion, metadata["notion_books"], p);

  if (results) {
    const newManga = {};
    console.log(`>>> ${results.length} new manga fetched`);

    for (const book of results) {
      const newBook = getNotionProps(book, false);

      newManga[book.id] = {
        title: newBook["Title"],
        cover: newBook["Cover"],
        rating: newBook["My Rating"],
        review: newBook["Review"],
        series: newBook["Series"],
        volume: newBook["Number In Series"],
        date_read: newBook["Date Read"],
        year_read: newBook["Date Read"]
          ? newBook["Date Read"].year
          : 0,
      };
    }

    
    return newManga;
  }

  return null;
}


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

  // Only fetch new mentions in production
  if (process.env.ELEVENTY_ENV === "development") return sortManga(cache.data);

  console.log(">>> Downloading manga list...");
  const newManga = await fetchBooks(cache.lastFetched);

  // TODO: getting only new items, merge cache and new

  if (!newManga) {
    return sortManga(cache.data);
    
  }

  const newData = {...cache.data, ...newManga}
  
  const newCache = {
    lastFetched: new Date().toISOString(),
    data: newData,
  };

  if (process.env.ELEVENTY_ENV === "devbuild") {
    writeToCache(newCache, CACHE_FILE_PATH, "manga");
  }

  return sortManga(newData);
};
