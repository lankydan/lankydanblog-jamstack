import React from "react"
import { Link } from "gatsby"
import { rhythm, scale } from "../utils/typography"

class Layout extends React.Component {
  render() {
    const { location, title, sideBar, children } = this.props
    const rootPath = `${__PATH_PREFIX__}/`
    let header

    if (location.pathname === rootPath) {
      header = (
        <h1
          style={{
            fontFamily: `ubuntu, Montserrat`,
            ...scale(1.5),
            marginBottom: rhythm(1.5),
            marginTop: 0,
            textTransform: `uppercase`,
          }}
        >
          <Link
            style={{
              boxShadow: `none`,
              textDecoration: `none`,
              color: `inherit`,
            }}
            to={`/`}
          >
            {title}
          </Link>
        </h1>
      )
    } else {
      header = (
        <h3
          style={{
            fontFamily: `ubuntu, Montserrat`,
            marginTop: 0,
            textTransform: `uppercase`,
          }}
        >
          <Link
            style={{
              boxShadow: `none`,
              textDecoration: `none`,
              color: `inherit`,
            }}
            to={`/`}
          >
            {title}
          </Link>
        </h3>
      )
    }
    return (
      <div>
        {sideBar !== undefined && (
          <div
            style={{
              height: `100%`,
              width: rhythm(9),
              position: `fixed`,
              zIndex: 1,
              top: 0,
              left: 0,
              overflowX: `hidden`,
              paddingTop: rhythm(3),
            }}
          >
            {sideBar}
          </div>
        )}
        <div
          style={{
            marginLeft: `auto`,
            marginRight: `auto`,
            maxWidth: rhythm(50),
            padding: `${rhythm(1.5)} ${rhythm(3 / 4)}`,
          }}
        >
          <header>{header}</header>
          <main>{children}</main>
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
