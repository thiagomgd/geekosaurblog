// const { process } = require("clean-css");
const { getLocalImageLink } = require("../_11ty/helpers");

const isDevEnv = process.env.ELEVENTY_ENV === 'development';
const todaysDate = new Date();

function showDraft(data) {
	const isDraft = 'draft' in data && data.draft !== false;
	const isFutureDate = data.page.date > todaysDate;
	return isDevEnv || (!isDraft && !isFutureDate);
}

module.exports = function() {
	return {
		eleventyComputed: {
			eleventyExcludeFromCollections: function(data) {
				if(showDraft(data)) {
					return data.eleventyExcludeFromCollections;
				}
				else {
					return true;
				}
			},
			permalink: function(data) {
				if(showDraft(data)) {
					return data.permalink
				}
				else {
					return false;
				}
			},
			thumbnail: function(data) {
				console.log("THUMBNAIL", data.slug, data.thumbnail);
				return getLocalImageLink(data.thumbnail);
			}
		},

        layout: "layouts/post.njk",
        tags: [
          "posts"
        ],
		// thumbnail: "{% post.thumbnail | getLocalImgUrl %}",
        permalink: "post/{% if slug %}{{ slug }}{% else %}{{ page.fileSlug }}{% endif %}/"		
	}
}