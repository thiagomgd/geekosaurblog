const { getMastodonPostsForConfig } = require("../_11ty/helpers");
const groupBy = require("lodash/groupBy");

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
      type: "links",
    },
  ];

  let posts = [];

  for (const config of options) {
    const toots = await getMastodonPostsForConfig(config);

    posts = posts.concat(toots);
  }

  const grouped = groupBy(posts, "linksPost");
  console.log(">>> Pending Links: ", grouped[undefined]?.length);
  return grouped;
};
