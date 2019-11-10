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
    const socialIconSize = {
      width: `22px`,
      height: `22px`,
    }
    return (
      <StaticQuery
        query={socialsQuery}
        render={data => {
          const socials = data.site.siteMetadata.social
          return (
            <nav>
              <span class="navbar-links">
                <Link className="icon" to={`/`}>
                  <Logo
                    style={{
                      width: `22px`,
                      height: `22px`,
                    }}
                  />
                </Link>
                <Link to={`/`}>Lanky Dan Blog</Link>
              </span>
              <span>
                <SocialLink link={`https://twitter.com/${socials.twitter}`}>
                  <TwitterIcon style={socialIconSize} />
                </SocialLink>
                <SocialLink link={socials.dev}>
                  <DevIcon style={socialIconSize} />
                </SocialLink>
                <SocialLink link={socials.github}>
                  <GithubIcon style={socialIconSize} />
                </SocialLink>
                <SocialLink link={socials.linkedin}>
                  <LinkedInIcon style={socialIconSize} />
                </SocialLink>
                <Link className="icon" to={`/rss`}>
                  <RssIcon style={socialIconSize} />
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
      <a class="icon" href={link} target="_blank" rel="noreferrer">
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
