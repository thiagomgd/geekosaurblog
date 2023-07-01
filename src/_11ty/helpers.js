const fs = require("fs");
const axios = require("axios");

const Image = require("@11ty/eleventy-img");
const metadata = require("../_data/metadata.json");
const { getTootSlug } = require("../_11ty/filters");
const unionBy = require("lodash/unionBy");
const cheerio = require("cheerio");
const fetch = require("node-fetch");
const IMG_CACHE_FILE_PATH = "src/_cache/images.json";
const external = /https?:\/\/((?:[\w\d-]+\.)+[\w\d]{2,})/i;

const SOCIAL_PATH = "src/_data/social.json";

function readSocialLinks() {
  if (fs.existsSync(SOCIAL_PATH)) {
    const cacheFile = fs.readFileSync(SOCIAL_PATH);
    return JSON.parse(cacheFile);
  }

  return {};
}

function saveSocialLinks(data) {
  if (process.env.ELEVENTY_ENV !== "devbuild") return;

  const fileContent = JSON.stringify(data, null, 2);

  // create cache folder if it doesnt exist already
  // if (!fs.existsSync(dir)) {
  //     fs.mkdirSync(dir);
  // }

  fs.writeFileSync(SOCIAL_PATH, fileContent, (err) => {
    if (err) throw err;
    console.log(`>>> social links cached to ${SOCIAL_PATH}`);
  });
}

// get cache contents from json file
function readFromCache(cacheFilePath) {
  if (fs.existsSync(cacheFilePath)) {
    const cacheFile = fs.readFileSync(cacheFilePath);
    return JSON.parse(cacheFile);
  }

  // no cache found.
  return {
    lastFetched: null,
  };
}

// save combined webmentions in cache file
function writeToCache(data, cacheFilePath, descriptor) {
  // Don't actually write to cache on dev or cloudflare
  if (process.env.ELEVENTY_ENV !== "devbuild") return;

  const dir = "src/_cache";
  const fileContent = JSON.stringify(data, null, 2);
  // create cache folder if it doesnt exist already
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }
  // write data to cache json file
  fs.writeFileSync(cacheFilePath, fileContent, (err) => {
    if (err) throw err;
    console.log(`>>> ${descriptor} cached to ${cacheFilePath}`);
  });
}

function hash(text) {
  "use strict";

  var hash = 5381,
    index = text.length;

  while (index) {
    hash = (hash * 33) ^ text.charCodeAt(--index);
  }

  const hashNumber = hash >>> 0;
  return hashNumber.toString();
}

function shortHash(text) {
  return hash(text).substring(0, 7);
}

function getFileName(url) {
  // get the filename from the path
  const pathComponents = url.split("/");

  // break off cache busting string if there is one
  let filename = pathComponents[pathComponents.length - 1].split("?");
  return `${shortHash(url)}-${filename[0]}`;
}

async function getLocalImageLink(imgUrl, folder = "", fileName = "") {
  if (!imgUrl) return "";

  // skip local images
  if (!external.test(imgUrl)) {
    return imgUrl;
  }

  const cache = readFromCache(IMG_CACHE_FILE_PATH);

  if (cache[imgUrl]) {
    const filePath = `./src${cache[imgUrl].url}`;
    if (fs.existsSync(filePath)) {
      return cache[imgUrl].url;
    }
    // it's probably downloading, fallback to remote url
    return imgUrl;
  }

  if (process.env.ELEVENTY_ENV !== "devbuild") return imgUrl;

  // // for now, don't download more images
  // return;
  const fd = folder || "ext";

  const fn = fileName || getFileName(imgUrl);
  const imagePath = `/img/${fd}/${fn}`;
  const path = `./src${imagePath}`;

  try {
    const localUrl = await downloadImage(imgUrl, path);
    console.log("!!!!", localUrl);
    cache[imgUrl] = { url: imagePath };
    writeToCache(cache, IMG_CACHE_FILE_PATH, "images");
  } catch (error) {
    console.error("oops", error);
    // return imgUrl;
  }

  return imgUrl;
}

async function downloadImage(url, filename) {
  const response = await axios.get(url, { responseType: "arraybuffer" });

  fs.writeFile(filename, response.data, (err) => {
    if (err) throw new Error("error downloading image", url);
    console.log("Image downloaded successfully!");
  });
}

function getOptimizeMetadata(metadata) {
  let outputs;
  if ("webp" in metadata) {
    outputs = metadata["webp"];
  } else if ("gif" in metadata) {
    outputs = metadata["gif"];
  } else if ("png" in metadata) {
    outputs = metadata["png"];
  } else {
    outputs = metadata["jpeg"];
  }
  // console.debug("outputs", outputs);
  return outputs[outputs.length - 1];
}

async function optimizeImage(src, outputDir = "_site/img") {
  if (!src) {
    return src;
  }

  let fileSource = src.startsWith("/img/")
    ? `./src${src}`
    : src.startsWith("img/")
    ? `./src/${src}`
    : src.startsWith("/src/")
    ? `.${src}`
    : src;

  fileSource = fileSource.replace(/%20/g, " ");

  const extraProps = src.includes(".gif")
    ? {
        formats: ["gif"], //["webp", "gif"],
        sharpOptions: {
          animated: true,
        },
      }
    : { formats: ["jpeg"] };

  let metadata = await Image(fileSource, {
    widths: [1200],
    outputDir: outputDir,
    cacheOptions: {
      duration: "8w",
    },
    ...extraProps,
  });

  // console.debug(metadata);
  return getOptimizeMetadata(metadata);
}

async function getOptimizedUrl(src, outputDir = "_site/img", toReturn = "url") {
  // console.log("!!!!!!getOptimizedUrl", src, outputDir, toReturn);
  const data = await optimizeImage(src, outputDir);

  if (!data) return data;

  return data[toReturn];
}

/* MASTODON */

async function fetchToots() {
  if (!metadata.bridgy_mastodon || process.env.ELEVENTY_ENV === "development")
    return [];

  const resp = await fetch(
    `https://${metadata.author.mastodon_instance}/api/v1/accounts/${metadata.author.mastodon_id}/statuses?limit=40&exclude_replies=true&exclude_reblogs=true`
  );

  if (!resp.ok) {
    console.warn("Error getting user toots");
    return [];
  }

  const responseJson = await resp.json();

  console.log(`>>> Fetched toots ${responseJson.length}`);
  // console.log(responseJson);
  return responseJson;
}

function updateToot(post, toots) {
  // const toots = {};
  // console.debug(responseJson);
  let tootUrl = "";

  toots
    //.filter(toot => toot.card)
    .some((toot) => {
      // if (toot.card) {
      //   toots[toot.card.url] = toot.url;
      //   return;
      // }

      const $ = cheerio.load(toot.content, null, false);
      $("a").each((_, link) => {
        // TODO: filter by href domain
        // console.debug($(link).text() , $(link).attr('href'));
        const href = $(link).attr("href");

        //   console.log(`>>> checking link ${post.url} | ${href}`)
        if (href.endsWith(post.url)) {
          console.log(`>>> ${post.url} ${toot.url}`);
          tootUrl = toot.url;
          return true;
        }
      });
      return false;
    });

  return tootUrl;
}

function removeMastoTags(content) {
  const $ = cheerio.load(content, null, false);
  $("a.hashtag").remove();

  $("p").each((_, element) => {
    if (!$(element).text().trim()) {
      $(element).remove();
    }
  });

  return $.html();
}

function getMastoTags(content) {
  const $ = cheerio.load(content, null, false);
  const tags = [];

  $("a.hashtag > span").each((i, span) => {
    tags.push($(span).text());
  });

  return tags;
}

function getMastoLinks(content) {
  const $ = cheerio.load(content, null, false);
  const links = [];

  $("p:has(a)").each((i, p) => {
    let title, url;
    links.push($(p).text());

    $(p).remove();
  });

  return [$.html(), links];
}

function computeMastodonPosts(config, posts) {
  // console.log('--- compute ---', config.host);
  return posts
    .filter((post) => {
      if (!config.postTagFilter) return true;

      // console.log(post.tags.some(tag => config.postTagFilter.includes(tag.name)), post.tags, config.postTagFilter);
      return post.tags.some((tag) => config.postTagFilter.includes(tag));
    })
    .map((post) => {
      const extra = {};
      if (config.posse) {
        const slug = getTootSlug(post);

        (extra.slug = slug), (extra.permalink = `note/${slug}`);
        extra.url = `//geekosaur.com/note/${slug}`;
      }
      // else {
      //     extra.permalink = false
      // }

      return {
        ...post,
        ...extra,
        title: post.title || "🦣",
        createdDate: new Date(post.date),
        isMastodon: true,
        dontBridgy: !config.posse,
        eleventyComputed: {
          tags: config.type === "toots" ? ["note"] : ["link"],
        },
      };
    });
}

const getTootTitleContent = (config, toot) => {
  let title = "";
  let content;

  // TODO: maybe also try splitting when it's not a paragraph?
  // I would need to then add <p> at the beginning of content, remove line break from title
  const [part1, part2] = toot.content.split("<p>---</p>");

  if (part2) {
    title = part1.replace(/(<([^>]+)>)/gi, "");
    content = part2;
    return [title, content];
  }

  if (config.type === "links") {
    let [title, ...content] = toot.content.split("</p>");
    content = content.join("</p>");

    title = title.replace(/(<([^>]+)>)/gi, "");
    return [title, content];
  }

  content = part1;

  return [title, content];
};

const tootIsLinkNotReply = (post) => {
  const isLink =
    (Object.hasOwn(post, "embed") && post["embed"]) ||
    (Object.hasOwn(post, "card") && post["card"]);

  const isReply =
    Object.hasOwn(post, "in_reply_to_id") && post["in_reply_to_id"];

  return isLink && !isReply;
};

const formatMastodonTimeline = (timeline, config) => {
  // console.log('$$$', config.host, !config.preTagFilter);

  const filtered = timeline.filter(
    (post) =>
      // remove posts that are already on your own site.
      !config.removeSyndicates.some((url) => post.content.includes(url)) &&
      (!config.preTagFilter ||
        post.tags.some((tag) => config.preTagFilter.includes(tag.name))) &&
      (!config.type === "links" || tootIsLinkNotReply(post))
  );

  const formatted = filtered.map((post) => {
    const images = post.media_attachments.map((image) => ({
      url: image?.url,
      alt: image?.description,
      width: image?.meta?.small?.width,
      height: image?.meta?.small?.height,
      aspect: image?.meta?.small?.aspect,
    }));

    // console.log(post);
    const [title, content] = getTootTitleContent(config, post);

    const tags = getMastoTags(content);

    // const linkToot = {};

    // if (config.type === "links") {
    // }

    return {
      date: new Date(post.created_at).toISOString(),
      id: post.id,
      title: title,
      content: config.removeTags ? removeMastoTags(content) : content,
      source_url: post.url,
      site: "Mastodon",
      images: images,
      embed: post.card?.url ? post.card.url : null,
      tags: tags, //post.tags doesn't respect capitalization post.tags.map(tag => tag.name),
      emojis: post.emojis,
      tootUrl: post.url,
      host: config.host.split("/")[2],
    };
  });
  // const goodPosts = formatted.filter((post) => {
  //     // for now, don't wanna ignore iamges without alt
  // 	// if (post.media && post.media.alt === null) {
  // 	// 	return false;
  // 	// }
  // 	return true;
  // });

  return formatted;
};

const fetchMastodonPosts = async (config, lastPost) => {
  const queryParams = new URLSearchParams({
    limit: 40,
    exclude_replies: true,
    exclude_reblogs: true,
  });
  if (lastPost) {
    queryParams.set("since_id", lastPost.id);
    console.log(`>>> Requesting posts made after ${lastPost.date}...`);
  }

  const mastodonStatusAPI = `${config.host}/api/v1/accounts/${config.userId}/statuses`;

  const url = new URL(`${mastodonStatusAPI}?${queryParams}`);
  const response = await fetch(url.href);
  if (response.ok) {
    const feed = await response.json();
    // console.log(feed);
    const timeline = formatMastodonTimeline(feed, config);
    console.log(`>>> ${timeline.length} new mastodon posts fetched`);
    return timeline;
  }
  console.warn(">>> unable to fetch mastodon posts", response.statusText);
  return null;
};

// Merge fresh posts with cached entries, unique per id
const mergeMastodonPosts = (cache, feed) => {
  const merged = unionBy(cache.posts, feed, "id");
  return merged
    .sort((a, b) => Date.parse(a.date) - Date.parse(b.date))
    .reverse();
};

const getMastodonPostsForConfig = async (options) => {
  if (!options.host) {
    console.error("No URL provided for the Mastodon server.");
    return;
  }
  if (!options.userId) {
    console.error("No userID provided.");
    return;
  }

  const defaults = {
    removeSyndicates: [],
    cacheLocation: ".cache/mastodon.json",
    posse: true,
    isProduction: true,
    removeTags: false,
    type: "toots",
  };

  const config = { ...defaults, ...options };

  let lastPost;
  console.log(">>> Reading mastodon posts from cache...");
  const cache = readFromCache(config.cacheLocation);

  if (cache.posts.length) {
    console.log(`>>> ${cache.posts.length} mastodon posts loaded from cache`);
    lastPost = cache.posts[0];
  }

  // Only fetch new posts in production
  if (config.isProduction) {
    console.log(">>> Checking for new mastodon posts...");
    const feed = await fetchMastodonPosts(config, lastPost);
    if (feed) {
      const mastodonPosts = {
        lastFetched: new Date().toISOString(),
        posts: mergeMastodonPosts(cache, feed),
      };

      writeToCache(mastodonPosts, config.cacheLocation, "mastodon posts");
      return computeMastodonPosts(config, mastodonPosts.posts);
    }
  }

  // console.log('!!!');
  // console.log(cache.posts);
  return computeMastodonPosts(config, cache.posts);
};

module.exports = {
  readSocialLinks,
  saveSocialLinks,
  readFromCache,
  writeToCache,
  getOptimizeMetadata,
  getOptimizedUrl,
  optimizeImage,
  updateToot,
  fetchToots,
  // searchReddit,
  removeMastoTags,
  getMastoTags,
  getLocalImageLink,
  getMastodonPostsForConfig,
};
