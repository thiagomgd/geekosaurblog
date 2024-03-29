const { getMastodonPostsForConfig } = require("../_11ty/helpers");
const groupBy = require("lodash/groupBy");

module.exports = async function () {
  const isProduction = process.env.ELEVENTY_ENV !== "development";
  const options = [
    {
      shouldFetch: isProduction,
      host: "https://mastodon.social",
      userId: "200642",
      removeSyndicates: ["geekosaur.com"],
      cacheLocation: "src/_cache/linksmastosocial.json",
      removeTags: true,
      type: "links",
      preTagFilter: ["l", "link"],
    },
    // {
    //   shouldFetch: false,
    //   host: "https://universeodon.com",
    //   userId: "109317385660584217",
    //   removeSyndicates: ["geekosaur.com"],
    //   cacheLocation: "src/_cache/linksuniverseodon.json",
    //   removeTags: true,
    //   type: "links",
    // },
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
