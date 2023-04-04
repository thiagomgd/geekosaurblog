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
            
            tags: function (data) {
                if (!data || !data.tagsString) return ['note'];

                return [...data.tagsString.split(","), 'note'];
            },
            createdDate: function (data) {
                return new Date(data.createdTime);
            },
            // description: 
        },
        
        // reddit: async function(data) {
        //     return await getRedditUrl(data.slug);
        // },
    };
};
