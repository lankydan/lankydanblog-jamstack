import React from "react"

export default class BlogTag extends React.Component {
  render() {
    const { name } = this.props
    const { backgroundColor, color } = this.getTagColorScheme(name)
    const style = {}
    if (backgroundColor != null && color != null) {
      style.backgroundColor = backgroundColor
      style.color = color
    }
    return (
      <small className="blog-tag" style={style}>
        {name}
      </small>
    )
  }

  getTagColorScheme(name) {
    if (name.includes(`spring`)) {
      return {
        backgroundColor: `#2E7D32`,
        color: `white`,
      }
    }
    if (name.includes(`corda`)) {
      return {
        backgroundColor: `#e11c1b`,
        color: `white`,
      }
    }
    switch (name) {
      case `java`:
        return {
          backgroundColor: `#292D3E`,
          color: `white`,
        }
      case `kotlin`:
        return {
          backgroundColor: `#4258b8`,
          color: `white`,
        }
      case `cassandra`:
        return {
          backgroundColor: `#880E4F`,
          color: `white`,
        }
      case `dlt`:
      case `distributed ledger technology`:
        return {
          backgroundColor: `#4A148C`,
          color: `white`,
        }
      case `blockchain`:
        return {
          backgroundColor: `#C2185B`,
          color: `white`,
        }
      case `docker`:
        return {
          backgroundColor: `#099cec`,
          color: `white`,
        }
      case `rust`:
        return {
          backgroundColor: `black`,
          color: `white`,
        }
      default:
        return {
          backgroundColor: null,
          color: null,
        }
    }
  }
}
