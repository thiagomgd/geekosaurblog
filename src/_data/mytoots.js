// const fetch = require("node-fetch");
// const unionBy = require("lodash/unionBy");
// const domain = require("./metadata.json").domain;
// const {readFromCache, writeToCache} = require("../_11ty/helpers");
// const metadata = require("./metadata.json");

// // Define Cache Location and API Endpoint
// const CACHE_FILE_PATH = ".cache/mastodon.json";

// module.exports = async function () {
//     // const cache = readFromCache(CACHE_FILE_PATH);

//     // if (cache.posts.length) {
//     //     console.log(`>>> ${cache.posts.length} toots loaded from cache`);
//     // }

//     // // TODO: put fetch code here instead of using plugin?

//     // return cache.posts;
//     return
// };

// const fetch = require("node-fetch");
// const fs = require("fs");
const {
  getLocalImageLink,
  getMastodonPostsForConfig,
} = require("../_11ty/helpers");

// // TODO: use my own fuctions for READ and WRITE
// const readFromCache = (config) => {
// 	if (fs.existsSync(config.cacheLocation)) {
// 		const cacheFile = fs.readFileSync(config.cacheLocation);
// 		return JSON.parse(cacheFile.toString());
// 	}
// 	// no cache found.
// 	return { lastFetched: null, posts: [] };
// };

// const writeToCache = (config, data) => {
// 	const dir = '.cache';
// 	const fileContent = JSON.stringify(data, null, 2);
// 	// create cache folder if it doesnt exist already
// 	if (!fs.existsSync(dir)) {
// 		fs.mkdirSync(dir);
// 	}
// 	// write data to cache json file
// 	fs.writeFile(config.cacheLocation, fileContent, (err) => {
// 		if (err) throw err;
// 		console.log(
// 			`>>> ${data.posts.length} mastodon posts in total are now cached in ${config.cacheLocation}`
// 		);
// 	});
// };

module.exports = async function () {
  const isProduction = process.env.ELEVENTY_ENV !== "development";
  const options = [
    {
      isProduction: isProduction,
      host: "https://toot.cat",
      userId: "109260262121658226",
      removeSyndicates: ["geekosaur.com"],
      cacheLocation: "src/_cache/mastotootcat.json",
      removeTags: true,
      preTagFilter: ["journal", "note"], // at least one of those tags
    },
    {
      isProduction: isProduction,
      host: "https://sakurajima.moe",
      userId: "110152922685719043",
      removeSyndicates: ["geekosaur.com"],
      cacheLocation: "src/_cache/mastosakurajima.json",
      removeTags: true,
      posse: false,
      postTagFilter: ["journal", "note"], // at least one of those tags
    },
    {
      isProduction: isProduction,
      host: "https://mindly.social",
      userId: "109320970425371051",
      removeSyndicates: ["geekosaur.com"],
      cacheLocation: "src/_cache/mastomindly.json",
      removeTags: true,
      posse: false,
      postTagFilter: ["journal", "note"], // at least one of those tags
    },
  ];

  let posts = [];

  for (const config of options) {
    // console.log('------', config.host, '-------')
    toots = await getMastodonPostsForConfig(config);
    // console.log('@@');
    // console.log(toots);
    posts = posts.concat(toots);
    // console.log('sizes: toots', toots.length, posts.length);
    // console.log('****', config.host, '******')
  }

  // console.log('MASTODON -------');
  // console.log(posts);
  // download images
  for (const post of posts) {
    for (const image of post.images) {
      image.url = await getLocalImageLink(image.url, "mastodon");
    }
  }

  // sort again, but whatever...
  return posts
    .sort((a, b) => Date.parse(a.date) - Date.parse(b.date))
    .reverse();
};
