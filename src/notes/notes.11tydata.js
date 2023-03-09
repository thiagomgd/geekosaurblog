module.exports = function () {
    return {
        eleventyComputed: {
            // permalink: function(data) {
			// 	if(showDraft(data)) {
			// 		return data.permalink
			// 	}
			// 	else {
			// 		return false;
			// 	}
			// },
            // tags: function (data) {
            //     if (!data || !data.tags_string) return ['note'];

            //     return [...data.tags_string.split(","), 'note'];
            // },
            createdDate: function (data) {
                return new Date(data.createdTime);
            },
            // description: 
        },
        // reddit: async function(data) {
        //     return await getRedditUrl(data.slug);
        // },
        layout: "layouts/note.njk",
        tags: [
          "note"
        ],
        permalink: "note/{% if slug %}{{ slug }}{% else %}{{ page.fileSlug }}{% endif %}/"		
    };
};
