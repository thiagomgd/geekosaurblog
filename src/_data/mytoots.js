// const fetch = require("node-fetch");
// const unionBy = require("lodash/unionBy");
// const domain = require("./metadata.json").domain;
// const {readFromCache, writeToCache} = require("../_11ty/helpers");
// const metadata = require("./metadata.json");

// // Define Cache Location and API Endpoint
// const CACHE_FILE_PATH = ".cache/mastodon.json";

// module.exports = async function () {
//     // const cache = readFromCache(CACHE_FILE_PATH);

//     // if (cache.posts.length) {
//     //     console.log(`>>> ${cache.posts.length} toots loaded from cache`);
//     // }

//     // // TODO: put fetch code here instead of using plugin?

//     // return cache.posts;
//     return 
// };

const fetch = require('node-fetch');
const fs = require('fs');
const unionBy = require('lodash/unionBy');
const { removeMastoTags, getMastoTags } = require("../_11ty/helpers");
const { getTootSlug } = require("../_11ty/filters");

function compute(config, posts) {
	// console.log('--- compute ---', config.host);
	return posts.filter(post => {
		if (!config.postTagFilter) return true;

		// console.log(post.tags.some(tag => config.postTagFilter.includes(tag.name)), post.tags, config.postTagFilter);
		return post.tags.some(tag => config.postTagFilter.includes(tag))
	}).map(post => {
		return {
			...post,
			title: post.title || "🦣",
			slug: getTootSlug(post),
			createdDate: post.date,
			dontBridgy: !config.posse
		}
	})
}

const formatTimeline = (timeline, config) => {
	// console.log('$$$', config.host, !config.preTagFilter);

	const filtered = timeline.filter(
		(post) =>
			// remove posts that are already on your own site.
			!config.removeSyndicates.some((url) => post.content.includes(url)) &&
			(!config.preTagFilter || post.tags.some(tag => config.preTagFilter.includes(tag.name)))
	);

	const formatted = filtered.map((post) => {
		const images = post.media_attachments.map((image) => ({
			url: image?.url,
			alt: image?.description,
			width: image?.meta?.small?.width,
			height: image?.meta?.small?.height,
			aspect: image?.meta?.small?.aspect,
		}));

		// console.log(post);
		const [part1, part2] = post.content.split('<p>---</p>');

		let title = '';
		let content;

		if (part2) {
			title = part1.replace(/(<([^>]+)>)/gi, "");
			content = part2
		} else {
			content = part1
		}

		const tags = getMastoTags(content);
		return {
			date: new Date(post.created_at).toISOString(),
			id: post.id,
			title: title,
			content: config.removeTags ? removeMastoTags(content) : content,
			source_url: post.url,
			site: 'Mastodon',
			images: images,
			embed: post.card?.url ? post.card.url : null,
			tags: tags, //post.tags doesn't respect capitalization post.tags.map(tag => tag.name),
			emojis: post.emojis,
			tootUrl: post.url,
			host: config.host.split('/')[2]
		};
	});
	// const goodPosts = formatted.filter((post) => {
	//     // for now, don't wanna ignore iamges without alt
	// 	// if (post.media && post.media.alt === null) {
	// 	// 	return false;
	// 	// }
	// 	return true;
	// });

	return formatted;
};

const fetchMastodonPosts = async (config, lastPost) => {
	const queryParams = new URLSearchParams({
		limit: 40,
		exclude_replies: true,
		exclude_reblogs: true,
	});
	if (lastPost) {
		queryParams.set('since_id', lastPost.id);
		console.log(`>>> Requesting posts made after ${lastPost.date}...`);
	}

	const mastodonStatusAPI = `${config.host}/api/v1/accounts/${config.userId}/statuses`;

	const url = new URL(`${mastodonStatusAPI}?${queryParams}`);
	const response = await fetch(url.href);
	if (response.ok) {
		const feed = await response.json();
		const timeline = formatTimeline(feed, config);
		console.log(`>>> ${timeline.length} new mastodon posts fetched`);
		return timeline;
	}
	console.warn('>>> unable to fetch mastodon posts', response.statusText);
	return null;
};

// TODO: use my own fuctions for READ and WRITE
const readFromCache = (config) => {
	if (fs.existsSync(config.cacheLocation)) {
		const cacheFile = fs.readFileSync(config.cacheLocation);
		return JSON.parse(cacheFile.toString());
	}
	// no cache found.
	return { lastFetched: null, posts: [] };
};

const writeToCache = (config, data) => {
	const dir = '.cache';
	const fileContent = JSON.stringify(data, null, 2);
	// create cache folder if it doesnt exist already
	if (!fs.existsSync(dir)) {
		fs.mkdirSync(dir);
	}
	// write data to cache json file
	fs.writeFile(config.cacheLocation, fileContent, (err) => {
		if (err) throw err;
		console.log(
			`>>> ${data.posts.length} mastodon posts in total are now cached in ${config.cacheLocation}`
		);
	});
};

// Merge fresh posts with cached entries, unique per id
const mergePosts = (cache, feed) => {
	const merged = unionBy(cache.posts, feed, 'id');
	return merged
		.sort((a, b) => Date.parse(a.date) - Date.parse(b.date))
		.reverse();
};


const getPostsForConfig = async (options) => {
	if (!options.host) {
		console.error('No URL provided for the Mastodon server.');
		return;
	}
	if (!options.userId) {
		console.error('No userID provided.');
		return;
	}

	const defaults = {
		removeSyndicates: [],
		cacheLocation: '.cache/mastodon.json',
		posse: true,
		isProduction: true,
		removeTags: false,
	};

	const config = { ...defaults, ...options };

	let lastPost;
	console.log('>>> Reading mastodon posts from cache...');
	const cache = readFromCache(options);

	if (cache.posts.length) {
		console.log(`>>> ${cache.posts.length} mastodon posts loaded from cache`);
		lastPost = cache.posts[0];
	}

	// Only fetch new posts in production
	if (config.isProduction) {
		console.log('>>> Checking for new mastodon posts...');
		const feed = await fetchMastodonPosts(config, lastPost);
		if (feed) {
			const mastodonPosts = {
				lastFetched: new Date().toISOString(),
				posts: mergePosts(cache, feed),
			};

			writeToCache(config, mastodonPosts);
			return compute(config, mastodonPosts.posts);
		}
	}

	// console.log('!!!');
	// console.log(cache.posts);
	return compute(config, cache.posts);
}

module.exports = async function () {
	const isProduction = process.env.ELEVENTY_ENV !== "development"
	const options = [
		{
			isProduction: isProduction,
			host: 'https://toot.cat',
			userId: '109260262121658226',
			removeSyndicates: ['geekosaur.com'],
			cacheLocation: "src/_cache/mastotootcat.json",
			removeTags: true,
			preTagFilter: ["journal", "note"] // at least one of those tags
		},
		{
			isProduction: isProduction,
			host: 'https://sakurajima.moe',
			userId: '110152922685719043',
			removeSyndicates: ['geekosaur.com'],
			cacheLocation: "src/_cache/mastosakurajima.json",
			removeTags: true,
			posse: false,
			postTagFilter: ["journal", "note"] // at least one of those tags
		},
		{
			isProduction: isProduction,
			host: 'https://mindly.social',
			userId: '109320970425371051',
			removeSyndicates: ['geekosaur.com'],
			cacheLocation: "src/_cache/mastomindly.json",
			removeTags: true,
			posse: false,
			postTagFilter: ["journal", "note"] // at least one of those tags
		},
	]

	let posts = [];

	for ( const config of options) {
		// console.log('------', config.host, '-------')
		toots = await getPostsForConfig(config);
		// console.log('@@');
		// console.log(toots);
		posts = posts.concat(toots);
		// console.log('sizes: toots', toots.length, posts.length);
		// console.log('****', config.host, '******')
	}

	// console.log('MASTODON -------');
	// console.log(posts);
	// sort again, but whatever...
	return posts.sort((a, b) => Date.parse(a.date) - Date.parse(b.date))
		.reverse();
};