/** Original editorial artwork for homepage sections above the guides. */
export const homeSectionImages = {
  "planning": {
    "src": "/home-images/sections/planning.webp",
    "alt": "A model house, savings jar, and walking shoes beside a planner.",
    "width": 1536,
    "height": 1024
  },
  "finance": {
    "src": "/home-images/sections/finance.webp",
    "alt": "Coins, savings jars, and envelopes for organizing a budget.",
    "width": 1536,
    "height": 1024
  },
  "health": {
    "src": "/home-images/sections/health.webp",
    "alt": "A rolled exercise mat, dumbbells, and a water bottle.",
    "width": 1536,
    "height": 1024
  },
  "everyday": {
    "src": "/home-images/sections/everyday.webp",
    "alt": "A calculator, ruler, measuring tape, and wooden shapes.",
    "width": 1536,
    "height": 1024
  },
  "spin-wheels": {
    "src": "/home-images/sections/spin-wheels.webp",
    "alt": "A tabletop prize wheel with green and cream segments and a pointer.",
    "width": 1536,
    "height": 1024
  },
  "time": {
    "src": "/home-images/sections/time.webp",
    "alt": "An analog clock and hourglass for planning time.",
    "width": 1536,
    "height": 1024
  },
  "how-it-works": {
    "src": "/home-images/sections/how-it-works.webp",
    "alt": "A magnifying glass, calculator, and open notebook.",
    "width": 1536,
    "height": 1024
  },
  "confidence": {
    "src": "/home-images/sections/confidence.webp",
    "alt": "An open reference book with a ruler and wooden geometry shapes.",
    "width": 1536,
    "height": 1024
  },
  "workspace": {
    "src": "/home-images/sections/workspace.webp",
    "alt": "Green folders and a notebook beside a desk organizer.",
    "width": 1536,
    "height": 1024
  }
} as const;

export type HomeSectionImageId = keyof typeof homeSectionImages;

