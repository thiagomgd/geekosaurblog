// const { process } = require("clean-css");
const { getOptimizedUrl } = require("../_11ty/helpers");

const isDevEnv = process.env.ELEVENTY_ENV === "development";
const todaysDate = new Date();

function showDraft(data) {
  const isDraft =
    ("draft" in data && data.draft !== false) || data.tags.includes("draft");
  const isFutureDate = data.page.date > todaysDate;
  return isDevEnv || (!isDraft && !isFutureDate);
}

module.exports = function () {
  return {
    eleventyComputed: {
      eleventyExcludeFromCollections: function (data) {
        if (showDraft(data)) {
          return data.eleventyExcludeFromCollections;
        } else {
          return true;
        }
      },
      permalink: function (data) {
        if (showDraft(data)) {
          return data.permalink;
        } else {
          return false;
        }
      },
      thumbnail: async function (data) {
        return await getOptimizedUrl(data.thumbnail);
      },
      createdDate: function (data) {
        return data.page.date;
      },
    },

    layout: "layouts/post.njk",
    tags: ["post"],
    permalink:
      "post/{% if slug %}{{ slug }}{% else %}{{ page.fileSlug }}{% endif %}/",
  };
};
