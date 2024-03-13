---
date: 2022-02-15T16:00:00Z
title: "Notes Section: From Notion To Eleventy"
description: How to write notes on Notion and publish with Eleventy
lead: ""
draft: false
slug: eleventy-notion-notes-section
tags:
  - automating
toc: true
---

Recently I added a notes section here. The idea is that it's easier for me to post short thoughts and updates, and also it's something easier to search, organize and reference in the future. This is because if I post directly on Twitter, it's kind of gone forever.

So, I decided to make a way for me to write my thoughts directly on Notion (notion.so), and have it automagically rendered on the blog as part of a *notes* section. I'm not 100% finished, as there's a few more things that I want to add, like *tags* for example, but what I have now is complete enough for the to use comfortably.

## Part 1 - Create Notion Database

This part is basically creating a new database on Notion so I can use it to write the posts on.

As columns you have Title (renamed from Name), Tags, Images, Embed, Format and Created. Tags are not yet used to filter on the blog, but at least what I have is already organized. Format is not yet used, but I guess in the future I might want to do something like some Tumblr templates and have different layouts for gallery and music for example. Created is a calculated field that is just when the note was created. This is because I couldn't find how to filter by *created_time*, which is the internal value. Then I just need to write the notes normally in each page, since I load then as markdown later.

## Part 2 - Get Notes On Eleventy

One thing I absolutely love on Eleventy is how I can have anything as source data. A folder with markdown files, a single json file, a javascript that will load a json and import more things and then create the collection. On *_data*, my Eleventy data folder, I created *notes.js*, which loads the notes from Notion, does some processing, and then saves it on a cache in *_cache/notes.json*.

### The Data File

To load data from Notion, I used the official npm package from Notion[^notionclient], and then to get all formatted to markdown, I used notion-to-md[^notionmd]. The core of it is below, and was based on the webmentions code I have that I got from sia.codes[^siacodes]:

```javascript
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
      notes: mergeNotes(cache, newNotes),
    };

    writeToCache(notes, CACHE_FILE_PATH, "notes");
    
    return notes.notes;
  }

  return cache.notes;
};
```

I have helper functions to read and write to/from cache, which you can see my helper file[^helper]. Note that I have a *devbuild* process because I only want to save cache when running *npm run build:local*. And *development* will not fetch any new thing (notes, webmentions, etc) and only use cached data. My package.json has:

```
"scripts": {
    "start": "ELEVENTY_ENV=development NOTION_API_KEY=$ENV_NOTION_TOKEN npx @11ty/eleventy --serve",
    "build:local": "ELEVENTY_ENV=devbuild NOTION_API_KEY=$ENV_NOTION_TOKEN npx @11ty/eleventy",
    "build": "NOTION_API_KEY=$ENV_NOTION_TOKEN npx @11ty/eleventy",
    "debug": "DEBUG=* npx @11ty/eleventy"
  },
```

### Fetch From Notion

```javascript
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
```

Notion's API only returns 100 notes each time, but that's ok since at least once a week I do a *npm run build:local* and update the cache. Anyway, I solved this in another data source (books.js[^books]) that uses my notion helpers code[^notion]. But ~~I'm lazy~~ I wanted to show you the basic on fetching that data :)

### Proccess Notion Data And Download Images

Those `getXYZ` methods are done on the helper too in a general way (except for images), but let see:

```javascript
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

const getEmbed = (note) => {
  return note.properties.Embed.url;
}

const getFormat = (note) => {
  return note.properties.Format.select ? note.properties.Format.select.name : 'text';
}

const getImages = (note) => {
  const imagesNotion = note.properties.Images.files;
  const images = []
  for (const img of imagesNotion) {
    const fileName = `${note.id.substr(0, note.id.indexOf("-"))}-${img.name}`;
    const imagePath = getLocalImageLink(img.file.url, fileName, 'notes')
    
    images.push(imagePath);
  }

  return images;
}
```

All pretty straightforward, except for `getImages`, which has to download images. That's because Notion returns image urls that expire, so it's a no-go. I extracted the download method into a helper function, so I can download all external images that I use via the figure shortcode, and serve it locally. Please refer to `helper.js`[^helper] for all helper functions, but the main code is below:

```javascript
function getLocalImageLink(imgUrl, fileName = "", folder = "ext") {
  if (!imgUrl) return "";

  if (!external.test(imgUrl) || process.env.ELEVENTY_ENV === "development") {
    return imgUrl;
  }

  const cache = readFromCache(IMG_CACHE_FILE_PATH);
  if (cache[imgUrl]) {
    return cache[imgUrl].url;
  }

  const fn = fileName || getFileName(imgUrl);
  const imagePath = `/img/${folder}/${fn}`;
  const path = `./src${imagePath}`;

  if (!fs.existsSync(path)) {
    fetch(imgUrl).then((res) => res.body.pipe(fs.createWriteStream(path)));
    cache[imgUrl] = { url: imagePath };
    writeToCache(cache, IMG_CACHE_FILE_PATH, "images");
  } else {
    console.error("> collision downloading image");
  }

  return imagePath;
}
```

The logic is simple: skip if no url (for my thumbnails), skip if it's a local image or is development mode. Otherwise, try to see if it's already cached, and return that local url. If not, download and save the local url on cache. The reason I'm caching `cache[imgUrl].url` is because I want to at some point optimize images and keep the original, so I would also have `cache[imgUrl].optimizedUrl`.

## Part 3 - Adding The Section And Individual Pages

I created a `notes` folder with 2 files: `notes.md` and `note.md`. One for the whole list, and another for individual items. As I mentioned, it's still incomplete, but it's all you need to see the notes on your blog.

For the `notes.md`[^notes] file, this is how I show everything:

![](https://i.imgur.com/m9DZZoh.png)

_update: currently there's a bug with `eleventyComputed.date`. You need to use `created_date`, and use `{{ page.data.created_date or page.date }}` on the template_

`anyEmbed` [^shortcodes] is my shortcode to embed "anything". Basically, it checks the url, and then call the correct shortcode. For now it's only Youtube and Reddit, but I'll add Twitter, and also a basic *unfurl* that render a card/preview if it's a link I don't have an embed to. _Edit: I added unfurl and moved anyEmbed to asyncShortcodes_.

_Another thing I didn't mention originally: I use the **embed** field in notion for that, but notion-to-md will give me `[embed](link)` and `[bookmark](link)`, so I could just update markdown-it's config so all links named like that are rendered as anyEmbed. That would allow me to actually use Notion for regular posts, which could contain more embeds. But I would still need to update how I fetch and update my Notion cache, so I could update posts after they are created. But that should be trivial. Feel free to reach out [@FalconSensei](https://twitter.com/FalconSensei) if you want some ideas_

The only difference to the individual `note.md` on that, is that I don't cycle through all notes. This is the frontmatter for the individual pages, to enable it being generated on for all notes, with the correct thumbnails and everything:

![Frontmatter (for some reason, embedding frontmatter code breaks the post](https://i.imgur.com/6nw0vl8.png)

You can see my filters file[^filters] for those filters, but what they do is basically: generate the twitter exerpt from the content, and get the thumbnail, which would be the first image (if any).

## Part 4 - IT'S ALIVE!

That's it! You should have it working like mine!

## Part 5: Bonus for iOS users

Now, I can write the notes on my phone, but I still need to trigger a build. My blog only rebuilds automatically once a day, and I don't want to go to the computer to call the webhook. Since I use Cloudflare Pages, I have a webhook that I can POST to to trigger a rebuild. With iOS shortcuts, I can call it from my phone. See below for example:

![](https://i.imgur.com/rs8n76D.png)

I cut off the first step, which is just defining the URL for the webhook (copied from cloudflare pages), but then add a second step to load the contents of a URL, using the POST method and it's done!

[^helper]: https://github.com/thiagomgd/geekosaurblog/blob/main/src/_11ty/helpers.js

[^notion]: https://github.com/thiagomgd/geekosaurblog/blob/main/src/_11ty/notionHelpers.js

[^filters]: https://github.com/thiagomgd/geekosaurblog/blob/main/src/_11ty/filters.js

[^shortcodes]: https://github.com/thiagomgd/geekosaurblog/blob/main/src/_11ty/asyncShortcodes.js

[^notes]: https://github.com/thiagomgd/geekosaurblog/blob/main/src/notes/notes.md

[^books]: https://github.com/thiagomgd/geekosaurblog/blob/main/src/_data/books.js

[^notionclient]: https://www.npmjs.com/package/@notionhq/client

[^siacodes]: https://github.com/siakaramalegos/sia.codes-eleventy/commit/d7318565917b1342b38d6b3bff4e3e548276afca

[^notionmd]: https://www.npmjs.com/package/notion-to-md
