import React from "react"
import { rhythm } from "../utils/typography"
import Navbar from "./navbar"

class Layout extends React.Component {
  render() {
    const { header, children } = this.props
    return (
      <div>
        <Navbar />
        <header>{header}</header>
        <div
          className="main"
          style={{
            marginLeft: `auto`,
            marginRight: `auto`,
            maxWidth: rhythm(38),
            padding: `0 0 ${rhythm(1.5)} 0`,
          }}
        >
          <div
            style={{
              padding: `30px ${rhythm(3 / 4)}`,
            }}
          >
            <main>{children}</main>
          </div>

          <footer>
            © {new Date().getFullYear()}, Built with
            {` `}
            <a href="https://www.gatsbyjs.org">Gatsby</a>
          </footer>
        </div>
      </div>
    )
  }
}

export default Layout
