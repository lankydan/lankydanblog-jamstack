import React from "react"
import { Link } from "gatsby"

export default class BlogSeries extends React.Component {
  render() {
    const { name, posts } = this.props
    return (
      name !== null &&
      name !== undefined && (
        <div className="blog-series">
          <hr />
          <h3>Series - {name}</h3>
          {posts.map(({ node }) => {
            return (
              <p>
                <Link to={`node.fields.slug`}>{node.frontmatter.title}</Link>
              </p>
            )
          })}
          <hr />
        </div>
      )
    )
  }
}
