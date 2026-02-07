import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: ['/admin/', '/portal/profile'], // Protect private routes from crawling
        },
        sitemap: 'https://consultoriodelgado.com/sitemap.xml',
    }
}
