import React from "react"
import { StaticQuery, graphql } from "gatsby"
import Bio from "../components/bio"
import Layout from "../components/layout"
import SEO from "../components/seo"
import BlogList from "../components/blog-list"
import { rhythm } from "../utils/typography"

export default class BlogIndexPageList extends React.Component {
  render() {
    const location = this.props.location
    return (
      <StaticQuery
        query={blogListQuery}
        render={data => {
          return (
            <Layout
              location={location}
              title={data.site.siteMetadata.title}
            >
              <SEO
                title="All posts"
                keywords={[`blog`, `gatsby`, `javascript`, `react`]}
              />
              <Bio />
              <BlogList
                posts={this.props.posts}
                cardWidth={rhythm(16.5)}
                cardHeight={rhythm(12.5)}
              />
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
