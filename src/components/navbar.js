import React from "react"
import { Link, StaticQuery } from "gatsby"
import Logo from "../../content/assets/logo.svg"
import TwitterIcon from "../../content/assets/twitter.svg"
import GithubIcon from "../../content/assets/github.svg"
import DevIcon from "../../content/assets/dev.svg"
import LinkedInIcon from "../../content/assets/linkedin.svg"
import RssIcon from "../../content/assets/rss.svg"

export default class Navbar extends React.Component {
  render() {
    return (
      <StaticQuery
        query={socialsQuery}
        render={data => {
          const socials = data.site.siteMetadata.social
          return (
            <nav>
              <span className="navbar-links">
                <Link className="icon-link" to={`/`}>
                  <Logo className="icon" />
                </Link>
                <Link to={`/`}>Lanky Dan Blog</Link>
              </span>
              <span>
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
              </span>
            </nav>
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
