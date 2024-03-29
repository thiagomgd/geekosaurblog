const markdownIt = require("markdown-it");
const outdent = require("outdent")({ newline: " " });

const metadata = require("../_data/metadata.json");

const EMPTY = ``;

const youtube = (id) => {
  return outdent`<div class="video-wrapper">
<iframe src="https://www.youtube-nocookie.com/embed/${id}"
frameborder="0" 
allowfullscreen>
</iframe>
</div>`;
};

const reddit = (url) => {
  return `<blockquote class="reddit-card">
<a href="${url}">r/${metadata.subreddit} Lounge</a>
from <a href="http://www.reddit.com/r/${metadata.subreddit}">r/${metadata.subreddit}</a></blockquote>
<script async src="//embed.redditmedia.com/widgets/platform.js" charset="UTF-8"></script>`;
};

function uuidv4() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    var r = (Math.random() * 16) | 0,
      v = c == "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// TODO: not finished yet. Needs css
function spoiler(text) {
  const uuid = uuidv4();
  return outdent`<span class="spoilers" title="Click to show spoiler"
onclick="document.getElementById('${uuid}').className = 'spoiler-text spoiler-show';"><span
class="spoiler-alert">(spoilers)</span>
<span id="${uuid}" class="spoiler-text">${text}</span></span>`;
}

// FROM https://stackoverflow.com/a/8260383/4637883
// http://www.youtube.com/watch?v=0zM3nApSvMg&feature=feedrec_grec_index
// http://www.youtube.com/user/IngridMichaelsonVEVO#p/a/u/1/QdK8U-VIH_o
// http://www.youtube.com/v/0zM3nApSvMg?fs=1&amp;hl=en_US&amp;rel=0
// http://www.youtube.com/watch?v=0zM3nApSvMg#t=0m10s
// http://www.youtube.com/embed/0zM3nApSvMg?rel=0
// http://www.youtube.com/watch?v=0zM3nApSvMg
// http://youtu.be/0zM3nApSvMg
function youtube_parser(url) {
  var regExp =
    /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
  var match = url.match(regExp);
  return match && match[7].length == 11 ? match[7] : false;
}

function metagen(data) {
  if (!data) {
    console.error("No data was added into the meta generator");
    return "";
  }
  const metadata = `<meta charset="utf-8">
                    <meta http-equiv="X-UA-Compatible" content="IE=edge">
                    <meta name="viewport" content="width=device-width, initial-scale=1">
                    <title>${data.title}</title>
                    <meta name="author" content="${data.name}">
                    <meta name="title" content="${data.title}">
                    <meta name="description" content="${data.desc}">
                    <meta name="robots" content="${data.robots}">
                    <meta name="generator" content="${data.generator}">\n`;

  const openGraph = `${
    data.comments
      ? `${
          data.og_comment
            ? `<!-- ${data.og_comment} -->`
            : "<!-- Open Graph -->"
        }`
      : ""
  }
                    <meta property="og:type" content="${getAttr(
                      data.type,
                      "website"
                    )}">
                    <meta property="og:url" content="${data.url}">
                    <meta property="og:site_name" content="${data.site_name}">
                    <meta property="og:locale" content="${getAttr(
                      data.locale,
                      "en_US"
                    )}">
                    <meta property="og:title" content="${
                      data.og_title || data.title
                    }">
                    <meta property="og:description" content="${
                      data.og_desc || data.desc
                    }">
                    <meta property="og:image" content="${data.img}">
                    <meta property="og:image:alt" content="${data.img_alt}">
                    <meta property="og:image:width" content="${data.img_width}">
                    <meta property="og:image:height" content="${
                      data.img_height
                    }">\n`;
  const twitterCard = `${
    data.comments
      ? `${
          data.twitter_comment
            ? `<!-- ${data.twitter_comment} -->`
            : "<!-- Twitter -->"
        }`
      : ""
  }
                    <meta ${getAttr(
                      data.attr_name,
                      "name"
                    )}="twitter:card" content="${getAttr(
    data.twitter_card_type,
    "summary"
  )}">
                    <meta ${getAttr(
                      data.attr_name,
                      "name"
                    )}="twitter:site" content="@${data.twitter_handle}">
                    ${getAttr(data.twitter_card_type, undefined, [
                      "summary_large_image",
                      `<meta ${getAttr(
                        data.attr_name,
                        "name"
                      )}="twitter:creator" content="@${getAttr(
                        data.creator_handle,
                        data.twitter_handle
                      )}">`,
                    ])}
                    <meta ${getAttr(
                      data.attr_name,
                      "name"
                    )}="twitter:url" content="${data.url}">
                    <meta ${getAttr(
                      data.attr_name,
                      "name"
                    )}="twitter:title" content="${
    data.twitter_title || data.title
  }">
                    <meta ${getAttr(
                      data.attr_name,
                      "name"
                    )}="twitter:description" content="${
    data.twitter_desc || data.desc
  }">
                    <meta ${getAttr(
                      data.attr_name,
                      "name"
                    )}="twitter:image" content="${data.img}">
                    <meta ${getAttr(
                      data.attr_name,
                      "name"
                    )}="twitter:image:alt" content="${data.img_alt}">\n`;
  const canonical = `<link rel="canonical" href="${data.url}">`;

  function getAttr(prop, fallback, c = null) {
    if (c && typeof c == "object" && c[0] == "summary_large_image") {
      return prop == c[0] ? c[1] : fallback;
    }
    return prop ? prop : fallback;
  }

  const output = metadata.concat(openGraph, twitterCard, canonical).split("\n");
  const validTags = output.filter((tag) => tag.includes("undefined") === false);
  const cleanOutput = validTags.join("\n").replace(/^\s+|[,]$/gm, "");

  return cleanOutput;
}

const getVideoUrl = (url) => {
  if (url.includes(".gifv")) {
    return url.replace(".gifv", ".mp4");
  }

  return url;
};

const getVideoType = (url) => {
  if (url.includes(".webm")) {
    return "video/webm";
  }

  if (url.includes(".mp4")) {
    return "video/mp4";
  }

  return "video";
};

const video = (url) => {
  const videoUrl = getVideoUrl(url);
  const videoType = getVideoType(videoUrl);

  return `<video controls><source src="${videoUrl}" type="${videoType}"/>`;
};

const gfycat = (url, caption = "") => {
  let id;
  if (url.includes("/")) {
    const parts = url.split("/");
    id = parts[parts.length - 1];
  } else {
    id = url;
  }

  const captionCode = caption ? `<p>${caption}</p>` : "";
  return `<div class="mediaEmbed"><div style='position:relative; padding-bottom:calc(61.80% + 44px)'><iframe src='https://gfycat.com/ifr/${id}' frameborder='0' scrolling='no' width='100%' height='100%' style='position:absolute;top:0;left:0;' allowfullscreen></iframe></div>${captionCode}</div>`;
};

const imgurEmbed = (url, caption = "") => {
  let id;
  if (url.includes("/")) {
    const parts = url.split("/");
    id = parts[parts.length - 1];
    id = id.split("#")[0];
  } else {
    id = url;
  }

  const captionCode = caption ? `<p>${caption}</p>` : "";
  return `<div class="mediaEmbed"><blockquote class="imgur-embed-pub" lang="en" data-id="a/${id}"  ><a href="//imgur.com/a/${id}"></a></blockquote><script async src="//s.imgur.com/min/embed.js" charset="utf-8"></script>${captionCode}</div>`;
};

// LINKS AS LIST
// const linksPost = (toots) => {
//   if (!toots) return "";
//   // console.log(toots);
//   const links = [];

//   toots.forEach((toot) => {
//     const comments = toot.linkComments.map((comment) => {
//       return `<li>${comment}</li>`;
//     });

//     const seeAlsoLinks = toot.seeAlso.map((item) => {
//       return `<a href="${item.link}">${item.title}</a>`;
//     });
//     const seeAlso = seeAlsoLinks
//       ? `<li>See also: ${seeAlsoLinks.join(", ")}</li>`
//       : "";

//     const linkHtml = `<li>
//     <a href="${toot.linkUrl}">${toot.title}</a>
//     <ul>${comments.join("")}${seeAlso}</ul>
//     </li>`;

//     links.push(linkHtml);
//   });

//   return `
//   <ul>
//   ${links.join("")}
//   </ul>
//   `;
// };

const linksPost = (toots) => {
  if (!toots) return "";
  // console.log(toots);
  const links = [];

  toots.forEach((toot) => {
    const comments = toot.linkComments.map((comment) => {
      return `<li>${comment}</li>`;
    });

    const seeAlsoLinks = toot.seeAlso.map((item) => {
      return `<a href="${item.link}">${item.title}</a>`;
    });
    const seeAlso = seeAlsoLinks
      ? `<li>See also: ${seeAlsoLinks.join(", ")}</li>`
      : "";

    const linkHtml = `<li>
    <a href="${toot.linkUrl}">${toot.title}</a>
    <ul>${comments.join("")}${seeAlso}</ul>
    </li>`;

    links.push(linkHtml);
  });

  return `
  <ul>
  ${links.join("")}
  </ul>
  `;
};

module.exports = {
  youtube_parser,
  youtube,
  reddit,
  metagen,
  video,
  gfycat,
  imgurEmbed,
  linksPost,
};
