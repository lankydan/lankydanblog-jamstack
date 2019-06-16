import React from "react"
import { graphql } from "gatsby"
import BlogIndexPageList from "../components/blog-index-page-list"

export default class PaginatedBlogList extends React.Component {
  render() {
    const posts = this.props.data.allMarkdownRemark.edges
    const { previous, next } = this.props.pageContext
    return (
      <BlogIndexPageList
        posts={posts}
        location={this.props.location}
        previous={previous}
        next={next}
      />
    )
  }
}

export const blogListQuery = graphql`
  query blogListQuery($skip: Int!, $limit: Int!) {
    allMarkdownRemark(
      filter: {frontmatter: { published: { eq: true } }}
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
                fluid(maxWidth: 780, maxHeight: 300, cropFocus: CENTER) {
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
