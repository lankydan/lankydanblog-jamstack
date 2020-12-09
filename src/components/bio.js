import React from "react"
import { StaticQuery, graphql } from "gatsby"
import Image from "gatsby-image"

function Bio() {
  return (
    <StaticQuery
      query={bioQuery}
      render={(data) => {
        const { author, social } = data.site.siteMetadata
        return (
          <div class="post-written-by-wrapper">
            <div class="post-written-by">
              <Image
                fixed={data.avatar.childImageSharp.fixed}
                alt={author}
                style={{
                  marginRight: `1rem`,
                  minWidth: `90px`,
                  minHeight: `90px`
                }}
                imgStyle={{
                  borderRadius: `50%`,
                }}
              />
              <div>
                Written by {author}
                <div class="post-written-by-socials">
                  <FollowButton
                    text={`Twitter`}
                    link={`https://twitter.com/${social.twitter}`}
                    colour={`#00ACEE`}
                  />
                  <FollowButton
                    text={`LinkedIn`}
                    link={`${social.linkedin}`}
                    colour={`#0077B5`}
                  />
                  <FollowButton
                    text={`GitHub`}
                    link={`${social.github}`}
                    colour={`#333`}
                  />
                </div>
              </div>
            </div>
          </div>
        )
      }}
    />
  )
}

const bioQuery = graphql`
  query BioQuery {
    avatar: file(absolutePath: { regex: "/me.png/" }) {
      childImageSharp {
        fixed(width: 90, height: 90, cropFocus: CENTER, pngQuality: 100) {
          ...GatsbyImageSharpFixed
        }
      }
    }
    site {
      siteMetadata {
        author
        social {
          twitter
          linkedin
          github
        }
      }
    }
  }
`

export default Bio

class FollowButton extends React.Component {
  render() {
    const { text, link, colour, fontColour } = this.props
    return (
      <a
        href={link}
        className="post-social-link"
        target="_blank"
        rel="noreferrer"
      >
        <Button text={`${text}`} colour={colour} fontColour={fontColour} />
      </a>
    )
  }
}

class Button extends React.Component {
  render() {
    const { text, colour, fontColour } = this.props
    return (
      <div
        className="post-social-button"
        style={{
          backgroundColor: colour,
          color: fontColour !== undefined ? fontColour : `white`,
        }}
      >
        {`${text}`}
      </div>
    )
  }
}
