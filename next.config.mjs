/** @type {import('next').NextConfig} */
const nextConfig = {
    // Configuración compatible con Next.js 14
    experimental: {
        serverComponentsExternalPackages: ["undici", "firebase-admin"],
    },

    // Image domains for Firebase Storage and Google Auth profile pictures
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'lh3.googleusercontent.com',
                pathname: '/**',
            },
            {
                protocol: 'https',
                hostname: 'firebasestorage.googleapis.com',
                pathname: '/**',
            },
            {
                protocol: 'https',
                hostname: '*.googleapis.com',
                pathname: '/**',
            },
        ],
    },

    webpack: (config) => {
        // Esto le dice a Next.js: "Si ves 'undici' en el frontend, ignóralo"
        config.resolve.alias.undici = false;
        return config;
    },

    async headers() {
        // Content Security Policy (CSP)
        const cspHeader = `
            default-src 'self';
            script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.googleapis.com https://*.gstatic.com https://*.firebaseapp.com https://vitals.vercel-insights.com https://*.vercel-scripts.com https://*.vercel.live;
            style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
            img-src 'self' blob: data: https://*.googleapis.com https://*.gstatic.com https://*.firebaseapp.com https://lh3.googleusercontent.com;
            font-src 'self' data: https://fonts.gstatic.com;
            connect-src 'self' https://*.googleapis.com https://*.gstatic.com https://*.firebaseapp.com https://vitals.vercel-insights.com https://*.vercel.live https://consultorio-delgado.firebaseapp.com;
            frame-src 'self' https://*.firebaseapp.com https://consultorio-delgado.firebaseapp.com https://www.google.com;
            object-src 'none';
            base-uri 'self';
            form-action 'self';
            frame-ancestors 'none';
            block-all-mixed-content;
            upgrade-insecure-requests;
        `;

        return [
            {
                source: '/:path*',
                headers: [
                    // 1. CSP
                    {
                        key: 'Content-Security-Policy',
                        value: cspHeader.replace(/\s{2,}/g, ' ').trim()
                    },
                    // 2. Permissions Policy
                    {
                        key: 'Permissions-Policy',
                        value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=()'
                    },
                    // 3. Strict Transport Security (HSTS)
                    {
                        key: 'Strict-Transport-Security',
                        value: 'max-age=63072000; includeSubDomains; preload'
                    },
                    // 4. Prevention of Clickjacking
                    {
                        key: 'X-Frame-Options',
                        value: 'SAMEORIGIN'
                    },
                    // 5. Prevention of MIME Sniffing
                    {
                        key: 'X-Content-Type-Options',
                        value: 'nosniff'
                    },
                    // 6. Referrer Policy
                    {
                        key: 'Referrer-Policy',
                        value: 'strict-origin-when-cross-origin'
                    },
                    // 7. CORS (Restrict to Production and Localhost is implicit for same-origin)
                    {
                        key: 'Access-Control-Allow-Origin',
                        value: process.env.NODE_ENV === 'production' ? 'https://consultoriodelgado.com' : '*'
                    },
                ]
            }
        ];
    },
};

export default nextConfig;
