/**
 * SEO component that queries for data with
 *  Gatsby's useStaticQuery React hook
 *
 * See: https://www.gatsbyjs.org/docs/use-static-query/
 */

import React from "react"
import PropTypes from "prop-types"
import Helmet from "react-helmet"
import { useStaticQuery, graphql } from "gatsby"
import urljoin from "url-join"

function SEO({
  url,
  description,
  lang,
  meta,
  keywords,
  title,
  image,
  date,
  timeToRead,
  slug
}) {
  const { site } = useStaticQuery(
    graphql`
      query {
        site {
          siteMetadata {
            title
            siteUrl
            description
            author
            social {
              twitter
            }
          }
        }
      }
    `
  )

  const metaDescription = description || site.siteMetadata.description
  const siteUrl = site.siteMetadata.siteUrl

  var imageUrl = null
  if (image !== undefined && image !== null) {
    if (image.startsWith(`/static/`)) {
      imageUrl = urljoin(siteUrl, image)
    } else {
      imageUrl = image
    }
  }

  return (
    <Helmet
      htmlAttributes={{
        lang,
      }}
      title={title}
      titleTemplate={`%s | ${site.siteMetadata.title}`}
      meta={[
        {
          name: `og:url`,
          content: url,
        },
        {
          name: `description`,
          content: metaDescription,
        },
        {
          property: `og:title`,
          content: title,
        },
        {
          property: `og:description`,
          content: metaDescription,
        },
        {
          property: `og:type`,
          content: `website`,
        },
        {
          name: `twitter:card`,
          content: `summary_large_image`,
        },
        {
          name: `twitter:creator`,
          content: site.siteMetadata.social.twitter,
        },
        {
          name: `twitter:title`,
          content: title,
        },
        {
          name: `twitter:description`,
          content: metaDescription,
        },
        {
          name: `author`,
          content: site.siteMetadata.author,
        },
        {
          name: `twitter:data1`,
          content: `${timeToRead} min read`,
        },
        {
          name: `twitter:image`,
          content: `${siteUrl}${slug}/twitter-card.jpg`
        },
        {
          name: `article:published_time`,
          content: date,
        },
        {
          name: `google-site-verification`,
          content: `Gdg19vWoDs-Ch1tVhs9C2prThL_r0AkMKAgVxDBPke4`,
        },
      ]
        .concat(
          keywords.length > 0
            ? {
                name: `keywords`,
                content: keywords.join(`, `),
              }
            : []
        )
        .concat(meta)
        .concat(
          imageUrl !== null
            ? [
                {
                  name: `og:image`,
                  content: imageUrl,
                }
              ]
            : []
        )}
    />
  )
}

SEO.defaultProps = {
  lang: `en`,
  meta: [],
  keywords: [],
}

SEO.propTypes = {
  description: PropTypes.string,
  lang: PropTypes.string,
  meta: PropTypes.array,
  keywords: PropTypes.arrayOf(PropTypes.string),
  title: PropTypes.string.isRequired,
}

export default SEO
