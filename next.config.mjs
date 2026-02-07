/** @type {import('next').NextConfig} */
const nextConfig = {
    // Configuración compatible con Next.js 14
    experimental: {
        serverComponentsExternalPackages: ["undici", "firebase-admin"],
    },

    webpack: (config) => {
        // Esto le dice a Next.js: "Si ves 'undici' en el frontend, ignóralo"
        config.resolve.alias.undici = false;
        return config;
    },

    async headers() {
        return [
            {
                source: '/:path*',
                headers: [
                    {
                        key: 'X-DNS-Prefetch-Control',
                        value: 'on'
                    },
                    {
                        key: 'Strict-Transport-Security',
                        value: 'max-age=63072000; includeSubDomains; preload'
                    },
                    {
                        key: 'X-Frame-Options',
                        value: 'SAMEORIGIN'
                    },
                    {
                        key: 'X-Content-Type-Options',
                        value: 'nosniff'
                    },
                    {
                        key: 'Referrer-Policy',
                        value: 'strict-origin-when-cross-origin'
                    }
                ]
            }
        ];
    },
};

export default nextConfig;
