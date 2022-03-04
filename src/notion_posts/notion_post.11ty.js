const { getLocalImageLink, optimizeImage } = require("../_11ty/helpers");
const slugify = require("@11ty/eleventy/src/Filters/Slugify");

const isDevEnv = process.env.ELEVENTY_ENV === "development";
const todaysDate = new Date();

function showPost(data) {
  const isPublished = "published" in data && data.published === true;
  const isFutureDate = !data.date_published || data.date_published > todaysDate;
  console.log('@@@@', data.title, (isDevEnv || (isPublished && !isFutureDate)), isDevEnv, isPublished, !isFutureDate)
  return isDevEnv || (isPublished && !isFutureDate);
}

class NotionPost {
  data() {
    return {
      layout: "layouts/post.njk",
      templateEngineOverride: "11ty.js,md",
      pagination: {
        data: "notion_posts",
        size: 1,
        alias: "notion_post",
        addAllPagesToCollections: true,
      },

      eleventyComputed: {
        eleventyExcludeFromCollections: function (data) {
          if (showPost(data.notion_post)) {
            return data.eleventyExcludeFromCollections;
          } else {
            return true;
          }
        },
        tags: ["post"],

        title: (data) => data.notion_post.title,
        description: (data) => data.notion_post.description ? data.notion_post.description : '',
        lead: (data) => data.notion_post.lead ? data.notion_post.lead : '',
        thumbnail: (data) => optimizeImage(data.notion_post.thumbnail),
        created_date: (data) => {
          return new Date(data.notion_post.date_published)
        },
        permalink: (data) => {
          if(!showPost(data.notion_post)) {
            return `/post/${data.notion_post.id}/`; //false;
          }
          const slug = data.notion_post.slug ? data.notion_post.slug : slugify(data.notion_post.title) ;
          return `/post/${slug}/`;
        },
      },
      
    };
  }
  render(data) {
    return data.notion_post.content;
  }
}

module.exports = NotionPost;
