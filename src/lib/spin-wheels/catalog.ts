export type WheelPreset = {label: string; entries: string[]};
export type WheelDefinition = {
  slug: string;
  title: string;
  seoTitle: string;
  description: string;
  summary: string;
  entryLabel: string;
  entries: string[];
  presets: WheelPreset[];
  searchTerms: string[];
};

const numbers = (count: number) => Array.from({length: count}, (_, index) => String(index + 1));
const truths = ['Truth: What is your favorite memory?', 'Truth: What skill would you like to learn?', 'Truth: What always makes you laugh?', 'Truth: What is your dream trip?'];
const dares = ['Dare: Do your best robot dance', 'Dare: Draw a cat with your eyes closed', 'Dare: Say a tongue twister three times', 'Dare: Invent a superhero name'];

export const wheelCategory = {
  id: 'spin-wheels', name: 'Spin wheels', label: 'Spin wheels', icon: 'spin-wheels', href: '/spin-wheels',
  description: 'Pick a name, settle a choice, or find your next idea with a spin.',
  links: [{name: 'Wheel of Names', slug: 'wheel-of-names'}, {name: 'Yes or No Wheel', slug: 'yes-or-no-wheel'}],
} as const;

export const spinWheels: WheelDefinition[] = [
  {
    slug: 'spin-the-wheel', title: 'Spin the Wheel', seoTitle: 'Spin the Wheel – Free Random Picker & Wheel Maker | Finflo',
    description: 'Make a custom spin wheel with your own choices. Edit entries, spin a random result, remove winners, and review recent picks. Free, with no sign-up.',
    summary: 'Turn your own list into a random decision wheel.', entryLabel: 'Your choices',
    entries: ['Option A', 'Option B', 'Option C', 'Option D', 'Option E', 'Option F'],
    presets: [{label: 'Weekend plans', entries: ['Go for a walk', 'Visit a museum', 'Read a book', 'Cook something new', 'Have a picnic', 'Play a board game']}, {label: 'Chores', entries: ['Wash dishes', 'Take out recycling', 'Water plants', 'Tidy the desk', 'Fold laundry', 'Sweep the floor']}],
    searchTerms: ['spin wheel', 'picker wheel', 'random picker', 'decision wheel', 'wheel maker', 'wheel spinner', 'custom wheel', 'wheel decide'],
  },
  {
    slug: 'wheel-of-names', title: 'Wheel of Names', seoTitle: 'Wheel of Names – Free Random Name Picker | Finflo',
    description: 'Paste names and spin a random name picker for class, games, or turn-taking. Remove each selected name to pick without repeats. No account needed.',
    summary: 'Choose a name for class, games, or the next turn.', entryLabel: 'Names',
    entries: ['Alex', 'Sam', 'Jordan', 'Taylor', 'Morgan', 'Casey', 'Jamie', 'Riley'],
    presets: [{label: 'Example names', entries: ['Alex', 'Sam', 'Jordan', 'Taylor', 'Morgan', 'Casey', 'Jamie', 'Riley']}, {label: 'Table groups', entries: ['Table 1', 'Table 2', 'Table 3', 'Table 4', 'Table 5', 'Table 6']}],
    searchTerms: ['random name picker', 'name wheel', 'name spinner', 'student picker', 'random winner', 'classroom', 'raffle', 'wheel of names generator'],
  },
  {
    slug: 'yes-or-no-wheel', title: 'Yes or No Wheel', seoTitle: 'Yes or No Wheel – Free Random Decision Spinner | Finflo',
    description: 'Spin a yes or no wheel for a quick random answer. Use equal yes/no odds, add a maybe option, or customize the choices for your own decision.',
    summary: 'Get a yes or no answer, or add a maybe option.', entryLabel: 'Answers',
    entries: ['Yes', 'No'],
    presets: [{label: 'Yes / No', entries: ['Yes', 'No']}, {label: 'Yes / No / Maybe', entries: ['Yes', 'No', 'Maybe']}],
    searchTerms: ['yes no wheel', 'yes or no spinner', 'yes no maybe', 'decision maker', 'yes or no wheel decide', 'random answer'],
  },
  {
    slug: 'number-picker-wheel', title: 'Number Picker Wheel', seoTitle: 'Number Picker Wheel – Random Numbers 1–100 | Finflo',
    description: 'Spin a random number wheel from 1–10, 1–20, 1–50, or 1–100. Set your own integer range, remove picked numbers, and track recent results.',
    summary: 'Pick a random number from a range you choose.', entryLabel: 'Numbers',
    entries: numbers(10),
    presets: [10, 20, 50, 100].map(count => ({label: `1–${count}`, entries: numbers(count)})),
    searchTerms: ['random number wheel', 'number spinner', 'random number generator wheel', '1-100', '1-50', '1-20', '1-10', 'number picker'],
  },
  {
    slug: 'what-to-eat-wheel', title: 'What to Eat Wheel', seoTitle: 'What to Eat Wheel – Random Food & Dinner Picker | Finflo',
    description: 'Not sure what to eat? Spin a food wheel for dinner ideas, cuisines, or your own restaurant shortlist. Edit the options and pick a meal at random.',
    summary: 'Choose dinner, a cuisine, or a place to eat.', entryLabel: 'Food choices',
    entries: ['Pizza', 'Pasta', 'Tacos', 'Sushi', 'Curry', 'Stir-fry', 'Soup', 'Salad'],
    presets: [{label: 'Dinner ideas', entries: ['Pizza', 'Pasta', 'Tacos', 'Sushi', 'Curry', 'Stir-fry', 'Soup', 'Salad']}, {label: 'Cuisines', entries: ['Italian', 'Mexican', 'Japanese', 'Indian', 'Thai', 'Mediterranean']}, {label: 'Quick lunches', entries: ['Sandwich', 'Rice bowl', 'Wrap', 'Omelet', 'Leftovers', 'Baked potato']}],
    searchTerms: ['food wheel', 'dinner spinner', 'random food picker', 'what should i eat', 'dinner ideas', 'restaurant picker', 'food decision wheel'],
  },
  {
    slug: 'random-color-wheel', title: 'Random Color Wheel', seoTitle: 'Random Color Wheel – Spin a Color Picker | Finflo',
    description: 'Spin a random color wheel for drawing, crafts, and creative prompts. Pick from color presets or your own list, with hex codes for supported colors.',
    summary: 'Find a color for your next creative prompt.', entryLabel: 'Colors',
    entries: ['Red', 'Orange', 'Yellow', 'Green', 'Blue', 'Purple', 'Pink', 'Teal'],
    presets: [{label: 'Classic colors', entries: ['Red', 'Orange', 'Yellow', 'Green', 'Blue', 'Purple', 'Pink', 'Teal']}, {label: 'Warm colors', entries: ['Red', 'Orange', 'Yellow', 'Pink']}, {label: 'Cool colors', entries: ['Green', 'Blue', 'Purple', 'Teal']}],
    searchTerms: ['color picker wheel', 'random colour wheel', 'color spinner', 'random color generator', 'colour picker', 'art prompt'],
  },
  {
    slug: 'truth-or-dare-wheel', title: 'Truth or Dare Wheel', seoTitle: 'Truth or Dare Wheel – Fun Questions & Dares | Finflo',
    description: 'Spin a truth or dare wheel with lighthearted questions and playful dares. Choose a preset, edit prompts for your group, and remove used results.',
    summary: 'Pick a playful question or dare for your group.', entryLabel: 'Truths and dares',
    entries: [...truths, ...dares],
    presets: [{label: 'Truths & dares', entries: [...truths, ...dares]}, {label: 'Truths only', entries: truths}, {label: 'Dares only', entries: dares}],
    searchTerms: ['truth or dare spinner', 'truth or dare questions', 'truth or dare for kids', 'truth or dare for teens', 'party game', 'icebreaker'],
  },
  {
    slug: 'activity-wheel', title: 'Activity Wheel', seoTitle: 'Activity Wheel – Random Activity & Things to Do Picker | Finflo',
    description: 'Spin an activity wheel when you need something to do. Choose a creative break, an indoor activity, or an outdoor idea, and edit the list to suit you.',
    summary: 'Find something to do, indoors or outdoors.', entryLabel: 'Activities',
    entries: ['Read a chapter', 'Take a walk', 'Draw something', 'Try a new recipe', 'Play a board game', 'Listen to music', 'Do a puzzle', 'Call a friend'],
    presets: [{label: 'Indoor ideas', entries: ['Read a chapter', 'Draw something', 'Try a new recipe', 'Play a board game', 'Listen to music', 'Do a puzzle']}, {label: 'Outdoor ideas', entries: ['Take a walk', 'Visit a park', 'Go for a bike ride', 'Have a picnic', 'Take nature photos', 'Water the garden']}, {label: 'Creative breaks', entries: ['Sketch an object', 'Write a short story', 'Fold origami', 'Make a playlist', 'Try hand lettering', 'Take five photos']}],
    searchTerms: ['activity wheel spinner', 'random activity generator', 'what to do wheel', 'things to do', 'activity wheel for kids', 'boredom buster'],
  },
];

export const wheelMap = new Map(spinWheels.map(wheel => [wheel.slug, wheel]));
export const wheelHref = (slug: string) => `/spin-wheels/${slug}`;
export const colorSwatches: Record<string, string> = {red: '#ef4444', orange: '#f59e0b', yellow: '#facc15', green: '#22c55e', blue: '#3b82f6', purple: '#a855f7', pink: '#f472b6', teal: '#14b8a6', white: '#ffffff', black: '#17191c'};
export function colorForEntry(label: string): string | undefined {
  const key = label.toLowerCase();
  return Object.hasOwn(colorSwatches, key) ? colorSwatches[key] : undefined;
}
