const path = require("path");
const Jimp = require("jimp");
const dateFormat = require("dateformat");

// TODO: split this file into smaller modules

/**
 * Writes text to the provided image
 * All options are required
 *
 * @param {Jimp} image
 * @param {Object} options
 */
const writeText = async (
  image,
  { text, font, color, size, style, x, y, xBounds, yBounds }
) => {
  // const filename = [font, color, style, size].join("_");
  const fontFile = await Jimp.loadFont(
    // path.join(__dirname, `fonts/${filename}.fnt`)
    // add fira-code.fnt and fira-code.png to use this
    path.join(__dirname, `fira-code.fnt`)
  );
  // const fontFile = await Jimp.read(Jimp.FONT_SANS_32_BLACK);
  // const fontFile = await Jimp.loadFont(Jimp.FONT_SANS_64_BLACK);
  return image.print(fontFile, x, y, text, xBounds, yBounds);
};

/**
 * Compiles the meta string using the supplied post and parts
 *
 * @param {Object} post the markdown node's frontmatter
 * @param {Array} parts the metadata parts that need compiled
 */
const compileMeta = (post, parts) =>
  parts
    .map(part => {
      if (typeof part === "string") {
        // If the part is a string, return it as-is
        return part;
      } else if (typeof part === "object") {
        // If type is object, it could be a text field or date field
        if (part.format !== undefined) {
          // if format is set, field type must be date
          return dateFormat(post[part.field], part.format);
        }
        // If type is not date, field type must be text
        return post[part.field];
      }
    })
    .join("");

/**
 *
 * @param {Object} post the markdown node's frontmatter
 * @param {Object} options the plugin options
 */
const generateCard = async (
  post,
  {
    // Default Settings
    title: {
      field: title_field = "title",
      font: title_font = "DejaVuSansCondensed",
      color: title_color = "black", // black|white
      size: title_size = 48, // 16|24|32|48|64
      style: title_style = "bold", // normal|bold|italic
      x: title_x = null,
      y: title_y = null,
    } = {},
    meta: {
      parts: meta_parts = [
        "- ",
        { field: "author" },
        " » ",
        { field: "date", format: "mmmm dS" },
      ],
      font: meta_font = "DejaVuSansCondensed",
      color: meta_color = "black", // black|white
      size: meta_size = 24, // 16|24|32|48|64
      style: meta_style = "normal", // normal|bold|italic
      x: meta_x = null,
      y: meta_y = null,
    } = {},
    background = "#000000",
    xMargin = 24,
    yMargin = 24,
  } = {},
  markdownNode
) => {
  const width = 600;
  const height = 314;

  // Initialize a new blank image
  // let image2 = await new Jimp(width, height, (err, image) => {
  //   image = writeText(image, {
  //     text: post[title_field],
  //     font: title_font,
  //     color: title_color,
  //     size: title_size,
  //     style: title_style,
  //     x: title_x ? title_x : xMargin,
  //     y: title_y ? title_y : yMargin,
  //     xBounds: width - xMargin,
  //     yBounds: height - yMargin,
  //   });

  //   image = writeText(image, {
  //     text: compileMeta(post, meta_parts),
  //     font: meta_font,
  //     color: meta_color,
  //     size: meta_size,
  //     style: meta_style,
  //     x: meta_x ? meta_x : xMargin,
  //     y: meta_y ? meta_y : height - meta_size - yMargin,
  //     xBounds: width - xMargin,
  //     yBounds: height - yMargin,
  //   });
  //   const output = path.join(
  //     "./public",
  //     markdownNode.fields.slug,
  //     "twitter-card.png"
  //   );
  //   image
  //       .writeAsync(output)
  //       // .write(output)
  //       .then(() => console.log("Generated Twitter Card:", output))
  //       .catch(err => console.log("ERROR GENERATING TWITTER CARD", err))
  // });
  let image = await new Jimp(width, height, background, (err, image) => {
    if (err) throw err
  });

  // Write the post title to the image
  image = await writeText(image, {
    text: post[title_field],
    font: title_font,
    color: title_color,
    size: title_size,
    style: title_style,
    x: title_x ? title_x : xMargin,
    y: title_y ? title_y : yMargin,
    xBounds: width - xMargin,
    yBounds: height - yMargin,
  });

  // // Write the post meta to the image
  image = await writeText(image, {
    text: compileMeta(post, meta_parts),
    font: meta_font,
    color: meta_color,
    size: meta_size,
    style: meta_style,
    x: meta_x ? meta_x : xMargin,
    y: meta_y ? meta_y : height - meta_size - yMargin,
    xBounds: width - xMargin,
    yBounds: height - yMargin,
  });

  return image;

  // const output = path.join(
  //       "./public",
  //       markdownNode.fields.slug,
  //       "twitter-card.png"
  //     );

  // let image = new Jimp(300, 530, 'green', (err, image) => {
  //   if (err) throw err
  // })
  
  // let message = 'Hello!'
  // let x = 10
  // let y = 10
  
  // Jimp.loadFont(Jimp.FONT_SANS_64_BLACK)
  //   .then(font => {
  //     image.print(font, x, y, message)
  //     return image
  //   }).then(image => {
  //     // let file = `new_name.${image.getExtension()}`
  //     return image.write(output) // save
  //   }).then(() => console.log("Generated Twitter Card:", output))
};

module.exports = ({ markdownNode }, options) => {
  const post = markdownNode.frontmatter;

  const output = path.join(
    "./public",
    markdownNode.fields.slug,
    "twitter-card.png"
  );

  generateCard(post, options, markdownNode)
    .then(image =>
      image
        .writeAsync(output)
        .then(() => console.log("Generated Twitter Card:", output))
        .catch(err => console.log("ERROR GENERATING TWITTER CARD", err))
    )
    .catch(console.error);
};