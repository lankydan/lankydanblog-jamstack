import React from "react"
import { StaticQuery, graphql } from "gatsby"
import { StaticImage } from "gatsby-plugin-image"

function Bio() {
  return (
    <StaticQuery
      query={bioQuery}
      render={(data) => {
        const { author, social } = data.site.siteMetadata
        return (
          <div className="post-written-by-wrapper">
            <div className="post-written-by">
              <StaticImage
                src="../../content/assets/me.png"
                alt={author}
                style={{
                  marginRight: `1rem`,
                  width: `90px`,
                  height: `90px`
                }}
                imgStyle={{
                  borderRadius: `50%`,
                }}
              />
              <div>
                Written by {author}
                <div className="post-written-by-socials">
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
