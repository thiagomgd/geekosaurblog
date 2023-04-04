const { DateTime } = require("luxon");
const CleanCSS = require("clean-css");
const metadata = require("../_data/metadata.json");
const MarkdownIt = require("markdown-it");
const plainText = require("markdown-it-plain-text");

const {sortBy} = require("lodash/collection");

const md = new MarkdownIt();
// ({html: false, breaks: true })

function getRelevance(postTags, matchingPost) {
  const commonTopics = matchingPost.data.tags.filter((element) =>
    postTags.includes(element)
  );
  const discount = matchingPost.url.includes("30-days") ? 0.5 : 0;
  return commonTopics.length - discount;
}

function unique(array) {
  return [...new Set(array)];
}

function readableDate(dateObj) {
  if (!dateObj) return;
  return new Date(dateObj).toLocaleDateString("en-us", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

module.exports = {
  cssmin: (code) => {
    return new CleanCSS({}).minify(code).styles;
  },
  // TODO: generate share link for mastodon?
  // generateShareLink: (url, text) => {
  //   const shareText = `${text}`; // by @FalconSensei`;
  //   const shareUrl = `${metadata.url}${url}`;
  //   return `https://twitter.com/intent/tweet/?text=${encodeURI(
  //     shareText
  //   )}&url=${encodeURI(shareUrl)}`;
  // },
  getSelect: (posts) => posts.filter((post) => post.data.isSelect),
  // Get the first `n` elements of a collection.
  head: (array, n) => {
    if (n < 0) {
      return array.slice(n);
    }

    return array.slice(0, n);
  },
  htmlDateString: (dateObj) => {
    return DateTime.fromJSDate(dateObj, { zone: "utc" }).toFormat("yyyy-LL-dd");
  },
  min: (...numbers) => {
    return Math.min.apply(null, numbers);
  },
  readableDate,
  simpleDate: (dateStr) => {
    if (!dateStr) return dateStr;
    return dateStr.substring(0, 9);
  },
  readableDateFromISO: (dateStr, formatStr = "dd LLL yyyy") => {
    return DateTime.fromISO(dateStr).toFormat(formatStr);
  },
  readableDateTimeFromISO: (dateStr, formatStr = "dd LLL yyyy 'at' hh:mma") => {
    return DateTime.fromISO(dateStr).toFormat(formatStr);
  },
  similarItems: (itemPath, tags, collections) => {
    const topicTags = tags.filter((tag) => !["post", "Popular"].includes(tag));

    let matches = [];
    topicTags.forEach((tag) => {
      matches = [...matches, ...collections[tag]];
    });

    let uniqueMatches = unique(matches).filter(
      (match) => match.url !== itemPath
    ); // remove self
    if (uniqueMatches.length < 3) {
      uniqueMatches = unique([...uniqueMatches, ...collections["Popular"]]);
    }
    const matchesByRelevance = uniqueMatches
      .filter((match) => match.url !== itemPath) // remove self
      .map((match) => {
        return { ...match, relevance: getRelevance(topicTags, match) };
      })
      .sort((a, b) => {
        if (a.relevance > b.relevance) {
          return -1;
        }
        if (a.relevance < b.relevance) {
          return 1;
        }
        return 0;
      });
    const size = 3;
    return matchesByRelevance.slice(0, size);
  },
  getWebmentionsForUrl: (webmentions, url) => {
    return webmentions.children.filter((entry) => entry["wm-target"] === url);
  },
  isOwnWebmention: (webmention) => {
    const urls = [
      metadata.url,
      `https://twitter.com/${metadata.author.twitter_handle}`,
    ];
    const authorUrl = webmention.author ? webmention.author.url : false;
    // check if a given URL is part of this site.
    return authorUrl && urls.includes(authorUrl);
  },
  sortWebmentions: (mentions) => {
    return mentions.sort((a, b) => {
      if (a["published"] < b["published"]) {
        return -1;
      } else if (a["published"] > b["published"]) {
        return 1;
      }
      // a must be equal to b
      return 0;
    });
  },
  webmentionsByType: (mentions, mentionType) => {
    return mentions.filter((entry) => !!entry[mentionType]);
  },
  truncate: (text) =>
    text.length > 300 ? `${text.substring(0, 300)}...` : text,
  mastodonShareDescription: (text, hashtags=[], socialHashtags=[]) => {
    const maxLength = 450;
    const tagsList = hashtags.concat(socialHashtags)
    const tagsText = tagsList.map(tag => `#${tag.replace(' ', '')}`).join(' ') || '';
    // console.debug(tagsText);
    // console.debug(tagsText.length());
    const available = maxLength - tagsText.length;

    // md.use(plainText);
    // var mkd = require("markdown-it")({html: false, breaks: true});
    let content = typeof text === 'string' ? text : text.val

    // todo: blockquote to >
    content = content.replace(/(<([^>]+)>)/gi, ""); //.replaceAll('&lt;/p&gt;', '/n').replaceAll('&lt;p&gt;&amp;lt;p&amp;gt;',''); //mkd.render(text);

    // console.log(typeof text);
    // const content = mkd.render(typeof text === 'string' ? text : text.val);
    // const content = md.render(typeof text === 'string' ? text : text.val);

    if (content.length <= available) {
      return content + ' ' + tagsText;
    }
    return content.substr(0, content.lastIndexOf(" ", available)) + "... " + tagsText;
  },
  size: (mentions) => {
    return !mentions ? 0 : mentions.length;
  },
  getNoteThumbnail: (note) => {
    if (note.images && note.images.length > 0) {
      return note.images[0];
    }
    return null;
  },
  // getLocalImgUrl: (url) => {
  //   return getLocalImageLink(url);
  // },
  toArray: (thing) => {
    if (typeof thing === "string") {
      thing.split(",");
    }
    // already an array?
    return thing;
  },
  getTwitterId: (url) => {
    if (!url) return "";
    return url.substring(url.lastIndexOf("/") + 1, url.length);
  },
  getWithTag: (posts, tag) => {
    return posts.filter((post) => post.data.tags.includes(tag));
  },
  getTotalForDict: (dict) => {
    return total = Object.keys(dict).reduce((total, key) => {
      return total + dict[key].length;
    }, 0)
  },
  sortAndFilterManga: (mangaList) => {
    const sorted = sortBy(mangaList, 'numberInSeries');
    if (sorted.length <= 4) return sorted;

    return [sorted[0], {title:"..."}, sorted[sorted.length - 2], sorted[sorted.length - 1]];


  },
  getSeriesPosts: (seriesArray, seriesTitle) =>{
    for (const series of seriesArray) {
      if (series.title === seriesTitle) {
        return series.posts;
      }
    }
    return [];
  },
  log: (value) => {
    // console.log(value.data.slug, value.data.title);
    
    console.log(value)
  },
  getReddit: (redditUrl) => {
    return redditUrl || "https://www.reddit.com/r/geekosaur/"
  },
  getMastodon: (mastodonUrl) => {
    return mastodonUrl || "https://mindly.social/@falcon"
  },
  getTootSlug: (toot) => {
    return `${toot.host.replace('.','')}${toot.id}`
  }
};
