import { Metadata } from 'next'


export function constructMetadata({
    title = "Dionysus - The AI SaaS for Decoding GitHub Repos",
    description = "Dionysus, the AI-powered SaaS that simplifies, decodes, and explains complex projects.",
    image = "/thumbnail2.webp",
    icons = "/logo3.png",
    noIndex = false
  }: {
    title?: string
    description?: string
    image?: string
    icons?: string
    noIndex?: boolean
  } = {}): Metadata {
    return {
      title,
      description,
      openGraph: {
        title,
        description,
        images: [
          {
            url: image
          }
        ]
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: [image],
        creator: "@DevanshTiwari21"
      },
      icons,
      metadataBase: new URL('https://dinoysus.vercel.app'),
      themeColor: '#FFF',
      ...(noIndex && {
        robots: {
          index: false,
          follow: false
        }
      })
    }
  }