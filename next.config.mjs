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
};

export default nextConfig;
