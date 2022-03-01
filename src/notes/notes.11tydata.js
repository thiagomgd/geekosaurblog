const { getLocalImageLink, optimizeImage } = require("../_11ty/helpers");

module.exports = function () {
  return {
    eleventyComputed: {
      tags: function (data) {
        const tags = data.tags_string ? data.tags_string.split(",") : [];
        tags.push("posts");
        return tags;
      },
    },
  };
};
