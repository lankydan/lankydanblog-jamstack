import React from "react"
import { graphql } from "gatsby"

import BlogIndexPageList from "../components/blog-index-page-list"

class IndexPage extends React.Component {
  render() {
    const posts = this.props.data.allMarkdownRemark.edges
    return <BlogIndexPageList posts={posts} location={this.props.location} />
  }
}

export default IndexPage

export const pageQuery = graphql`
  query {
    site {
      siteMetadata {
        title
      }
    }
    allMarkdownRemark(
      filter: {frontmatter: { published: { eq: true } }}
      sort: { fields: [frontmatter___date], order: DESC }
      limit: 10
    ) {
      edges {
        node {
          excerpt
          fields {
            slug
          }
          frontmatter {
            date(formatString: "MMMM DD, YYYY")
            title
            description
            tags
          }
        }
      }
    }
  }
`
