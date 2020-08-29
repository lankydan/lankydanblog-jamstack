import React from "react"
import { StaticQuery, graphql } from "gatsby"
import Image from "gatsby-image"

import { rhythm } from "../utils/typography"

function Bio() {
  return (
    <StaticQuery
      query={bioQuery}
      render={data => {
        const { author, social } = data.site.siteMetadata
        return (
          <div
            style={{
              display: `flex`,
              marginBottom: rhythm(2.5),
            }}
          >
            <Image
              fixed={data.avatar.childImageSharp.fixed}
              alt={author}
              style={{
                marginRight: rhythm(1 / 2),
                marginBottom: 0,
                minWidth: 50,
                borderRadius: `100%`,
              }}
              imgStyle={{
                borderRadius: `50%`,
              }}
            />
            <div
              style={{
                width: `100%`,
              }}
            >
              Written by <strong>{author}</strong>.{` `}
              <div>
                <div
                  style={{
                    display: `inline-block`,
                    width: rhythm(5),
                  }}
                >
                  <FollowButton
                    text={`TWITTER`}
                    link={`https://twitter.com/${social.twitter}`}
                    colour={`#00ACEE`}
                  />
                  <FollowButton
                    text={`LINKEDIN`}
                    link={`${social.linkedin}`}
                    colour={`#0077B5`}
                  />
                  <FollowButton
                    text={`GITHUB`}
                    link={`${social.github}`}
                    colour={`#333`}
                  />
                </div>
                <div
                  style={{
                    display: `inline-block`,
                    width: rhythm(5),
                  }}
                >
                  <RssButton
                    text={`ALL RSS FEED`}
                    link={`/rss/all.xml`}
                    colour={`rgba(97, 51, 128, 0.612)`}
                  />
                  <RssButton
                    text={`JVM RSS FEED`}
                    link={`/rss/jvm.xml`}
                    colour={`#292D3E`}
                    fontColour={`#82AAFF`}
                  />
                  <RssButton
                    text={`CORDA RSS FEED`}
                    link={`/rss/corda.xml`}
                    colour={`#e11c1b`}
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
    avatar: file(absolutePath: { regex: "/me.jpg/" }) {
      childImageSharp {
        fixed(width: 50, height: 50) {
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
      <a href={link} target="_blank" rel="noreferrer">
        <Button text={`${text}++`} colour={colour} fontColour={fontColour} />
      </a>
    )
  }
}

class RssButton extends React.Component {
  render() {
    const { text, link, colour, fontColour } = this.props
    return (
      <a href={link} target="_blank" rel="noreferrer">
        <Button text={text} colour={colour} fontColour={fontColour} />
      </a>
    )
  }
}

class Button extends React.Component {
  render() {
    const { text, colour, fontColour } = this.props
    return (
      <div
        style={{
          backgroundColor: colour,
          textAlign: `center`,
          color: fontColour !== undefined ? fontColour : `white`,
          marginBottom: `2px`,
          marginRight: `2px`,
          fontSize: `14px`,
        }}
      >
        {`${text}`}
      </div>
    )
  }
}
