import React from "react"
import { rhythm } from "../utils/typography"
import { Link, StaticQuery } from "gatsby"
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
            <nav
              style={{
                width: rhythm(38),
              }}
            >
              <span class="navbar-links">
                <Link to={`/`}>Lanky Dan Blog</Link>
                {/* <Link to={`/blog`}>About</Link> */}
              </span>
              <span class="social-links">
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
                <SocialLink link={`https://twitter.com/`}>
                  <RssIcon style={socialIconSize} />
                </SocialLink>
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
      <a href={link} target="_blank" rel="noreferrer">
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
