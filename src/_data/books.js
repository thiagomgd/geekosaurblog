const groupBy = require("lodash/groupBy");
const fs = require("fs");
const domain = require("./metadata.json").domain;
const {readFromCache} = require("../_11ty/helpers");

// // Define Cache Location and API Endpoint
const CACHE_FILE_PATH = "src/_cache/goodreads.json";


// const tierOrder = {
//     'S' : 0,
//     'A' : 1,
//     'B' : 2,
//     'C' : 3,
//     'D' : 4,
//     'F' : 5,
//     '' : 999999
// }

function sortBooks(booksParam) {
    const sorted = {}
    // const books = booksParam.filter()
    const groupedBooks = groupBy(booksParam, "yearRead")

    for (year in groupedBooks) {
        const booksOfYear = groupedBooks[year];
        // console.debug(booksOfYear);
        const yearBooks = booksOfYear.filter(value => value.type === "book" || value.type === "light novel").filter(value => value.status === 'finished');

        yearBooks.sort((a, b) => {
            // books[year].sort((a, b)=>{
            // if (a.tier !== b.tier) {
            //     return  tierOrder[a.tier ?? ''] - tierOrder[b.tier ?? ''];
            // }

            if (a.dateRead && b.dateRead) {
                return new Date(b.dateRead) - new Date(a.dateRead);
            }

            return 0; // todo
        })

        const newYear = year !== "undefined" ? year : 0;
        
        sorted[newYear] = yearBooks;
    }

    return sorted;
}

module.exports = async function () {
    // return [];
    console.log(">>> Reading books from cache...");
    const cache = readFromCache(CACHE_FILE_PATH);

    if (Object.keys(cache).length) {
        console.log(`>>> Books loaded from cache`);
    }

    // Only fetch new mentions in production
    // if (process.env.ELEVENTY_ENV === "development") 
    return sortBooks(cache);

    // console.log(">>> Checking for new books...");
    // const newBooks = await fetchBooks(cache.lastFetched);

    // if (!newBooks) {
    //     return sortBooks(cache.data);
    // }

    // const newData = {...cache.data, ...newBooks}

    // const newCache = {
    //     lastFetched: new Date().toISOString(),
    //     data: newData,
    // };

    // if (process.env.ELEVENTY_ENV === "devbuild") {
    //     writeToCache(newCache, CACHE_FILE_PATH, "books");
    // }

    // return sortBooks(newData);
};
