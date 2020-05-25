import React from "react"
import { Link } from "gatsby"
import Img from "gatsby-image"
import { rhythm } from "../utils/typography"
import BlogTags from "./blog-tags"

class BlogList extends React.Component {
  render() {
    const { posts, cardWidth, cardHeight, isFooter } = this.props
    const className = isFooter
      ? "blog-card-list footer-blog-list"
      : "blog-card-list"
    return (
      <div className={className}>
        {posts.map(({ node }) => {
          const title = node.frontmatter.title || node.fields.slug
          const { borderColor } = this.getBorderColorScheme(
            node.frontmatter.tags[0]
          )
          return (
            <Link
              className="blog-card-link"
              key={node.fields.slug}
              style={{
                borderColor: borderColor,
              }}
              to={node.fields.slug}
            >
              <div className="blog-card">
                <div className="blog-card-text">
                  <div className="blog-card-header">
                    <h2 className="blog-card-title">{title}</h2>
                    <small>{node.frontmatter.date}</small>
                    <BlogTags post={node} />
                  </div>
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

  getBorderColorScheme(name) {
    if (name.includes(`spring`)) {
      return {
        borderColor: `#2E7D32`,
      }
    }
    if (name.includes(`corda`)) {
      return {
        borderColor: `#e11c1b`,
      }
    }
    switch (name) {
      case `java`:
        return {
          borderColor: `#292D3E`,
        }
      case `kotlin`:
        return {
          borderColor: `#4258b8`,
        }
      case `cassandra`:
        return {
          borderColor: `#880E4F`,
        }
      case `dlt`:
      case `distributed ledger technology`:
        return {
          borderColor: `#4A148C`,
        }
      case `blockchain`:
        return {
          borderColor: `#C2185B`,
        }
      case `docker`:
        return {
          borderColor: `#099cec`,
        }
      case `rust`:
        return {
          borderColor: `black`,
        }
      default:
        return {
          borderColor: null,
        }
    }
  }
}

export default BlogList
