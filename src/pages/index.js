import React from "react"
import { Link, graphql } from "gatsby"

import Bio from "../components/bio"
import Layout from "../components/layout"
import SEO from "../components/seo"
import { rhythm } from "../utils/typography"
import Img from "gatsby-image"

class BlogIndex extends React.Component {
  render() {
    const { data } = this.props
    const siteTitle = data.site.siteMetadata.title
    const posts = data.allMarkdownRemark.edges

    return (
      <Layout location={this.props.location} title={siteTitle}>
        <SEO
          title="All posts"
          keywords={[`blog`, `gatsby`, `javascript`, `react`]}
        />
        <Bio />
        {posts.map(({ node }) => {
          const title = node.frontmatter.title || node.fields.slug
          return (
            <Link style={{ boxShadow: `none` }} to={node.fields.slug}>
              <div
                key={node.fields.slug}
                style={{
                  border: `1px solid #d6d6d6`,
                  margin: `0.5em auto 0px`,
                }}
              >
                {node.frontmatter.cover_image && (
                  <Img
                    fluid={node.frontmatter.cover_image.childImageSharp.fluid}
                    style={{
                      position: `relative`,
                      width: `100%`,
                      margin: `auto`,
                      background: `transparent no-repeat center center`,
                      backgroundSize: `cover`,
                      zIndex: 2,
                    }}
                  />
                )}
                <div
                  style={{
                    padding: `1em`,
                  }}
                >
                  <h3
                    style={{
                      marginBottom: rhythm(1 / 4),
                      marginTop: rhythm(1 / 4),
                      color: `black`,
                    }}
                  >
                    {title}
                  </h3>
                  <small style={{ color: `grey` }}>
                    {node.frontmatter.date}
                  </small>
                  <p
                    style={{ color: `black` }}
                    dangerouslySetInnerHTML={{
                      __html: node.frontmatter.description || node.excerpt,
                    }}
                  />
                </div>
              </div>
            </Link>
          )
        })}
      </Layout>
    )
  }
}

export default BlogIndex

export const pageQuery = graphql`
  query {
    site {
      siteMetadata {
        title
      }
    }
    allMarkdownRemark(sort: { fields: [frontmatter___date], order: DESC }) {
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
