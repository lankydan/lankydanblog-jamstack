import React from "react"

export default class BlogTags extends React.Component {
  render() {
    const { post } = this.props
    const tags = post.frontmatter.tags
    return (
      <div>
        {tags !== null &&
          tags !== undefined &&
          tags.map((tag, index) => {
            return (
              <small
                key={tag}
                style={{
                  backgroundColor: `rgba(97, 51, 128, 0.612)`,
                  color: `white`,
                  display: `inline-block`,
                  marginRight: `2px`,
                  padding: `0px 8px`,
                  borderRadius: `4px`,
                }}
              >
                {tag}
              </small>
            )
          })}
      </div>
    )
  }
}
