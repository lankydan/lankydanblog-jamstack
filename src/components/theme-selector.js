import React, { useState, useEffect } from "react"

class ThemeSelector extends React.Component {
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

    if (typeof window !== "undefined") {
      detectColorScheme()
    }

    const currentTheme =
      typeof window !== "undefined" && localStorage.getItem("theme")
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
    return (
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
      </div>
    )
  }
}

export default ThemeSelector
