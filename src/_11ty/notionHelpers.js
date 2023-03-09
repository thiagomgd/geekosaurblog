const luxon = require("luxon");
const { DateTime } = require("luxon");
const cheerio = require("cheerio");

const fetch = require("node-fetch");
const { intersection } = require("lodash/array");

const metadata = require("../_data/metadata.json");


const TWITTER_TOKEN = process.env.TWITTER_API_KEY;

function getUrl(post, type, useDomain = false) {
  if (type === "note") {
    return `${useDomain ? metadata.domain : metadata.url}/note/${post.id}/`;
  }

  return `${useDomain ? metadata.domain : metadata.url}/post/${post.slug}/`;
}



async function updateReddit(notion, posts, type) {
  if (!metadata.subreddit || process.env.ELEVENTY_ENV === "development") return;

  const toUpdate = Object.values(posts).filter((post) => !post.reddit);
  // console.log('TO UPDATE REDDIT!');
  // console.log(toUpdate);
  // console.log(posts);
  if (toUpdate.length === 0) return;

  // console.log('>>>>>>> U')
  const response = await fetch(
    `https://www.reddit.com/r/${metadata.subreddit}.json`
  );
  if (!response.ok) {
    console.error("### not able to load from reddit");
  }
  const responseJson = await response.json();
  const redditPostsArray = responseJson.data.children
    .filter((post) => post.data.domain === metadata.domain)
    .map((post) => ({
      [post.data.url]: `https://www.reddit.com${post.data.permalink}`,
    }));

  const redditPosts = Object.assign({}, ...redditPostsArray);

  toUpdate.forEach(async (post) => {
    const postUrl = getUrl(post, type);

    let redditUrl;

    if (!postUrl in redditPosts) {
      redditUrl = redditPosts[postUrl];
    } else {
      // redditUrl = await searchReddit(postUrl);
      redditUrl = await searchReddit(postUrl);

      if (!redditUrl) return;
    }

    // TODO: don't mutate original object, create copy
    posts[post.id].reddit = redditUrl;

    // updateNotion(notion, post.id, { Reddit: redditUrl });
  });

  // return posts;
}

function randomString(length) {
  var text = "";
  var possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (var i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

function lessThanSevenDays(postDate) {
  if (!postDate) return false;

  const today = luxon.DateTime.now().setZone("America/Vancouver");
  const date2 = luxon.DateTime.fromISO(postDate);
  const diffDays = today.diff(date2, "days").toObject().days;

  // console.log(
  //   "date diff",
  //   // today,
  //   // postDate,
  //   date2,
  //   diffDays,
  //   // today.diff(date2, "days"),
  // );

  return diffDays <= 7;
}


// async function updateTweet(notion, posts, type) {
//   if (!TWITTER_TOKEN || process.env.ELEVENTY_ENV === "development") return;

//   const toUpdate = Object.values(posts).filter((post) => {
//     return (
//       !post.tweet && lessThanSevenDays(post.date_published || post.created_time)
//     );
//   });

//   if (toUpdate.length === 0) return;

//   toUpdate.forEach(async (post) => {
//     const link = getUrl(post, type, true);
//     const resp = await fetch(
//       `https://api.twitter.com/2/tweets/search/recent?query=${link}`,
//       {
//         headers: {
//           authorization: `Bearer ${TWITTER_TOKEN}`,
//         },
//       }
//     );

//     if (!resp.ok) return;

//     const responseJson = await resp.json();

//     if (responseJson.data && responseJson.data.length > 0) {
//       const tweet = `https://twitter.com/${metadata.author.twitter_handle}/status/${responseJson.data[0].id}`;
//       console.log("updating tweet", tweet);
//       // TODO: don't mutate original object, create copy
//       posts[post.id].tweet = tweet;

//       // updateNotion(notion, post.id, { Tweet: tweet });
//     }
//   });
// }

// function getPreviousPostByTag(newPost, posts) {
//     const tagsToUse = intersection(metadata.twitter_reply_to, newPost.tags);
//     if (!tagsToUse || !tagsToUse.length) return undefined;

//     for (const tag of tagsToUse) { // go in priority order
//         for (const post of posts) {
//             if (post.tweet && post.tags.includes(tag)) {
//                 return post;
//             }
//         }
//     }

//     return undefined;
// }

function getPreviousPostByThread(newPost, posts) {
  const thread = newPost.data.thread;

  if (!thread) return undefined;

  for (const post of posts) {
    if (post.data.tweetId && post.data.thread === thread) {
      return post;
    }
  }

  return undefined;
}

const jsToDateTime = (date, lang = "en") =>
  DateTime.fromJSDate(date, { setZone: true })
    .setZone("America/Vancouver")
    .setLocale(lang);

// TODO: unify this and the one on notion_posts.js
function showPost(data) {
  const todaysDate = jsToDateTime(new Date());

  // FOR NOW: also filter posts without slug - don't want to have it change over time
  const hasSlug = "slug" in data && data.slug !== "";
  const isPublished = "published" in data && data.published === true;
  const isFutureDate = !data.date_published || data.date_published > todaysDate;
  return hasSlug && isPublished && !isFutureDate;
}

function postDictToOrderedArray(posts, type) {
  if (type === "note") {
    return Object.values(posts).sort(function (a, b) {
      const timeA = a.created_time ? new Date(a.created_time).getTime() : 0;
      const timeB = b.created_time ? new Date(b.created_time).getTime() : 0;
      return timeB - timeA;
    });
  }

  return Object.values(posts)
    .filter((post) => showPost(post) === true)
    .sort(function (a, b) {
      const timeA = a.date_published ? new Date(a.date_published).getTime() : 0;
      const timeB = b.date_published ? new Date(b.date_published).getTime() : 0;
      return timeB - timeA;
    });
}

// to-do: make it possibly to use other fields as reply-to (mastodon, blog post url, etc)
// async function updateReplyToByTag(notion, posts, type) {
//     if (!TWITTER_TOKEN || process.env.ELEVENTY_ENV === "development") return;

//     const toUpdate = Object.values(posts).filter((post) => {
//         return !post.reply_to && lessThanSevenDays(post.date_published || post.created_time);
//     });

//     // console.debug("!!!!!!!",type, toUpdate);

//     if (toUpdate.length === 0) return;

//     const postsArray = postDictToOrderedArray(posts, type);
//     // toUpdate.forEach(async (post) => {
//     for (let post of toUpdate) {
//         const previousPost = getPreviousPost(post, postsArray);

//         if (!previousPost) break;

//         await updateNotion(notion, post.id, {"Reply To": previousPost.tweet});

//         posts[post.id].reply_to = previousPost.tweet;
//     }
// }

function updateReplyToByThread(notion, posts) {
  // if (!TWITTER_TOKEN || process.env.ELEVENTY_ENV === "development") return;

  // TODO: instead of filter, use for loop to avoid processing old posts
  // const toUpdate = Object.values(posts).filter((post) => {
  //     return !post.data.reply_to && post.data.thread && ;
  // });

  // const toUpdate = [{}];
  // console.debug("LAST POST", posts[posts.length - 1]);
  // console.debug("!!!!!!! To Update", toUpdate);

  // console.log("!!!!!!", posts[posts.length - 1].data.repl ,lessThanSevenDays(posts[posts.length - 1].data.created_time));
  // if (toUpdate.length === 0) return;

  for (let i = posts.length - 1; i >= 0; i--) {
    const post = posts[i];

    const less7days = lessThanSevenDays(
      post.data.date_published || post.data.created_time
    );

    if (!less7days) break;

    if (post.data.reply_to || !post.data.thread) continue;

    const previousPost = getPreviousPostByThread(post, posts);
    // console.log("PREVIOUS POST", previousPost.data.title);
    if (!previousPost) continue;

    const id = post.data.notion_post?.id || post.data.note?.id;

    const toUpdate = {};

    toUpdate["Thread Twitter"] =
      previousPost.data.notion_post?.tweet || previousPost.data.note?.tweet;
    toUpdate["Thread Mastodon"] =
      previousPost.data.notion_post?.toot || previousPost.data.note?.toot;

    // updateNotion(notion, id, toUpdate);

    // posts[post.id].reply_to = tweet;
    posts[i].data.threadTwitter = toUpdate["threadTwitter"];
    posts[i].data.threadMastodon = toUpdate["threadMastodon"];
  }

  return posts;
}

module.exports = {
  // updateTweet,
  // updateToot,
  // updateReddit,
  updateReplyToByThread
};
