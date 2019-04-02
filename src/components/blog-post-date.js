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
          <p
            style={{
              ...scale(-1 / 5),
              marginTop: rhythm(-1),
            }}
          >
            {date}
          </p>
          <p
            style={{
              ...scale(-1 / 5),
              marginBottom: rhythm(0),
              marginTop: rhythm(-1),
            }}
          >
            Last updated - {updated_date}
          </p>
        </div>
      )
    }
    return (
      <p
        style={{
          ...scale(-1 / 5),
          marginBottom: rhythm(0),
          marginTop: rhythm(-1),
        }}
      >
        {date}
      </p>
    )
  }
}
