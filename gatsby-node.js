const path = require(`path`)
const { createFilePath } = require(`gatsby-source-filesystem`)

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
                slug
                date(formatString: "YYYY/MM/DD")
                include_date_in_url
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

      const dateUrl = post.node.frontmatter.include_date_in_url
        ? `/${post.node.frontmatter.date}`
        : ``
      const path = dateUrl + post.node.fields.slug

      createPage({
        path: path,
        component: blogPost,
        context: {
          slug: post.node.fields.slug,
          previous,
          next,
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

    // use title for slug value
    // replace whitespace with `-`
    // remove all invalid url characters with
    const value =
    `/${node.frontmatter.slug !== undefined
        ? node.frontmatter.slug
        : node.frontmatter.title
            .replace(/\s+/g, `-`)
            .replace(/[^a-zA-Z0-9-_]/g, "")
            .toLowerCase()}`
    createNodeField({
      name: `slug`,
      node,
      value,
    })
  }
}
