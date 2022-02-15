// TODO: add delay for another call
async function fetchFromNotion(notion, dbId, p = {}, cursor = undefined) {
  const response = await notion.databases.query({
    database_id: dbId,
    filter: p,
    start_cursor: cursor,
  });

  if (response.results) {
    if (response.next_cursor) {
      return response.results.concat(await fetchFromNotion(notion, dbId, p, response.next_cursor));
    }

    return response.results;
  }
  return [];
}

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
