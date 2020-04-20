import React from "react"
import { Link } from "gatsby"

export default class BlogSeries extends React.Component {
  render() {
    const { name, currentPostSlug, posts } = this.props
    return (
      name !== null &&
      name !== undefined && (
        <div className="blog-series">
          <hr />
          <h3>Series - {name}</h3>
          <ul>
            {posts.map(({ node }) => {
              const isCurrent = node.fields.slug === currentPostSlug
              return (
                <Link key={`series-` + node.fields.slug} to={node.fields.slug}>
                  <li className={isCurrent ? `current` : ``}>
                    {node.frontmatter.title}
                  </li>
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
