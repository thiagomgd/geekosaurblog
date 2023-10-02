const {
  getMastodonPostsForConfig,
  getFirefishPostsForConfig,
} = require("../_11ty/helpers");
const groupBy = require("lodash/groupBy");

module.exports = async function () {
  const isProduction = process.env.ELEVENTY_ENV !== "development";
  const options = [
    {
      shouldFetch: isProduction,
      host: "https://mastodon.social",
      userId: "200642",
      removeSyndicates: ["geekosaur.com"],
      cacheLocation: "src/_cache/nowPlayingMasto.json",
      removeTags: true,
      type: "music",
      preTagFilter: ["np", "nowplaying", "#jukeboxfridaynight"],
    },
    {
      software: "firefish",
      shouldFetch: isProduction,
      host: "https://sakurajima.social",
      userId: "9f03mr8eai",
      removeSyndicates: ["geekosaur.com"],
      cacheLocation: "src/_cache/nowPlayingSakurajima.json",
      removeTags: true,
      type: "music",
      preTagFilter: ["np", "nowplaying", "#jukeboxfridaynight"],
    },
  ];

  let posts = [];

  for (const config of options) {
    let toots;

    if (config.software === "firefish") {
      toots = await getFirefishPostsForConfig(config);
    } else {
      toots = await getMastodonPostsForConfig(config);
    }

    posts = posts.concat(toots);
  }

  const grouped = groupBy(posts, "linksPost");
  console.log(">>> Pending music: ", grouped[undefined]?.length);
  return grouped;
};
