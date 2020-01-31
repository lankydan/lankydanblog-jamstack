import React from "react"
import { Link } from "gatsby"
import Img from "gatsby-image"
import { rhythm } from "../utils/typography"
import BlogTags from "./blog-tags"

class BlogList extends React.Component {
  render() {
    const { posts, cardWidth, cardHeight } = this.props
    return (
      <div className="blog-card-list">
        {posts.map(({ node }) => {
          const title = node.frontmatter.title || node.fields.slug
          return (
            <Link
              className="blog-card-link"
              key={node.fields.slug}
              style={{
                width: cardWidth,
              }}
              to={node.fields.slug}
            >
              <div
                className="blog-card"
                style={{
                  minHeight: cardHeight,
                }}
              >
                {node.frontmatter.cover_image && (
                  <Img
                    fluid={node.frontmatter.cover_image.childImageSharp.fluid}
                  />
                )}
                <div className="blog-card-text"
                  style={{
                    padding: `0.5em 1em`,
                  }}
                >
                  <h3
                    className="blog-card-title"
                    style={{
                      marginBottom: rhythm(1 / 4),
                      marginTop: rhythm(1 / 4),
                    }}
                  >
                    {title}
                  </h3>
                  <small>{node.frontmatter.date}</small>
                  <BlogTags post={node} />
                  <p
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
    )
  }
}

export default BlogList
