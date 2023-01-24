const groupBy = require("lodash/groupBy");
const fs = require("fs");
const domain = require("./metadata.json").domain;
const {readFromCache} = require("../_11ty/helpers");

// // Define Cache Location and API Endpoint
const CACHE_FILE_PATH = "src/_cache/books.json";


const tierOrder = {
    'S' : 0,
    'A' : 1,
    'B' : 2,
    'C' : 3,
    'D' : 4,
    'F' : 5,
    '' : 999999
}

function sortBooks(books) {
    const sorted = {}
    const groupedBooks = groupBy(books, "year_read")

    for (year in groupedBooks) {
        const yearBooks = groupedBooks[year];
        yearBooks.sort((a, b) => {
            // books[year].sort((a, b)=>{
            if (a.tier !== b.tier) {
                return  tierOrder[a.tier ?? ''] - tierOrder[b.tier ?? ''];
            }

            if (a.date_read && b.date_read) {
                return new Date(b.date_read) - new Date(a.date_read);
            }

            return 0; // todo
        })
        sorted[year] = yearBooks;
    }

    return sorted;
}

module.exports = async function () {
    // return [];
    console.log(">>> Reading books from cache...");
    const cache = readFromCache(CACHE_FILE_PATH);

    if (Object.keys(cache.data).length) {
        console.log(`>>> Books loaded from cache`);
    }

    // Only fetch new mentions in production
    // if (process.env.ELEVENTY_ENV === "development") 
    return sortBooks(cache.data);

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
