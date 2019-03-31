import React from "react"

export default class BlogTag extends React.Component {
  render() {
    const { name } = this.props
    const { backgroundColor, color } = this.getTagColorScheme(name)
    return (
      <small
        style={{
          backgroundColor: backgroundColor,
          color: color,
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

  getTagColorScheme(name) {
    switch (name) {
      case `java`:
        return {
          backgroundColor: `#292D3E`,
          color: `#82AAFF`,
        }
      case `kotlin`:
        return {
          backgroundColor: `#5f77df`,
          color: `#ffa032`,
        }
      case `spring`:
        return {
          backgroundColor: `#6db33f`,
          color: `white`,
        }
      case `spring-boot`:
        return {
          backgroundColor: `#6db33f`,
          color: `white`,
        }
      case `spring-data`:
        return {
          backgroundColor: `#6db33f`,
          color: `white`,
        }
      case `cassandra`:
        return {
          backgroundColor: `#36f7ba`,
          color: `#5824db`,
        }
      case `corda`:
        return {
          backgroundColor: `#e11c1b`,
          color: `white`,
        }
      case `dlt`:
        return {
          backgroundColor: `#ff6f16`,
          color: `#2439de`,
        }
      case `blockchain`:
        return {
          backgroundColor: `#55d5f5`,
          color: `#ba40db`,
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
          backgroundColor: `rgba(97, 51, 128, 0.612)`,
          color: `white`,
        }
    }
  }
}
