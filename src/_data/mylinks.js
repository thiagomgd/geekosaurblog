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
      host: "https://universeodon.com",
      userId: "109317385660584217",
      removeSyndicates: ["geekosaur.com"],
      cacheLocation: "src/_cache/linksuniverseodon.json",
      removeTags: true,
      attributeFilter: ["embed"],
    },
  ];

  let posts = [];

  for (const config of options) {
    const toots = await getMastodonPostsForConfig(config);

    posts = posts.concat(toots);
    // console.log('sizes: toots', toots.length, posts.length);
    // console.log('****', config.host, '******')
  }

  // sort again, but whatever...
  return posts
    .sort((a, b) => Date.parse(a.date) - Date.parse(b.date))
    .reverse();
};
