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
            // permalink: function(data) {
            //     console.log('###############')
            //     console.log(data.title, data.slug, data.dontBridgy, !!data.dontBridgy);
			// 	if(data.dontBridgy == "false") {
            //         console.log("@@@@@@", data);
			// 		return data.slug; //data.permalink;
			// 	}
			// 	else {
            //         console.log("@@@@@@@ - false")
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
        // permalink: "note/{{ toot.slug }}/"
        // reddit: async function(data) {
        //     return await getRedditUrl(data.slug);
        // },
    };
};
