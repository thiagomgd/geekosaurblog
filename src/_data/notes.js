const fetch = require("node-fetch");
const unionBy = require("lodash/unionBy");
const fs = require("fs");
const domain = require("./metadata.json").domain;
const { readFromCache, writeToCache, getLocalImageLink, replaceNotionMarkdown } = require("../_11ty/helpers");

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
  const imagesNotion = note.properties.Images.files;
  const images = []
  for (const img of imagesNotion) {
    const imageUrl = img.type === 'external' ? img.external.url : img.file.url ;
    const fileName = `${note.id.substr(0, note.id.indexOf("-"))}-${img.name}`;
  
    // if (img.file.url.includes("secure.notion-static.com") && !process.env.ELEVENTY_ENV === "devbuild") break;

    // if (!process.env.ELEVENTY_ENV === "devbuild") {
    //   images.push(img.file.url);
    //   break;
    // }
    const imagePath = getLocalImageLink(imageUrl, fileName, 'notes')
    
    images.push(imagePath);
  }

  return images;
}

const getEmbed = (note) => {
  return note.properties.Embed.url;
}

const getFormat = (note) => {
  return note.properties.Format.select ? note.properties.Format.select.name : 'text';
}

async function fetchPage(pageId) {
  const mdblocks = await n2m.pageToMarkdown(pageId);
  // console.debug(`---------------`);
  // console.debug(mdblocks);

  const mdString = n2m.toMarkdownString(mdblocks);
  // console.debug(`---------------`);
  // console.debug(mdString);
  // console.debug(`---------------`);
  return mdString;
  // return replaceNotionMarkdown(mdString);
}

async function fetchNotes(since) {
  if (!DATABASE_ID || !TOKEN) {
    console.warn(">>> unable to fetch notes: missing token or db id");
    return null;
  }

  const newNotes = []
  // only brings first page (100 items) but we should't have more than not in cache
  // TODO: update to use fetch method on books.js
  const response = await notion.databases.query({
    database_id: DATABASE_ID,
    filter: {
      property: 'Created',
      date: {after: since},
    },
    sorts: [
      {
        timestamp: 'created_time',
        direction: 'ascending',
      },
    ],
  });

  if (response.results) {
    console.log(
      `>>> ${response.results.length} new notes fetched`
    );

    for (const note of response.results) {
      const noteContent = await fetchPage(note.id)
      const newNote = {
        ...getMetadata(note),
        content: noteContent,
        title: getTitle(note),
        tags: getTags(note),
        images: getImages(note),
        format: getFormat(note),
        embed: getEmbed(note)
      }
      newNotes.push(newNote);
    }
    return newNotes;
  }

  return null;
}

// Append fresh notes to cached entries
function mergeNotes(a, b) {
  return a.notes.concat(b)
}

module.exports = async function () {
  console.log(">>> Reading notes from cache...");
  const cache = readFromCache(CACHE_FILE_PATH);

  if (cache.notes.length) {
    console.log(`>>> ${cache.notes.length} notes loaded from cache`);
  }

  // Only fetch new notes in production
  if (process.env.ELEVENTY_ENV === "development") return cache.notes;

  console.log(">>> Checking for new notes...");
  const newNotes = await fetchNotes(cache.lastFetched);

  if (newNotes) {
    const notes = {
      lastFetched: new Date().toISOString(),
      notes: mergeNotes(cache, newNotes),
    };

    if (process.env.ELEVENTY_ENV === "devbuild") {
      writeToCache(notes, CACHE_FILE_PATH, "notes");
    }
    
    return notes.notes;
  }

  return cache.notes;
};
