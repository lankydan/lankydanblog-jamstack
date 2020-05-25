import React from "react"
import { rhythm, scale } from "../utils/typography"

export default class BlogPostDate extends React.Component {
  render() {
    const { post } = this.props
    const date = post.frontmatter.date
    const updated_date = post.frontmatter.updated_date
    if (updated_date !== null && updated_date !== undefined) {
      return (
        <div>
          <p className="post-date">{date}</p>
          <p className="post-date">Last updated - {updated_date}</p>
        </div>
      )
    }
    return <p className="post-date">{date}</p>
  }
}
