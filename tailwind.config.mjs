/** @type {import('tailwindcss').Config} */
export default {
	content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
	theme: {
		extend: {
			colors: {
				casino: {
					black: "#0a0a0f",
					charcoal: "#1a1a2e",
					navy: "#16213e",
					emerald: "#0d4d2b",
					emeraldLight: "#1a7a42",
					emeraldDark: "#0a3d22",
					gold: "#d4af37",
					goldLight: "#ffd700",
					goldDark: "#b8960c",
					cream: "#f5f5dc",
					burgundy: "#722f37",
					cardRed: "#a8242f",
				},
			},
			fontFamily: {
				display: ["Playfair Display", "serif"],
				sans: ["Inter", "system-ui", "sans-serif"],
			},
			boxShadow: {
				emerald: "0 0 20px rgba(13, 77, 43, 0.4)",
				"emerald-glow": "0 0 40px rgba(13, 77, 43, 0.6)",
				card: "0 4px 20px rgba(0, 0, 0, 0.4)",
				"card-hover": "0 8px 30px rgba(0, 0, 0, 0.5)",
			},
			animation: {
				shimmer: "shimmer 2s linear infinite",
				"pulse-emerald": "pulseEmerald 2s ease-in-out infinite",
			},
			keyframes: {
				shimmer: {
					"0%": { backgroundPosition: "-200% 0" },
					"100%": { backgroundPosition: "200% 0" },
				},
				pulseEmerald: {
					"0%, 100%": { boxShadow: "0 0 20px rgba(13, 77, 43, 0.4)" },
					"50%": { boxShadow: "0 0 40px rgba(13, 77, 43, 0.7)" },
				},
			},
		},
	},
	plugins: [require("daisyui")],
	daisyui: {
		themes: [
			{
				casinoRoyale: {
					primary: "#0d4d2b",
					secondary: "#1a1a2e",
					accent: "#1a7a42",
					neutral: "#0a0a0f",
					"base-100": "#16213e",
					"base-200": "#1a1a2e",
					"base-300": "#0a0a0f",
					info: "#1a7a42",
					success: "#0d4d2b",
					warning: "#d4af37",
					error: "#a8242f",
					"--rounded-box": "0.75rem",
					"--rounded-btn": "0.5rem",
				},
			},
		],
	},
};
