import Typography from "typography"
import elkGlenTheme from "typography-theme-elk-glen"


elkGlenTheme.baseFontSize = '18px'
const typography = new Typography(elkGlenTheme)

// Hot reload typography in development.
if (process.env.NODE_ENV !== `production`) {
  typography.injectStyles()
}

export default typography
export const rhythm = typography.rhythm
export const scale = typography.scale
