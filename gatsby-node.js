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
                published
                series
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
          series: post.node.frontmatter.series,
          previous: previous,
          next: next,
        },
      })
    })

    // create blog post index page urls
    const blogIndexPages = []
    const postsPerPage = 10
    const publishedPosts = posts.filter(post => post.node.frontmatter.published)
    const numPages = Math.ceil(publishedPosts.length / postsPerPage)
    Array.from({ length: numPages }).forEach((_, index) => {
      const url = index === 0 ? `/blog` : `/blog/${index + 1}`
      blogIndexPages.push(url)
    })
    // create the blog post index pages and use urls for previous and next pages
    blogIndexPages.forEach((url, index) => {
      const previous = index === 0 ? null : blogIndexPages[index - 1]
      const next =
        index === blogIndexPages.length - 1 ? null : blogIndexPages[index + 1]
      createPage({
        path: url,
        component: path.resolve("./src/templates/paginated-blog-list.js"),
        context: {
          limit: postsPerPage,
          skip: index * postsPerPage,
          previous: previous,
          next: next,
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
