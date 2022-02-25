const markdownIt = require("markdown-it");
const Cache = require("@11ty/eleventy-cache-assets");
const outdent = require("outdent")({ newline: " " });

const { getLocalImageLink } = require("../_11ty/helpers");
const { youtube, youtube_parser, reddit } = require("./shortcodes");

const EMPTY = ``;

const Image = require("@11ty/eleventy-img");

async function imageShortcode(src, alt) {
  if(alt === undefined) {
    // You bet we throw an error on missing alt (alt="" works okay)
    throw new Error(`Missing \`alt\` on myImage from: ${src}`);
  }

  const fileSource = src.startsWith('/img') ? `./src${src}` : src;

  let metadata = await Image(fileSource, {
    widths: [1200],
    outputDir: '_site/img',
    duration: '8w'
  });

  let data = metadata.jpeg[metadata.jpeg.length - 1];
  // square counts as vertical
  const isVerticalClassname = data.height >= data.width ? 'class="vertical"' : '';
  return `<img src="${data.url}" width="${data.width}" height="${data.height}" alt="${alt}" ${isVerticalClassname} loading="lazy" decoding="async">`;
}

function uuidv4() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    var r = (Math.random() * 16) | 0,
      v = c == "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

async function figure(image, caption="", className="", alt="") {
  const localSrc = getLocalImageLink(image);

  const mdCaption = caption ? markdownIt().renderInline(caption) : EMPTY;
  const classMarkup = className ? ` class="${className}"` : '';
  const captionMarkup = caption ? `<figcaption>${mdCaption}</figcaption>` : '';
  const imgTag = await imageShortcode(localSrc, alt);
  return `<figure${classMarkup}>${imgTag}${captionMarkup}</figure>`;
}

async function blur(src, caption, className="", alt="") {
  const uuid = uuidv4();

  const figureTag = await figure(src, caption, className, alt);
  return `<div class="blurDiv blurred" id="${uuid}" onclick="document.getElementById('${uuid}').className = 'blurDiv';" >${figureTag}</div>`;
};

async function card(title, img, rating, review_link, goodreads) {
  const localImg = getLocalImageLink(img);

  const badge = rating ? `<div class="card-badge">${rating}</div>` : EMPTY;
  const imgTag = localImg ? `<div class="card-image-div"><img src="${localImg}"/></div>` : EMPTY;
  const reviewTag = review_link ? `<p><a href="${review_link}">Review</a></p>` : EMPTY;
  // todo: extract domain and use as link text
  const goodreadsTag = goodreads ? `<p><a href="${goodreads}" target="_blank" rel="noopener noreferrer">Goodreads</a></p>` : EMPTY;

  return `<div class="card">
${badge}  
${imgTag}
<div class="card-content">
<p class="card-title">${title}</p>
${reviewTag} 
${goodreadsTag}
</div>
</div>`;
}

const template = ({
  image,
  title,
  url,
  publisher,
  description,
  logo,
  author,
  date,
}) => {
  const imageEl = image ? `<img
class="unfurl__image"
src="${image.url}"
width="${image.width}"
height="${image.height}"
alt=""
/>` : '';

  const titleEl = `<h4 class="unfurl__heading"><a class="unfurl__link" href="${url}">${title}</a></h4>`;

  const descriptionEl = `<p class="unfurl__description">${description}</p>`;
  const logoEl = logo ? outdent`<img
class="unfurl__logo"
src="${logo.url}"
width="${logo.width}"
height="${logo.height}"
alt=""
/>` : '';
  // const dateEl = `
  //     <time class="unfurl__date" datetime="${date}">
  //       Posted ${formatDate(date)}
  //     </time>
  //   `;
  const publisherEl = `<span class="unfurl__publisher">${publisher}</span>`;

  return `<div class="unfurl">
${titleEl}
${image ? imageEl : ""}
${description ? descriptionEl : ""}
<small class="unfurl__meta">
${logo ? logoEl : ""}
${publisher ? publisherEl : ""}
</small>
</div>`;
};

// https://github.com/daviddarnes/eleventy-plugin-unfurl
const unfurl = async(url) => {
  const metadata = await Cache(`https://api.microlink.io/?url=${url}`, {
      duration: "8w",
      type: "json",
    });

    return template(metadata.data);
}

async function anyEmbed(url) {
  if (!url) return ``;

  if (url.startsWith('https://www.youtube.com/') || url.startsWith('https://youtu.be/')) {
    const id = youtube_parser(url);
    return youtube(id);
  }

  if (url.startsWith('https://www.reddit.com/')) return reddit(url);

  return await unfurl(url);
}

module.exports = {
  figure,
  blur,
  card,
  anyEmbed,
  unfurl,
};

