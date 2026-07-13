import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Shared cross-tool convention (see AGTT_Refresh.gs band colors + BWG slate/emerald/amber/red)
        band: {
          high: "#ef4444",
          medium: "#f59e0b",
          low: "#3b82f6",
        },
      },
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "Helvetica", "Arial", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;

