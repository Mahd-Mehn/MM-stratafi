/** @type {import('next').NextConfig} */
const nextConfig = {
	reactStrictMode: true,
	experimental: {
		transpilePackages: ['@stratafi/ui','@stratafi/sdk']
	}
};
module.exports = nextConfig;
