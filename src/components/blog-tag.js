import React from "react"

export default class BlogTag extends React.Component {
  render() {
    const { name } = this.props
    return (
      <small
        key={name}
        style={{
          backgroundColor: `rgba(97, 51, 128, 0.612)`,
          color: `white`,
          display: `inline-block`,
          marginRight: `2px`,
          padding: `0px 8px`,
          borderRadius: `4px`,
        }}
      >
        {name}
      </small>
    )
  }
}
