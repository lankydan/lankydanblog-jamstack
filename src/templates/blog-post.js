import React from "react"
import { Link, graphql } from "gatsby"

import Bio from "../components/bio"
import Layout from "../components/layout"
import SEO from "../components/seo"
import { rhythm, scale } from "../utils/typography"
import Img from "gatsby-image"
import Socials from "../components/socials"

class BlogPostTemplate extends React.Component {
  render() {
    const post = this.props.data.markdownRemark
    const posts = this.props.data.allMarkdownRemark.edges
    const siteTitle = this.props.data.site.siteMetadata.title
    const { previous, next } = this.props.pageContext

    return (
      <Layout location={this.props.location} title={siteTitle}>
        <SEO
          title={post.frontmatter.title}
          description={post.frontmatter.description || post.excerpt}
        />
        {post.frontmatter.cover_image !== null && (
          <Img
            fluid={post.frontmatter.cover_image.childImageSharp.fluid}
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
        <h1
          style={{
            marginTop: `2rem`,
          }}
        >
          {post.frontmatter.title}
        </h1>
        <p
          style={{
            ...scale(-1 / 5),
            display: `block`,
            marginBottom: rhythm(1),
            marginTop: rhythm(-1),
          }}
        >
          {post.frontmatter.date}
        </p>
        <div dangerouslySetInnerHTML={{ __html: post.html }} />
        <Socials
          siteUrl={this.props.data.site.siteMetadata.siteUrl}
          postPath={this.props.pageContext.slug}
          postNode={post}
        />
        <hr
          style={{
            marginBottom: rhythm(1),
          }}
        />
        <Bio />
        <hr
          style={{
            marginBottom: rhythm(1),
          }}
        />
        <div
          style={{
            maxWidth: `100%`,
            verticalAlign: `center`,
            margin: `0 auto`,
            float: `none`,
            textAlign: `center`,
            display: `block`,
          }}
        >
          {posts.map(({ node }) => {
            const title = node.frontmatter.title || node.fields.slug
            return (
              <Link
                style={{
                  boxShadow: `none`,
                  width: rhythm(15),
                  display: `inline-block`,
                  maxWidth: `94%`,
                  padding: `10px`,
                  verticalAlign: `top`,
                  textAlign: `left`,
                  float: `none`,
                  position: `relative`,
                  margin: `0 auto`,
                }}
                to={node.fields.slug}
              >
                <div
                  key={node.fields.slug}
                  style={{
                    border: `2px solid #d6d6d6`,
                    margin: `0.5em 0px 0px`,
                    boxShadow: `3px 3px 0px rgba(97, 51, 128, 0.612)`,
                    maxWidth: `100%`,
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
        </div>
        <div>
          <ul
            style={{
              display: `flex`,
              flexWrap: `wrap`,
              justifyContent: `space-between`,
              listStyle: `none`,
              padding: 0,
            }}
          >
            <li>
              {previous && (
                <Link to={previous.fields.slug} rel="prev">
                  ← {previous.frontmatter.title}
                </Link>
              )}
            </li>
            <li>
              {next && (
                <Link to={next.fields.slug} rel="next">
                  {next.frontmatter.title} →
                </Link>
              )}
            </li>
          </ul>
        </div>
      </Layout>
    )
  }
}

export default BlogPostTemplate

export const pageQuery = graphql`
  query BlogPostBySlug($slug: String!) {
    site {
      siteMetadata {
        title
        author
        siteUrl
      }
    }
    markdownRemark(fields: { slug: { eq: $slug } }) {
      id
      excerpt(pruneLength: 160)
      html
      frontmatter {
        title
        date(formatString: "MMMM DD, YYYY")
        description
        cover_image {
          childImageSharp {
            resize(width: 1500, height: 1500) {
              src
            }
            fluid(maxWidth: 786, maxHeight: 300, cropFocus: CENTER) {
              ...GatsbyImageSharpFluid
            }
          }
        }
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
