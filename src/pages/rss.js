import React from "react"
import Layout from "../components/layout"

export default class RssPage extends React.Component {
  render() {
    const { location } = this.props
    return (
      <Layout location={location} title="RSS Feeds">
        <div
          style={{
            display: `block`,
            width: `50%`,
            margin: `auto`
          }}
        >
          <RssButton
            text={`ALL`}
            link={`/rss/all.xml`}
            colour={`rgba(97, 51, 128, 0.612)`}
          />
          <RssButton
            text={`JVM`}
            link={`/rss/jvm.xml`}
            colour={`#292D3E`}
          />
          <RssButton
            text={`CORDA`}
            link={`/rss/corda.xml`}
            colour={`#e11c1b`}
          />
        </div>
      </Layout>
    )
  }
}

class RssButton extends React.Component {
  render() {
    const { text, link, colour } = this.props
    return (
      <a href={link} target="_blank" rel="noreferrer">
        <Button text={text} colour={colour} />
      </a>
    )
  }
}

class Button extends React.Component {
  render() {
    const { text, colour } = this.props
    return (
      <div
        style={{
          backgroundColor: colour,
          textAlign: `center`,
          color: `white`,
          marginBottom: `5px`,
          marginRight: `5px`,
          padding: `5px`,
        }}
      >
        {`${text}`}
      </div>
    )
  }
}
