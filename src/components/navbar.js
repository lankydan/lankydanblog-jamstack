import React from "react"
import { Link, StaticQuery } from "gatsby"
// import Logo from "../../content/assets/Logo_group_2.svg"
import Logo from "../../content/assets/Logo_small.svg"
import TwitterIcon from "../../content/assets/twitter.svg"
import GithubIcon from "../../content/assets/github.svg"
import DevIcon from "../../content/assets/dev.svg"
import LinkedInIcon from "../../content/assets/linkedin.svg"
import RssIcon from "../../content/assets/rss.svg"
import ThemeSelector from "./theme-selector"

export default class Navbar extends React.Component {
  render() {
    return (
      <StaticQuery
        query={socialsQuery}
        render={(data) => {
          const socials = data.site.siteMetadata.social
          return (
            <div className="navbar-wrapper">
              <div className="navbar-wrapper-inner">
                <nav>
                  <Link className="logo-link" to={`/`}>
                    <Logo className="logo" />
                  </Link>
                  {/* <span className="navbar-links"> */}
                  {/* <Link className="icon-link" to={`/`}> */}
                  {/* <Link className="logo-link" to={`/`}>
                  <Logo className="icon logo" />
                </Link> */}
                  {/* <Link to={`/`}>Lanky Dan Blog</Link> */}
                  {/* </span> */}
                  <span className="navbar-links">
                    <SocialLink link={`https://twitter.com/${socials.twitter}`}>
                      <TwitterIcon className="icon" />
                    </SocialLink>
                    <SocialLink link={socials.dev}>
                      <DevIcon className="icon" />
                    </SocialLink>
                    <SocialLink link={socials.github}>
                      <GithubIcon className="icon" />
                    </SocialLink>
                    <SocialLink link={socials.linkedin}>
                      <LinkedInIcon className="icon" />
                    </SocialLink>
                    <Link className="icon-link" to={`/rss`}>
                      <RssIcon className="icon" />
                    </Link>
                    <ThemeSelector />
                  </span>
                  {/* </span> */}
                </nav>
              </div>
            </div>
          )
        }}
      />
    )
  }
}

class SocialLink extends React.Component {
  render() {
    const { link, children } = this.props
    return (
      <a className="icon-link" href={link} target="_blank" rel="noreferrer">
        {children}
      </a>
    )
  }
}

const socialsQuery = graphql`
  query SocialsQuery {
    site {
      siteMetadata {
        author
        social {
          twitter
          linkedin
          github
          dev
        }
      }
    }
  }
`
