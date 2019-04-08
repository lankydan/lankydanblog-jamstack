import React from "react"
import { StaticQuery, graphql, Link } from "gatsby"
import Bio from "../components/bio"
import Layout from "../components/layout"
import SEO from "../components/seo"
import BlogList from "../components/blog-list"
import { rhythm } from "../utils/typography"

export default class BlogIndexPageList extends React.Component {
  render() {
    // const location = this.props.location
    const { location, previous, next } = this.props
    const rootPath = `${__PATH_PREFIX__}/`
    var postButtons
    if (location.pathname === rootPath) {
      postButtons = (
        <p>
          <Link to={`/blog`}>All posts</Link>
        </p>
      )
    } else {
      postButtons = (
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
                <Link to={previous} rel="prev">
                  ← previous
                </Link>
              )}
            </li>
            <li>
              {next && (
                <Link to={next} rel="next">
                  next →
                </Link>
              )}
            </li>
          </ul>
        </div>
      )
    }
    return (
      <StaticQuery
        query={blogListQuery}
        render={data => {
          return (
            <Layout location={location} title={data.site.siteMetadata.title}>
              <SEO
                title="All posts"
                keywords={[
                  `blog`,
                  `java`,
                  `kotlin`,
                  `corda`,
                  `software development`,
                ]}
              />
              <Bio />
              <BlogList
                posts={this.props.posts}
                cardWidth={rhythm(16.5)}
                cardHeight={rhythm(12.5)}
              />
              {postButtons}
            </Layout>
          )
        }}
      />
    )
  }
}

export const blogListQuery = graphql`
  query {
    site {
      siteMetadata {
        title
      }
    }
  }
`
