import React from "react"
import { Link, graphql } from "gatsby"

import Bio from "../components/bio"
import Layout from "../components/layout"
import SEO from "../components/seo"
import { rhythm } from "../utils/typography"
import Img from "gatsby-image"
import Socials from "../components/socials"
import BlogList from "../components/blog-list"
import BlogTags from "../components/blog-tags"
import BlogSeries from "../components/blog-series"
import BlogPostDate from "../components/blog-post-date"
import Disqus from "disqus-react"
import urljoin from "url-join"

class BlogPostTemplate extends React.Component {
  render() {
    const post = this.props.data.markdownRemark
    const posts = this.props.data.lastFivePosts.edges
    const series = this.props.data.series.edges
    const githubUrl = post.frontmatter.github_url
    const { previous, next } = this.props.pageContext
    const postUrl = urljoin(
      this.props.data.site.siteMetadata.siteUrl,
      this.props.pageContext.slug
    )
    const disqusConfig = {
      url: postUrl,
      identifier: this.props.pageContext.slug,
      title: post.frontmatter.title,
    }
    return (
      <Layout location={this.props.location}>
        <SEO
          url={postUrl}
          title={post.frontmatter.title}
          description={post.frontmatter.description || post.excerpt}
          image={
            post.frontmatter.cover_image &&
            post.frontmatter.cover_image.childImageSharp.resize.src
          }
          date={post.frontmatter.date}
          timeToRead={post.timeToRead}
          keywords={post.frontmatter.tags}
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
        <BlogPostDate post={post} />
        <BlogTags post={post} />
        {githubUrl !== null && githubUrl !== undefined && (
          <div
            style={{
              backgroundColor: `#333`,
              textAlign: `center`,
              maxWidth: `180px`,
              margin: `10px 0 0`,
              borderRadius: `4px`,
            }}
          >
            <a
              href={post.frontmatter.github_url}
              target="_blank"
              rel="noreferrer"
              style={{
                maxWidth: `200px`,
                margin: `5px 0px`,
                color: `white`,
                textDecoration: `none`,
                boxShadow: `0 0`,
                backgroundImage: `none`,
              }}
            >
              GitHub repository
            </a>
          </div>
        )}
        <BlogSeries name={post.frontmatter.series} posts={series} />
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
        <Disqus.DiscussionEmbed
          shortname={this.props.data.site.siteMetadata.disqusShortName}
          config={disqusConfig}
        />
        <BlogList
          posts={posts}
          cardWidth={rhythm(15)}
          cardHeight={rhythm(12.5)}
        />
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
  query BlogPostBySlug($slug: String!, $series: String) {
    site {
      siteMetadata {
        title
        author
        siteUrl
        disqusShortName
      }
    }
    markdownRemark(fields: { slug: { eq: $slug } }) {
      id
      excerpt(pruneLength: 160)
      html
      frontmatter {
        title
        date(formatString: "MMMM DD, YYYY")
        updated_date(formatString: "MMMM DD, YYYY")
        description
        tags
        github_url
        series
        cover_image {
          childImageSharp {
            resize(width: 1500, cropFocus: CENTER) {
              src
            }
            fluid(maxWidth: 780, maxHeight: 300, cropFocus: CENTER) {
              ...GatsbyImageSharpFluid
            }
          }
        }
      }
      timeToRead
    }
    series: allMarkdownRemark(
      sort: { fields: [frontmatter___date], order: DESC }
      filter: {
        frontmatter: {
          published: { eq: true }
          series: { ne: null, eq: $series }
        }
      }
    ) {
      edges {
        node {
          fields {
            slug
          }
          frontmatter {
            title
          }
        }
      }
    }
    lastFivePosts: allMarkdownRemark(
      sort: { fields: [frontmatter___date], order: DESC }
      filter: {
        fields: { slug: { ne: $slug } }
        frontmatter: { published: { eq: true } }
      }
      limit: 5
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
