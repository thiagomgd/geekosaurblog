const groupBy = require("lodash/groupBy");
const { parse } = require("csv-parse/sync");
const fs = require("fs");
// const fs = require("fs");
// const domain = require("./metadata.json").domain;

// // Define Cache Location and API Endpoint
const CACHE_FILE_PATH = "src/_cache/thestorygraph.csv";

function readCSV() {
  const input = fs.readFileSync(CACHE_FILE_PATH);
  // console.log(input);
  const records = parse(input, {
    columns: true,
    skip_empty_lines: true,
  });
  // console.log("record 1", records[0]);
  console.log(`${records.length} books found.`);
  return records;
}

function filterBooks(book) {
  return (
    book["Read Status"] === "read" &&
    !book["Tags"].includes("manga") &&
    !book["Tags"].includes("comics") &&
    !book["Tags"].includes("graphic-novels")
  );
}

function mapBooks(book) {
  const dateRead = book["Last Date Read"]
    ? new Date(book["Last Date Read"])
    : null;

  const yearRead = dateRead ? dateRead.getFullYear() : 0;
  return {
    ...book,
    dateRead,
    yearRead,
  };
}

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
  const sorted = {};
  // const books = booksParam.filter()
  const groupedBooks = groupBy(booksParam, "yearRead");

  for (const year in groupedBooks) {
    const yearBooks = groupedBooks[year];

    yearBooks.sort((a, b) => {
      // books[year].sort((a, b)=>{
      // if (a.tier !== b.tier) {
      //     return  tierOrder[a.tier ?? ''] - tierOrder[b.tier ?? ''];
      // }

      if (a.dateRead && b.dateRead) {
        return b.dateRead - a.dateRead;
      }

      return 0; // todo
    });

    sorted[year] = yearBooks;
  }

  return sorted;
}

module.exports = async function () {
  console.log(">>> Reading books from cache...");
  const books = readCSV().filter(filterBooks).map(mapBooks);

  return sortBooks(books);
};
