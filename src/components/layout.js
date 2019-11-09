import React from "react"
import { rhythm } from "../utils/typography"
import Navbar from "./navbar"

class Layout extends React.Component {
  render() {
    const { location, title, children } = this.props
    const rootPath = `${__PATH_PREFIX__}/`
    let header

    if (location.pathname === rootPath) {
      header = (
        <h1
          style={{
            font: `400 70px Oswald`,
            letterSpacing: `6px`,
            wordSpacing: `9px`,
            marginBottom: rhythm(1.5),
            marginTop: 0,
            textTransform: `uppercase`,
            textDecoration: `none`,
            textAlign: `center`,
          }}
        >
          {title}
        </h1>
      )
    }
    return (
      <div
        style={{
          marginLeft: `auto`,
          marginRight: `auto`,
          maxWidth: rhythm(38),
          padding: `0 0 ${rhythm(1.5)} 0`,
        }}
      >
        <Navbar />
        <div
          style={{
            padding: `30px ${rhythm(3 / 4)}`,
          }}
        >
          <header>{header}</header>
          <main>{children}</main>
        </div>
        <footer>
          © {new Date().getFullYear()}, Built with
          {` `}
          <a href="https://www.gatsbyjs.org">Gatsby</a>
        </footer>
      </div>
    )
  }
}

export default Layout
