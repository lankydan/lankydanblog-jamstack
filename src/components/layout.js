import React from "react"
import { rhythm } from "../utils/typography"
import Navbar from "./navbar"

class Layout extends React.Component {
  render() {
      const { title, children } = this.props
    let header

    if (title !== undefined) {
      header = <h1 className="blog-header">{title}</h1>
    }
    return (
      <div
        className="main"
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
