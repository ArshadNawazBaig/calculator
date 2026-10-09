import {Plus_Jakarta_Sans} from "next/font/google";

// Self-host the requested Google Fonts family, including weights 300–800.
export const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-jakarta",
  weight: "variable",
});
