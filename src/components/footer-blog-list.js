import React from "react"
import { rhythm } from "../utils/typography"
import BlogList from "../components/blog-list"

class FooterBlogList extends React.Component {
  render() {
    const { posts } = this.props
    return (
      <BlogList
        isFooter={true}
        posts={posts}
        cardWidth={rhythm(15)}
        cardHeight={rhythm(12.5)}
      />
    )
  }
}

export default FooterBlogList
