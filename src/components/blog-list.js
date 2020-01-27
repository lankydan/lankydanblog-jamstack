import React from "react"
import { Link } from "gatsby"
import Img from "gatsby-image"
import { rhythm } from "../utils/typography"
import BlogTags from "./blog-tags"

class BlogList extends React.Component {
  render() {
    const { posts, cardWidth, cardHeight } = this.props
    return (
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
              key={node.fields.slug}
              style={{
                boxShadow: `none`,
                width: cardWidth,
                display: `inline-block`,
                maxWidth: `100%`,
                padding: `10px`,
                verticalAlign: `top`,
                textAlign: `left`,
                float: `none`,
                position: `relative`,
                margin: `0 auto`,
                backgroundImage: `none`
              }}
              to={node.fields.slug}
            >
              <div
                className="blog-card"
                style={{
                  margin: `0.5em 0px 0px`,
                  maxWidth: `100%`,
                  minHeight: cardHeight,
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
                    padding: `0.5em 1em`,
                  }}
                >
                  <h3
                    className="blog-card-title"
                    style={{
                      marginBottom: rhythm(1 / 4),
                      marginTop: rhythm(1 / 4),
                      // color: `black`,
                    }}
                  >
                    {title}
                  </h3>
                  <small>
                    {node.frontmatter.date}
                  </small>
                 <BlogTags post={node}/>
                  <p
                    // style={{ color: `black` }}
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
