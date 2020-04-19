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
          <ul>
            {posts.map(({ node }) => {
              return (
                <Link to={node.fields.slug}>
                  <li>{node.frontmatter.title}</li>
                </Link>
              )
            })}
          </ul>
          <hr />
        </div>
      )
    )
  }
}
