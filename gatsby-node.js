const path = require(`path`)
const { createFilePath } = require(`gatsby-source-filesystem`)
const moment = require(`moment`)

exports.createPages = ({ graphql, actions }) => {
  const { createPage } = actions

  const blogPost = path.resolve(`./src/templates/blog-post.js`)
  return graphql(
    `
      {
        allMarkdownRemark(
          sort: { fields: [frontmatter___date], order: DESC }
          limit: 1000
        ) {
          edges {
            node {
              fields {
                slug
              }
              frontmatter {
                title
              }
            }
          }
        }
      }
    `
  ).then(result => {
    if (result.errors) {
      throw result.errors
    }

    // Create blog posts pages.
    const posts = result.data.allMarkdownRemark.edges

    posts.forEach((post, index) => {
      const previous = index === posts.length - 1 ? null : posts[index + 1].node
      const next = index === 0 ? null : posts[index - 1].node
      createPage({
        path: post.node.fields.slug,
        component: blogPost,
        context: {
          slug: post.node.fields.slug,
          previous,
          next,
        },
      })
    })

    const postsPerPage = 10
    const numPages = Math.ceil(posts.length / postsPerPage)
    Array.from({ length: numPages }).forEach((_, i) => {
      createPage({
        path: i === 0 ? `/blog` : `/blog/${i + 1}`,
        component: path.resolve("./src/templates/paginated-blog-list.js"),
        context: {
          limit: postsPerPage,
          skip: i * postsPerPage,
        },
      })
    })

    return null
  })
}

exports.onCreateNode = ({ node, actions, getNode }) => {
  const { createNodeField } = actions

  if (node.internal.type === `MarkdownRemark`) {
    // commented out code is from gatsby starter and retrieves via relative path (blog/sub-folder-n/blog-post-sub-folder)
    // const value = createFilePath({ node, getNode })

    // use the title or manually set slug value to be the slug of the post
    // replace whitespace with `-`
    // remove all invalid url characters with
    const postName = `/${
      node.frontmatter.slug !== undefined
        ? node.frontmatter.slug
        : node.frontmatter.title
            .replace(/\s+/g, `-`)
            .replace(/[^a-zA-Z0-9-_]/g, "")
            .toLowerCase()
    }`
    const dateUrl = node.frontmatter.include_date_in_url
      ? `/${moment(node.frontmatter.date).format(`YYYY/MM/DD`)}`
      : ``
    const value = dateUrl + postName
    createNodeField({
      name: `slug`,
      node,
      value,
    })
  }
}
