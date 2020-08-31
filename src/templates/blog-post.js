import React from "react"
import { Link, graphql } from "gatsby"

import Bio from "../components/bio"
import Layout from "../components/layout"
import SEO from "../components/seo"
import { rhythm } from "../utils/typography"
import FooterBlogList from "../components/footer-blog-list"
import BlogTags from "../components/blog-tags"
import BlogSeries from "../components/blog-series"
import BlogPostDate from "../components/blog-post-date"
import urljoin from "url-join"

class BlogPostTemplate extends React.Component {
  render() {
    const post = this.props.data.markdownRemark
    const posts = this.props.data.lastFourPosts.edges
    const series = this.props.data.series.edges
    const githubUrl = post.frontmatter.github_url
    const { previous, next } = this.props.pageContext
    const postUrl = urljoin(
      this.props.data.site.siteMetadata.siteUrl,
      this.props.pageContext.slug
    )
    const header = (
      <div className="post-header">
        <div className="post-header-grid">
          <h1
            className="post-header-title"
            style={{
              marginTop: `2rem`,
            }}
          >
            {post.frontmatter.title}
          </h1>
          <BlogPostDate post={post} />
          <BlogTags post={post} />
        </div>
      </div>
    )
    return (
      <Layout header={header} location={this.props.location}>
        <SEO
          url={postUrl}
          title={post.frontmatter.title}
          description={post.frontmatter.description || post.excerpt}
          image={
            post.frontmatter.cover_image &&
            post.frontmatter.cover_image.childImageSharp.original.src
          }
          date={post.frontmatter.date}
          timeToRead={post.timeToRead}
          keywords={post.frontmatter.tags}
        />
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
        <BlogSeries
          name={post.frontmatter.series}
          currentPostSlug={this.props.pageContext.slug}
          posts={series}
        />
        <div dangerouslySetInnerHTML={{ __html: post.html }} />
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
        <FooterBlogList posts={posts} />
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
            original {
              src
            }
          }
        }
      }
      timeToRead
    }
    series: allMarkdownRemark(
      sort: { fields: [frontmatter___date], order: ASC }
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
    lastFourPosts: allMarkdownRemark(
      sort: { fields: [frontmatter___date], order: DESC }
      filter: {
        fields: { slug: { ne: $slug } }
        frontmatter: { published: { eq: true } }
      }
      limit: 4
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
          }
        }
      }
    }
  }
`
