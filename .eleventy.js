const fs = require("fs");
const pluginRss = require("@11ty/eleventy-plugin-rss");
// const pluginSyntaxHighlight = require("@11ty/eleventy-plugin-syntaxhighlight");
const pluginNavigation = require("@11ty/eleventy-navigation");
const pluginTOC = require('eleventy-plugin-toc')
const markdownIt = require("markdown-it");
const markdownItAnchor = require("markdown-it-anchor");
const markdownItFootnote = require("markdown-it-footnote");
const filters = require('./src/_11ty/filters');
const helpers = require('./src/_11ty/helpers');
const shortcodes = require('./src/_11ty/shortcodes');
const pairedShortcodes = require('./src/_11ty/pairedShortcodes');
const asyncShortcodes = require('./src/_11ty/asyncShortcodes');
const {anyEmbed, figure, blur, tweet} = require('./src/_11ty/asyncShortcodes');
// const mastoArchive = require('eleventy-plugin-mastoarchive');

const cheerio = require("cheerio");
const { forEach } = require("lodash");

function hasBodyTag(content) {
  const hasBody = /<\s*body(\w|\s|=|"|-)*>/gm;
  return hasBody.test(content);
}

async function replaceSpecialLinks(content, options) {
  const $ = cheerio.load(content);
  // TODO: only block links
  const replace = ['bookmark', 'embed','textTweet'];
  let links = $("a").filter((i, el) => {
    const text = $(el).text();
    return replace.includes(text);
  });

  const promises = [];
  for (let i = 0; i < links.length; i++) {
    const link = links[i];
    const url = $(link).attr('href');
    const text = $(link).text();

    if (text === 'textTweet') {
      promises[i] = tweet(url, {twitterScriptEnabled: false});  
    } else {
      promises[i] = anyEmbed(url);
    }
  }

  const embeds = await Promise.all(promises);

  embeds.forEach((embed, i) => {
    $(links[i]).replaceWith(embed);
  });

  return $.html();
}

async function imgToFigure(content) {
  const $ = cheerio.load(content);
  // TODO: only block links
  // TODO: images from notion are surrounded by empty paragraphs. Eliminate them
  let images = $("p > img")
    // .not("picture img"); // Ignore images wrapped in <picture>
    // .not("[data-img2picture-ignore]") // Ignore excluded images

    const promises = [];
    for (let i = 0; i < images.length; i++) {
      const img = images[i];
      const attrs = $(img).attr();
      
      if (!attrs.alt) attrs.alt = '';


      
      const splitCaption = attrs.alt.split('|');
      let caption = splitCaption.shift();
      let shouldBlur = false;
      let source = "";

      splitCaption.forEach((itm) => {
        if (itm === "blur") {
          shouldBlur = true;
        } else if (itm.startsWith("http")) {
          source = itm
        } else {
          attrs.alt = itm
        }
      })

      if (source) {
        caption = `${caption} ([source](${source}))`
      }
    
      // attrs.alt.startsWith('(blur)') ? attrs.alt.replace('(blur)','').trim() : attrs.alt;

      if (shouldBlur) {
        // replace is for images from obsidian.
        promises[i] = blur(attrs.src, caption, "", attrs.all);
      } else {
        // replace is for images from obsidian.
        promises[i] = figure(attrs.src, caption, "", attrs.alt);   
      }
    }
  
    const pictures = await Promise.all(promises);
  
    pictures.forEach((picture, i) => {
      // console.debug('-------------');
      // console.debug(images[i]);
      // console.debug(picture);
      $(images[i]).replaceWith(picture);
    });

    return $.html();
  // return hasBodyTag(content) ? $.html() : $("body").html();
}

// Don't update params?
async function updatePostSocial(post, socialLinks, mastodonPosts) {
  if (!socialLinks[post.url]) {
    socialLinks[post.url] = {}
  }
  

  if (socialLinks[post.url]['reddit']) {
    post.data.reddit = socialLinks[post.url]['reddit'];
  } else {
    const redditPost = await helpers.searchReddit(post.url);
    if (redditPost) {
      post.data.reddit = redditPost;

      socialLinks[post.url]['reddit'] = redditPost;
    }
  }

  if (socialLinks[post.url]['mastodon']) {
    post.data.mastodon = socialLinks[post.url]['mastodon'];
  } else {
    toot = helpers.updateToot(post, mastodonPosts);
    
    // console.log(`!!!!!!!!!!!!!!! | url ${post.url} | toot ${toot}`);
    if (toot) {
      post.data.mastodon = toot;

      socialLinks[post.url]['mastodon'] = toot;
    }
  }
}

module.exports = function(eleventyConfig) {
  // Add plugins
  // eleventyConfig.addPlugin(mastoArchive, {
  //   host: 'https://mindly.social',
  //   userId: '109320970425371051',
  //   removeSyndicates: ['geekosaur.com'],
  // });

  eleventyConfig.addPlugin(pluginRss);
  // eleventyConfig.addPlugin(pluginSyntaxHighlight);
  eleventyConfig.addPlugin(pluginNavigation);
  eleventyConfig.addPlugin(pluginTOC, {
    flat: false,
    ul: true,
    wrapper: 'nav'
  })

  // Add filters
  Object.keys(filters).forEach(filterName => {
    eleventyConfig.addFilter(filterName, filters[filterName])
  })

  eleventyConfig.addNunjucksAsyncFilter('getOptimizedImageUrl', async function(value, callback) {
    const url = await helpers.optimizeImage(value);
    callback(null, url);
   });

  // Add shortcodes
  Object.keys(shortcodes).forEach(codeName => {
    eleventyConfig.addShortcode(codeName, shortcodes[codeName])
  })

  // Add shortcodes
  Object.keys(pairedShortcodes).forEach(codeName => {
    eleventyConfig.addPairedShortcode(codeName, pairedShortcodes[codeName])
  })

  // Add shortcodes
  Object.keys(asyncShortcodes).forEach(codeName => {
    eleventyConfig.addNunjucksAsyncShortcode(codeName, asyncShortcodes[codeName])
  })

  // This function is reused in this config, so declaring the filter here instead:
  function filterTagList(tags) {
    return (tags || []).filter(tag => ["all", "nav", "post", "posts", 'note', 'Draft'].indexOf(tag) === -1);
  }
  eleventyConfig.addFilter("filterTagList", filterTagList)

  // https://www.11ty.dev/docs/data-deep-merge/
  eleventyConfig.setDataDeepMerge(true);

  // Alias `layout: post` to `layout: layouts/post.njk`
  eleventyConfig.addLayoutAlias("post", "layouts/post.njk");

  // https://11ta.netlify.app/2020/09/20/v110-brings-draft-posts/
  /**
	 * Collections
	 * ============================
	 *
	 * POST Collection set so we can check status of "draft:" frontmatter.
	 * If set "true" then post will NOT be processed in PRODUCTION env.
	 * If "false" or NULL it will be published in PRODUCTION.
	 * Every Post will ALWAYS be published in DEVELOPMENT so you can preview locally.
	 */
  // eleventyConfig.addCollection('posts', collection => {
  //   return collection.getSortedByDate()
  //     .filter(livePosts);
  // });


  eleventyConfig.addCollection('posts', async collection => {
    const social = helpers.readSocialLinks();
    const myToots = await helpers.fetchToots();

    const localPosts = collection.getFilteredByTag('post');

    const newPosts = await Promise.all(localPosts.map(async (post) => {
      await updatePostSocial(post, social, myToots);

      return post;
    }));

    helpers.saveSocialLinks(social);

    return newPosts.sort(function(a, b) {
        const timeA = a.data.createdDate ? a.data.createdDate.getTime() : 0;
        const timeB = b.data.createdDate ? b.data.createdDate.getTime() : 0;
        return timeA - timeB;
      });
  });

  
  eleventyConfig.addCollection('notes',async collection => {
    const social = helpers.readSocialLinks();
    const myToots = await helpers.fetchToots();

    const localNotes = collection.getFilteredByTag('note');
    const localTest = collection.getFilteredByTag('asd');
    console.log('---------')
    console.log(localTest);
    console.log('---------')
    
    // const localMastodon = collection.getFilteredByTag('mastodon');
    // const otherLocalMastodon = collection.getAll()[0].data.mastodon.posts;

    // console.log(otherLocalMastodon);
    
    const newNotes = await Promise.all(localNotes.map(async (post) => {
      await updatePostSocial(post, social, myToots);
      
      return post;
    }));

    helpers.saveSocialLinks(social);
    // console.log('-----')
    // console.log(newNotes[0])

    // otherLocalMastodon.forEach(toot => {
    //   toot.data = toot.data || {};
    //   // console.log(toot.date, typeof(toot.date), new Date(toot.date));
    //   toot.data.createdDate = new Date(toot.date);
    //   toot.data.isMastodon = true;
    //   newNotes.push(toot);
    // })

    // console.log(newNotes[newNotes.length-1])
    // console.log('-----')
    // console.log(newNotes[0])
    return newNotes
      .sort(function(a, b) {
        // console.log(a.data.createdDate, b.data.createdDate);
        const timeA = a.data.createdDate ? a.data.createdDate.getTime() : 0;
        const timeB = b.data.createdDate ? b.data.createdDate.getTime() : 0;
        return timeB - timeA;
      });
  });



  eleventyConfig.addCollection('allthings', collection => {
    const posts = collection.getFilteredByTag('post');
    const notes = collection.getFilteredByTag('note');
    const all = [...posts, ...notes];

    const sorted = all.sort(function (a, b) {
      const timeA = a.data.createdDate
        ? a.data.createdDate.getTime()
        : 0;

      const timeB = b.data.createdDate
        ? b.data.createdDate.getTime()
        : 0;
      return timeA - timeB;
    });

    return sorted;
    // const updated = updateReplyToByThreadStartNotion(sorted);

    // return updated;
  });

  // Create an array of all tags
  eleventyConfig.addCollection("tagList", function(collection) {
    let tagSet = new Set();
    collection.getAll().forEach(item => {
      (item.data.tags || []).forEach(tag => tagSet.add(tag));
    });

    return filterTagList([...tagSet]);
  });

  // https://shivjm.blog/colophon/how-i-create-an-article-series-in-eleventy/
  eleventyConfig.addCollection("series", (collection) => {
    // get all posts in chronological order
    const posts = collection.getSortedByDate();
  
    // this will store the mapping from series to lists of posts; it can be a
    // regular object if you prefer
    const dict = new Object();
  
    // loop over the posts
    for (const post of posts) {
      // get any series data for the current post, and store the date for later
      const { series, date } = post.data;
  
      // ignore anything with no series data
      // if (series === undefined) {
      if (!series) {
        continue;
      }
  
      // if we haven’t seen this series before, create a new entry in the mapping
      // (i.e. take the description from the first post we encounter)
      if (!dict[series]) {
        dict[series] = {
          title: series,
          posts: [],
          // description: seriesDescription,
        };
      }
  
      // get the entry for this series
      const existing = dict[series];
  
      // add the current post to the list
      existing.posts.push({url: post.url, title: post.data.title, date: post.data.date});
  
      // update the date so we always have the date from the latest post
      // existing.date = date;
    }
  
    // now to collect series containing more than one post as an array that
    // Eleventy can paginate
    const normalized = [];
  
    for (const key in dict) {
      // console.debug(dict[key]);
      seriesDict = dict[key];
      if (seriesDict.posts.length > 1) {
        // add any series with multiple posts to the new array
        normalized.push({ title: seriesDict.title, posts: seriesDict.posts, slug: eleventyConfig.getFilter("slugify")(seriesDict.title) });
      }
    }
  
    // return the array
    return normalized;
    // return mapping;
  });

  eleventyConfig.addTransform('replace-special-links', async function(content){
    if (this.outputPath && this.outputPath.endsWith(".html")) {
      return await replaceSpecialLinks(content, {});
    }

    return content;
  });

  eleventyConfig.addTransform('img2figure', async function(content){
    if (this.outputPath && this.outputPath.endsWith(".html")) {
      return await imgToFigure(content);
    }

    return content;
  });

  // Copy the `img` and `css` folders to the output
  eleventyConfig.addPassthroughCopy("src/img");
  eleventyConfig.addPassthroughCopy({"src/posts/attachments": "attachments"});

  let markdownItObsidian = require("markdown-it-obsidian")();
  // Customize Markdown library and settings:
  const markdownLibrary = markdownIt({
    html: true,
    breaks: true,
    linkify: true
  }).use(markdownItAnchor, {
    permalink: markdownItAnchor.permalink.ariaHidden({
      placement: "after",
      class: "direct-link",
      symbol: "#",
      level: [1,2,3,4],
    }),
    slugify: eleventyConfig.getFilter("slugify")
  }).use(markdownItFootnote).use(markdownItObsidian);

    // markdownLibrary.renderer.rules.image = function (tokens, idx, options, env, slf) {
    //   const token = tokens[idx]
    //   console.debug(token);

    //   return imgToFigure(token);
    // //   return `<figure>
    // //   ${slf.renderToken(tokens, idx, options)}
    // //   <figcaption>${token.attrs[token.attrIndex('alt')][1]}</figcaption>
    // // </figure>`
    // }

  eleventyConfig.setLibrary("md", markdownLibrary);

  // Override Browsersync defaults (used only with --serve)
  eleventyConfig.setBrowserSyncConfig({
    callbacks: {
      ready: function(err, browserSync) {
        const content_404 = fs.readFileSync('_site/404.html');

        browserSync.addMiddleware("*", (req, res) => {
          // Provides the 404 content without redirect.
          res.writeHead(404, {"Content-Type": "text/html; charset=UTF-8"});
          res.write(content_404);
          res.end();
        });
      },
    },
    ui: false,
    ghostMode: false
  });

  return {
    // Control which files Eleventy will process
    // e.g.: *.md, *.njk, *.html, *.liquid
    templateFormats: [
      "js",
      "md",
      "njk",
      "html",
      "liquid"
    ],

    // -----------------------------------------------------------------
    // If your site deploys to a subdirectory, change `pathPrefix`.
    // Don’t worry about leading and trailing slashes, we normalize these.

    // If you don’t have a subdirectory, use "" or "/" (they do the same thing)
    // This is only used for link URLs (it does not affect your file structure)
    // Best paired with the `url` filter: https://www.11ty.dev/docs/filters/url/

    // You can also pass this in on the command line using `--pathprefix`

    // Optional (default is shown)
    pathPrefix: "/",
    // -----------------------------------------------------------------

    // Pre-process *.md files with: (default: `liquid`)
    markdownTemplateEngine: "njk",

    // Pre-process *.html files with: (default: `liquid`)
    htmlTemplateEngine: "njk",

    // Opt-out of pre-processing global data JSON files: (default: `liquid`)
    dataTemplateEngine: false,

    // These are all optional (defaults are shown):
    dir: {
      input: "src",
      includes: "_includes",
      data: "_data",
      output: "_site"
    }
  };
};
