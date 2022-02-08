// TODO: add delay for another call
async function fetchFromNotion(notion, dbId, p = {}, cursor = undefined) {
  // console.log("query", cursor);

  const response = await notion.databases.query({
    database_id: dbId,
    filter: p,
    start_cursor: cursor,
  });

  if (response.results) {
    // console.log("response", response.next_cursor);
    // console.log('response!', response);
    if (response.next_cursor) {
      return response.results.concat(await fetchFromNotion(notion, dbId, p, response.next_cursor));
    }

    return response.results;
  }
  return [];
}

//  {
//     'Date Read': { id: 'DUjF', type: 'date', date: [Object] },
//     Author: { id: 'JSDc', type: 'select', select: [Object] },
//     'Year Published': { id: 'Lh%3BP', type: 'number', number: 2020 },
//     'Date Added': { id: 'NsVl', type: 'date', date: [Object] },
//     'Average Rating': { id: 'QOie', type: 'number', number: 4.19 },
//     Link: {
//       id: 'VVMi',
//       type: 'url',
//       url: 'https://www.goodreads.com/book/show/53510316'
//     },
//     'Original Publication Year': { id: 'W_Q%7B', type: 'number', number: 2012 },
//     'Additional Authors': { id: 'Zjto', type: 'multi_select', multi_select: [] },
//     'Important Notes': { id: '%5CdFP', type: 'rich_text', rich_text: [] },
//     Bookshelves: { id: '%5CmGR', type: 'multi_select', multi_select: [] },
//     'Book Id': { id: '%5Dap%5E', type: 'number', number: 53510316 },
//     'Date Started': { id: '%5Dxzg', type: 'date', date: null },
//     Publisher: { id: '_%3EIq', type: 'select', select: [Object] },
//     Status: { id: '%60zz5', type: 'select', select: [Object] },
//     Series: { id: 'cKQS', type: 'select', select: [Object] },
//     Type: { id: 'oc%5E%3D', type: 'select', select: [Object] },
//     Review: {
//       id: 'sLk_',
//       type: 'url',
//       url: 'https://geekosaur.com/post/book-notes-wool-silo-1/'
//     },
//     Binding: { id: 'sgm%7C', type: 'select', select: [Object] },
//     'Number of Pages': { id: 'vbCK', type: 'number', number: 594 },
//     Genres: { id: 'vkPD', type: 'multi_select', multi_select: [Array] },
//     ISBN: { id: 'w%3FLY', type: 'rich_text', rich_text: [] },
//     ISBN13: { id: 'w%5DGR', type: 'rich_text', rich_text: [] },
//     'Number In Series': { id: 'yzDG', type: 'number', number: 1 },
//     'My Rating': { id: '%7BgX%7C', type: 'number', number: 5 },
//     Cover: { id: '~-~%25', type: 'files', files: [Array] },
//     Title: { id: 'title', type: 'title', title: [Array] }
// }
// Date Read
// Author
// Year Published
// Date Added
// Average Rating
// Link
// Original Publication Year
// Additional Authors
// Important Notes
// Bookshelves
// Book Id
// Date Started
// Publisher
// Status
// Series
// Type
// Review
// Binding
// Number of Pages
// Genres
// ISBN
// ISBN13
// Number In Series
// My Rating
// Cover
// Title

function _title(prop) {
  return prop["title"][0]["plain_text"];
}

function _rich_text(prop) {
  if (prop["rich_text"] && prop["rich_text"].length > 0) {
    return prop["rich_text"][0]["plain_text"];
  }
  return "";
}

function _number(prop) {
  return prop["number"];
}

function _url(prop) {
  return prop["url"];
}

function _checkbox(prop) {
  return prop["checkbox"];
}

function _date(prop) {
  const dt = prop["date"];
  if (!dt || !dt.start) return undefined;
  
  // TODO: read end date?
  return new Date(dt.start);

  // if (!dt) return null;

  // const text = dt["start"];

  // if text == None or text == '':
  //     return None

  // date = datetime.strptime(text[:10], "%Y-%m-%d")
  // return date
}

function _files(prop) {
  files = prop["files"];

  if (files.length == 0) return [];

  // TODO: return all files
  return files[0]["external"]["url"];
}

function _select(prop) {
  const val = prop["select"];
  if (!val) return "";

  return val["name"];
}

function _multi_select(prop) {
  if (!prop["multi_select"]) return [];

  return prop["multi_select"].map((item) => item["name"]);
}

function _relation(prop) {
  if (!prop["relation"]) return [];

  return prop["relation"].map((item) => item["id"]);
}

function _created_time(prop) {
  return prop["created_time"];
}

const NOTION_TO_DICT = {
  number: _number,
  date: _date,
  files: _files,
  select: _select,
  title: _title,
  rich_text: _rich_text,
  multi_select: _multi_select,
  url: _url,
  checkbox: _checkbox,
  relation: _relation,
  created_time: _created_time,
};

function getNotionProps(thing) {
  const parsed = {};

  for (const key of Object.keys(thing.properties)) {
    const prop = thing.properties[key];

    if (prop && NOTION_TO_DICT[prop.type]) {
      parsed[key] = NOTION_TO_DICT[prop.type](prop);
    }
  }
  return parsed;
}

module.exports = {
  fetchFromNotion,
  getNotionProps,
};
