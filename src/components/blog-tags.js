import React from "react"
import BlogTag from "./blog-tag"

export default class BlogTags extends React.Component {
  render() {
    const { post } = this.props
    const tags = post.frontmatter.tags
    return (
      <div>
        {tags !== null &&
          tags !== undefined &&
          tags.map((tag, index) => {
            return <BlogTag name={tag} />
          })}
      </div>
    )
  }
}
