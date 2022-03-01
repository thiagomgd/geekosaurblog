const { getLocalImageLink, optimizeImage } = require("../_11ty/helpers");

module.exports = function() {
	return {
		eleventyComputed: {
			tags: function(data) {
				return ['posts']
				// return data.tags_string ? data.tags_string.split(",") : [];
			}
		},		
	}
}