const fs = require("fs");

const Image = require("@11ty/eleventy-img");
const metadata = require("../_data/metadata.json");
const cheerio = require("cheerio");
const fetch = require("node-fetch");
// const IMG_CACHE_FILE_PATH = "src/_cache/images.json";
const external = /https?:\/\/((?:[\w\d-]+\.)+[\w\d]{2,})/i;
// Matches bookmark links that are not inline
const mdBookmarkRegex = /^\[bookmark]\(([^)]+)\)$/gm;
// TODO: test
const mdImageRegex = /^\!\[\]\(((?:\/|https?:\/\/)[\w\d./?=#]+)\)$/;

const SOCIAL_PATH = "src/_data/social.json";
// function replaceNotionBookmark(markdownString) {
//   console.log("!!!!!!!!!!!!!!!!");
//   console.log(markdownString.match(mdBookmarkRegex));
//   return markdownString.replace(mdBookmarkRegex, `{% anyEmbed '$1' %}`);
// }

// function replaceNotionMarkdown(markdownString) {
//   const newString = replaceNotionBookmark(markdownString);
//   console.log(newString);
//   return newString;
// }

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

function isNotionImage(imgUrl) {
    return imgUrl.includes('secure.notion-static.com');
}

function getFileName(url) {
    // get the filename from the path
    const pathComponents = url.split("/");

    // break off cache busting string if there is one
    let filename = pathComponents[pathComponents.length - 1].split("?");
    return `${shortHash(url)}-${filename[0]}`;
}

function getFolder(imgUrl, folder, slug) {
    if (isNotionImage) return `notion/${slug}`;
    if (imgUrl.includes('photo.goodreads.com')) return 'goodreads';

    return folder;
}

// function getLocalImageLink(imgUrl, fileName = "") {
//     if (!imgUrl) return "";

//     if (process.env.ELEVENTY_ENV !== "devbuild") return imgUrl;

//     // skip local images, notion images
//     // there shouldn't be any notion images at this point anymore
//     if (!external.test(imgUrl)) { //|| isNotionImage(imgUrl)) {
//         return imgUrl;
//     }

//     // const cache = readFromCache(IMG_CACHE_FILE_PATH);

//     if (cache[imgUrl]) {
//         const filePath = `./src${cache[imgUrl].url}`
//         if (fs.existsSync(filePath)) {
//             return cache[imgUrl].url;
//         }
//         // it's probably downloading, fallback to remote url
//         return imgUrl;
//     }

//     // for now, don't download more images
//     return;
//     // const folder = getFolder(imgUrl, "ext");

//     // const fn = fileName || getFileName(imgUrl);
//     // const imagePath = `/img/${folder}/${fn}`;
//     // const path = `./src${imagePath}`;

//     // console.debug('@@@@', imgUrl);
//     // if (!fs.existsSync(path)) {
//     //     fetch(imgUrl).then((res) => res.body.pipe(fs.createWriteStream(path)));
//     //     cache[imgUrl] = {url: imagePath};
//     //     writeToCache(cache, IMG_CACHE_FILE_PATH, "images");
//     //     // TODO: return local. For now, since download is async, first run needs to use external url
//     //     return imgUrl;
//     // } else {
//     //     console.error("> collision downloading image", imgUrl);
//     // }

//     // return imagePath;
// }

// function downloadImage(url, filepath) {
//     if (!fs.existsSync(filepath)) {
//         return new Promise((resolve, reject) => {
//             fetch(url).then((res) => {
//                     res.body.pipe(fs.createWriteStream(filepath)).on('error', reject)
//                         .once('close', () => resolve(filepath));
//                 }
//             )
//         });
//     }
//     console.error("> collision downloading image", url, filepath);
// }

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

async function optimizeImage(src, outputDir = "_site/img",) {
    if (!src) {
        return src;
    }

    let fileSource = src.startsWith("/img/") 
    ? `./src${src}` 
    : src.startsWith("img/") 
    ? `./src/${src}` 
    :  src.startsWith("/src/") 
    ?  `.${src}` 
    :src;

    fileSource = fileSource.replace(/%20/g, ' ');

    const extraProps = src.includes(".gif")
        ? {
            formats: ["gif"],//["webp", "gif"],
            sharpOptions: {
                animated: true,
            },
        }
        : {formats: ["jpeg"]};

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

function deleteNotionLocalImages(postId) {
    if (process.env.ELEVENTY_ENV !== "devbuild") return;

    const dir = `./src/img/notion/${postId}`; // TODO: don't duplicate this with the download function
    if (fs.existsSync(dir)) {
        fs.rmdirSync(dir, {recursive: true});
    }
}

async function fetchToots() {
    if (!metadata.bridgy_mastodon || process.env.ELEVENTY_ENV === "development") return [];

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
    let tootUrl = '';
    
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

// async function searchReddit(url) {
//     if (process.env.ELEVENTY_ENV === "development") return "";

//     const fullURL = `${metadata.url}${url}`
//     const searchUrl = `https://www.reddit.com/r/${metadata.subreddit}/search.json?q=${fullURL}&restrict_sr=on&include_over_18=on&sort=relevance&t=all`;
//     const response = await fetch(searchUrl);
//     if (!response.ok) {
//         console.error("### not able to load from reddit");
//         return "";
//     }
//     const responseJson = await response.json();

//     // console.log(`%%%%%%% ${fullURL}`);
//     // console.log(responseJson);

//     if (!responseJson || !Array.isArray(responseJson)) return "";
//     for (const list of responseJson) {
//         for (const post of list.data.children) {
//         // console.log('!@#!@#',post);
//         if (post && post.data && post.data.url && post.data.url) {
//             return `https://www.reddit.com${post.data.permalink}`;
//         }
//         }
//     }
//     return "";
// }

function removeMastoTags(content) {
    const $ = cheerio.load(content, null, false);
    $("a.hashtag").remove();
    
    $("p").each((_,element) => {
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
    getMastoTags
};
