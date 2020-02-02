import React from "react"
import { rhythm } from "../utils/typography"
import Navbar from "./navbar"

class Layout extends React.Component {
  render() {
    function detectColorScheme() {
      var theme = "light"

      // check local storage
      if (localStorage.getItem("theme")) {
        if (localStorage.getItem("theme") == "dark") {
          var theme = "dark"
        }
      } else if (!window.matchMedia) {
        // if not supported
        return false
      } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
        // OS uses dark mode
        var theme = "dark"
      }

      // dark theme preferred, set document with a `data-theme` attribute
      if (theme == "dark") {
        document.documentElement.setAttribute("data-theme", "dark")
      }
    }
    detectColorScheme()

    const currentTheme = localStorage.getItem("theme")
      ? localStorage.getItem("theme")
      : null

    let isChecked = false
    if (currentTheme) {
      document.documentElement.setAttribute("data-theme", currentTheme)

      if (currentTheme === "dark") {
        isChecked = true
      }
    }

    function switchTheme(e) {
      if (e.target.checked) {
        document.documentElement.setAttribute("data-theme", "dark")
        localStorage.setItem("theme", "dark") //add this
      } else {
        document.documentElement.setAttribute("data-theme", "light")
        localStorage.setItem("theme", "light") //add this
      }
    }

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
          <div className="theme-switch-wrapper">
            <label className="theme-switch">
              <input
                type="checkbox"
                id="checkbox"
                onClick={switchTheme}
                defaultChecked={isChecked}
              />
              <div className="slider round" />
            </label>
            <em>Enable Dark Mode!</em>
          </div>
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
