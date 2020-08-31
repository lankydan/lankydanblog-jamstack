import React from "react"
import BlogList from "../components/blog-list"

class FooterBlogList extends React.Component {
  render() {
    const { posts } = this.props
    return <BlogList isFooter={true} posts={posts} />
  }
}

export default FooterBlogList
