const fetch = require("node-fetch");
const unionBy = require("lodash/unionBy");
const domain = require("./metadata.json").domain;
const { readFromCache, writeToCache } = require("../_11ty/helpers");

const { Client } = require('@notionhq/client');
// https://github.com/souvikinator/notion-to-md
const { NotionToMarkdown } = require("notion-to-md");

// Define Cache Location and API Endpoint
const CACHE_FILE_PATH = "src/_cache/notes.json";
const DATABASE_ID = "66ebf4c34b694d0a94763b3936d9cd9b";
const TOKEN = process.env.NOTION_API_KEY

const notion = new Client({ auth: TOKEN });
const n2m = new NotionToMarkdown({ notionClient: notion });

const getMetadata = (note) => {
  return {
    id: note.id,
    "created_time": note.created_time,
    "last_edited_time": note.last_edited_time,
    "cover": note.cover,
    "icon": note.icon,
  }
}

const getTitle = (note) => {
  return note.properties.Title.title[0].plain_text
}

const getTags = (note) => {
  const notionTags = note.properties.Tags.multi_select
  return notionTags.map(tag => tag.name);
}

const getImages = (note) => {
  // const notionTags = note.properties.Tags.multi_select
  // return notionTags.map(tag => tag.name);
  return [];
}

const getFormat = (note) => {
  const format = note.properties.Format.select.name
  return format ? format : 'text';
}

async function fetchPage(pageId) {
  const mdblocks = await n2m.pageToMarkdown(pageId);
  const mdString = n2m.toMarkdownString(mdblocks);

  return mdString
}

async function fetchNotes(since) {
  // If we dont have a domain name or token, abort
  if (!DATABASE_ID || !TOKEN) {
    console.warn(">>> unable to fetch notes: missing token or db id");
    return null;
  }

  const newNotes = []
  // let url = `${API}/mentions.jf2?domain=${domain}&token=${TOKEN}&per-page=${perPage}`;
  // if (since) url += `&since=${since}`; // only fetch new mentions

  // const response = await fetch(url);

  //  instead was `undefined`. body.filter.date should be defined, instead was `undefined`. body.filter.people should be defined, instead was `undefined`. body.filter.files should be defined, instead was `undefined`. body.filter.url should be defined, instead was `undefined`. body.filter.email should be defined, instead was `undefined`. body.filter.phone should be defined, instead was `undefined`. body.filter.phone_number should be defined, instead was `undefined`. body.filter.relation should be defined, instead was `undefined`. body.filter.created_by should be defined, instead was `undefined`. body.filter.property should be defined, instead was `undefined`. body.filter.last_edited_by should be defined, instead was `undefined`. body.filter.last_edited_time should be defined, instead was `undefined`. body.
  // only brings first page (100 items) but we should't have more than not not in cache
  const response = await notion.databases.query({
    database_id: DATABASE_ID,
    // filter: {
    //   property: 'created_time',
    //   created_time: {after: since},
    // },
    sorts: [
      {
        timestamp: 'created_time',
        direction: 'ascending',
      },
    ],
  });

  if (response.results) {
    const feed = response; //await response.json();
    console.log(
      `>>> ${feed.results.length} new notes fetched`
    );

    for (const note of feed.results) {
      const noteContent = await fetchPage(note.id)
      const newNote = {
        ...getMetadata(note),
        content: noteContent,
        title: getTitle(note),
        tags: getTags(note),
        images: getImages(note),
        format: getFormat(note)
      }
      newNotes.push(newNote);
    }
    return newNotes;
  }

  return null;
}

// Merge fresh webmentions with cached entries, unique per id
function mergeWebmentions(a, b) {
  // console.log("a", a);
  // console.log("a", b);
  // // return unionBy(a.children, b.children, "wm-id");

  // TODO: for now, force returning all from Notion - cache is useless
  // return a.notes.concat(b)
  return b
}

module.exports = async function () {
  console.log(">>> Reading notes from cache...");
  const cache = readFromCache(CACHE_FILE_PATH);

  if (cache.notes.length) {
    console.log(`>>> ${cache.notes.length} notes loaded from cache`);
  }

  // Only fetch new mentions in production
  if (process.env.ELEVENTY_ENV === "development") return cache.notes;

  console.log(">>> Checking for new notes...");
  const newNotes = await fetchNotes(cache.lastFetched);

  if (newNotes) {
    const notes = {
      lastFetched: new Date().toISOString(),
      notes: mergeWebmentions(cache, newNotes),
    };

    if (process.env.ELEVENTY_ENV === "devbuild") {
      writeToCache(notes, CACHE_FILE_PATH, "notes");
    }
    
    return notes.notes;
  }

  return cache.notes;
};
