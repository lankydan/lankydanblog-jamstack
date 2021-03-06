import React from "react"
import { StaticQuery, graphql, Link } from "gatsby"
import Layout from "../components/layout"
import SEO from "../components/seo"
import BlogList from "../components/blog-list"

export default class BlogIndexPageList extends React.Component {
  render() {
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
        render={(data) => {
          return (
            <Layout location={location}>
              <SEO
                title="All posts"
                keywords={[
                  `java`,
                  `kotlin`,
                  `corda`,
                  `software development`,
                  `software engineering`,
                ]}
                image={data.homePageImage.childImageSharp.original.src}
              />
              <BlogList posts={this.props.posts} />
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
    homePageImage: file(absolutePath: { regex: "/home-page-image.png/" }) {
      childImageSharp {
        original {
          src
        }
      }
    }
    site {
      siteMetadata {
        title
      }
    }
  }
`
