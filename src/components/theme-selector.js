import React from "react"

class ThemeSelector extends React.Component {
  render() {
    function detectColorScheme() {
      var theme = "light"

      // check local storage
      if (localStorage.getItem("theme")) {
        if (localStorage.getItem("theme") === "dark") {
          theme = "dark"
        }
      } else if (!window.matchMedia) {
        // if not supported
        return false
      } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
        // OS uses dark mode
        theme = "dark"
      }

      // dark theme preferred, set document with a `data-theme` attribute
      if (theme === "dark") {
        document.documentElement.setAttribute("data-theme", "dark")
      }

      return theme
    }

    var currentTheme = "light"
    if (typeof window !== "undefined") {
      currentTheme = detectColorScheme()
    }

    let isChecked = false
    if (currentTheme === "dark") {
      isChecked = true
    }

    function switchTheme(e) {
      if (e.target.checked) {
        document.documentElement.setAttribute("data-theme", "dark")
        localStorage.setItem("theme", "dark")
      } else {
        document.documentElement.setAttribute("data-theme", "light")
        localStorage.setItem("theme", "light")
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
