// const { getLocalImageLink, optimizeImage } = require("../_11ty/helpers");

module.exports = function () {
  return {
    eleventyComputed: {
      tags: function (data) {
        return data.tags_string ? data.tags_string.split(",") : [];
      },
      created_date: function(data) {
				return new Date(data.created_time);
			},
    },
  };
};