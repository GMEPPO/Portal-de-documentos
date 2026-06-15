const NEW_APP_URL = "https://gestao-documental-two.vercel.app/dashboard";

/** @type {import('next').NextConfig} */
const nextConfig = {
  // typedRoutes desactivado: rompe el build con `href` dinámicos (`/documents/${id}`).
  async redirects() {
    return [
      {
        source: "/:path*",
        destination: NEW_APP_URL,
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
