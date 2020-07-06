console.log(
  `Google tracking id: '${process.env.GOOGLE_ANALYTICS_TRACKING_CODE}'`
)

module.exports = {
  siteMetadata: {
    title: `Lanky Dan Blog`,
    author: `Dan Newton`,
    description: `Lanky Dan - Software Development Blog`,
    siteUrl: `https://lankydan.dev`,
    social: {
      twitter: `LankyDanDev`,
      linkedin: `https://www.linkedin.com/in/danknewton/`,
      github: `https://github.com/lankydan`,
      dev: `https://dev.to/lankydandev`,
    },
  },
  plugins: [
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        path: `${__dirname}/content/blog`,
        name: `blog`,
      },
    },
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        path: `${__dirname}/content/assets`,
        name: `assets`,
      },
    },
    {
      resolve: `gatsby-transformer-remark`,
      options: {
        plugins: [
          {
            resolve: `gatsby-remark-images`,
            options: {
              maxWidth: 750,
            },
          },
          {
            resolve: "gatsby-remark-embed-video",
            options: {
              related: false,
              noIframeBorder: true,
              urlOverrides: [
                {
                  id: "youtube",
                  embedURL: videoId =>
                    `https://www.youtube-nocookie.com/embed/${videoId}`,
                },
              ],
            },
          },
          {
            resolve: `gatsby-remark-responsive-iframe`,
            options: {
              wrapperStyle: `margin-bottom: 1.0725rem`,
            },
          },
          {
            resolve: `gatsby-remark-prismjs`,
            options: {
              classPrefix: "language-",
              inlineCodeMarker: null,
              aliases: {},
              showLineNumbers: false,
              noInlineHighlight: false,
            },
          },
          `gatsby-remark-copy-linked-files`,
          `gatsby-remark-smartypants`,
          {
            resolve: `gatsby-remark-twitter-cards`,
            options: {
              title: "Lanky Dan Blog",
              separator: "|",
              author: "Dan Newton",
              background: require.resolve(
                "./content/assets/blog-card-template.png"
              ),
              fontColor: "#ffffff",
              titleFontSize: 96,
              subtitleFontSize: 60,
              fontFile: require.resolve(
                "./content/assets/fonts/Roboto-Regular.ttf"
              ),
            },
          },
        ],
      },
    },
    `gatsby-transformer-sharp`,
    {
      resolve: `gatsby-plugin-sharp`,
      options: {
        defaultQuality: 80,
      },
    },
    {
      resolve: `gatsby-plugin-react-svg`,
      options: {
        rule: {
          include: `${__dirname}/content/assets`,
        },
      },
    },
    {
      resolve: `gatsby-plugin-google-analytics`,
      options: {
        trackingId: process.env.GOOGLE_ANALYTICS_TRACKING_CODE,
      },
    },
    {
      resolve: `gatsby-plugin-feed`,
      options: {
        // not using base query here since it does not seem to work with
        // multiple feeds, therefore site data has been added to each
        // feeds query manually
        feeds: [
          {
            output: "/rss/all.xml",
            title: "All posts RSS Feed",
            serialize: ({ query: { site, allMarkdownRemark } }) => {
              if (allMarkdownRemark === null) {
                return []
              }
              return allMarkdownRemark.edges.map(edge => {
                return Object.assign({}, edge.node.frontmatter, {
                  description: edge.node.excerpt,
                  date: edge.node.frontmatter.date,
                  url: site.siteMetadata.siteUrl + edge.node.fields.slug,
                  guid: site.siteMetadata.siteUrl + edge.node.fields.slug,
                  custom_elements: [{ "content:encoded": edge.node.html }],
                })
              })
            },
            query: `
              {
                site {
                  siteMetadata {
                    title
                    description
                    siteUrl
                    site_url: siteUrl
                  }
                }
                allMarkdownRemark(
                  limit: 1000,
                  sort: { order: DESC, fields: [frontmatter___date] },
                  filter: {frontmatter: { published: { eq: true } }}
                ) {
                  edges {
                    node {
                      excerpt
                      html
                      fields { slug }
                      frontmatter {
                        title
                        date
                        include_date_in_url
                      }
                    }
                  }
                }
              }
            `,
          },
          {
            output: "/rss/jvm.xml",
            title: "JVM posts RSS Feed",
            serialize: ({ query: { site, allMarkdownRemark } }) => {
              if (allMarkdownRemark === null) {
                return []
              }
              return allMarkdownRemark.edges.map(edge => {
                return Object.assign({}, edge.node.frontmatter, {
                  description: edge.node.excerpt,
                  date: edge.node.frontmatter.date,
                  url: site.siteMetadata.siteUrl + edge.node.fields.slug,
                  guid: site.siteMetadata.siteUrl + edge.node.fields.slug,
                  custom_elements: [{ "content:encoded": edge.node.html }],
                })
              })
            },
            query: `
              {
                site {
                  siteMetadata {
                    title
                    description
                    siteUrl
                    site_url: siteUrl
                  }
                }
                allMarkdownRemark(
                  limit: 1000,
                  sort: { order: DESC, fields: [frontmatter___date] },
                  filter: {frontmatter: { 
                    published: { eq: true } 
                    tags: { in: ["java", "spring", "kotlin"] }
                  }}
                ) {
                  edges {
                    node {
                      excerpt
                      html
                      fields { slug }
                      frontmatter {
                        title
                        date
                      }
                    }
                  }
                }
              }
            `,
          },
          {
            output: "/rss/corda.xml",
            title: "Corda posts RSS Feed",
            serialize: ({ query: { site, allMarkdownRemark } }) => {
              if (allMarkdownRemark === null) {
                return []
              }
              console.log(allMarkdownRemark)
              return allMarkdownRemark.edges.map(edge => {
                return Object.assign({}, edge.node.frontmatter, {
                  description: edge.node.excerpt,
                  date: edge.node.frontmatter.date,
                  url: site.siteMetadata.siteUrl + edge.node.fields.slug,
                  guid: site.siteMetadata.siteUrl + edge.node.fields.slug,
                  custom_elements: [{ "content:encoded": edge.node.html }],
                })
              })
            },
            query: `
              {
                site {
                  siteMetadata {
                    title
                    description
                    siteUrl
                    site_url: siteUrl
                  }
                }
                allMarkdownRemark(
                  limit: 1000,
                  sort: { order: DESC, fields: [frontmatter___date] },
                  filter: {frontmatter: { 
                    published: { eq: true } 
                    tags: { in: ["corda"] }
                  }}
                ) {
                  edges {
                    node {
                      excerpt
                      html
                      fields { slug }
                      frontmatter {
                        title
                        date
                      }
                    }
                  }
                }
              }
            `,
          },
        ],
      },
    },
    {
      resolve: `gatsby-plugin-manifest`,
      options: {
        name: `Lanky Dan Blog`,
        short_name: `lankydan.dev`,
        start_url: `/`,
        background_color: `#ffffff`,
        theme_color: `#613380`,
        display: `minimal-ui`,
        icon: `content/assets/logo.svg`,
      },
    },
    `gatsby-plugin-offline`,
    `gatsby-plugin-react-helmet`,
    {
      resolve: `gatsby-plugin-react-helmet-canonical-urls`,
      options: {
        siteUrl: `https://lankydan.dev`,
        noTrailingSlash: true,
      },
    },
    {
      resolve: `gatsby-plugin-typography`,
      options: {
        pathToConfigModule: `src/utils/typography`,
      },
    },
    {
      resolve: `gatsby-plugin-sitemap`,
      options: {
        query: `
        {
          site {
            siteMetadata {
              siteUrl
            }
          }
          allSitePage {
            edges {
              node {
                path
                context {
                  lastMod
                }
              }
            }
          }
        }
      `,
      // https://joshwcomeau.com/gatsby/seo-friendly-sitemap/
      // Used information from this blog post to add `lastmod` to the sitemap
        serialize: ({ site, allSitePage }) => {
          return allSitePage.edges.map(({ node }) => {
            console.log("lastMod = " + node.context.lastMod)
            return {
              url: site.siteMetadata.siteUrl + node.path,
              lastmod: node.context.lastMod,
              changefreq: "daily",
              priority: 0.7,
            }
          })
        },
      },
    },
  ],
}
