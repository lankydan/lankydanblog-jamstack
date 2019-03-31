import React from "react"
import { graphql } from "gatsby"
import BlogIndexPageList from "../components/blog-index-page-list"

export default class PaginatedBlogList extends React.Component {
  render() {
    const posts = this.props.data.allMarkdownRemark.edges
    return <BlogIndexPageList posts={posts} location={this.props.location} />
  }
}

export const blogListQuery = graphql`
  query blogListQuery($skip: Int!, $limit: Int!) {
    allMarkdownRemark(
      sort: { fields: [frontmatter___date], order: DESC }
      limit: $limit
      skip: $skip
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
            cover_image {
              childImageSharp {
                resize(width: 1500, height: 1500) {
                  src
                }
                fluid(maxWidth: 786, maxHeight: 200, cropFocus: CENTER) {
                  ...GatsbyImageSharpFluid
                }
              }
            }
          }
        }
      }
    }
  }
`
