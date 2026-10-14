type WheelGuide = {
  question: string; answer: string; steps: string[];
  sections: {title: string; paragraphs: string[]}[];
  questions: {question: string; answer: string}[];
};

/** Original, server-rendered guidance for the actual controls on each wheel. */
export const wheelGuides: Record<string, WheelGuide> = {
  'spin-the-wheel': {
    question: 'What is a spin wheel?',
    answer: 'A spin wheel is a random picker that chooses one item from a list. Add your choices, select Spin the wheel, and read the entry under the fixed pointer. Finflo’s wheel maker gives each nonempty line one equal chance, so you can use it for everyday decisions, game turns, or a custom list of ideas.',
    steps: [
      'Replace the example options with your own choices, one per line. Blank lines are ignored, and the wheel updates as you type.',
      'Review the list before spinning. Use up to 100 entries, with no more than 60 characters in each entry. Keep one copy of each choice if you want equal odds for each distinct choice.',
      'Select Spin the wheel. Editing pauses during the spin so the displayed options and the selected result stay in sync.',
      'Read or copy the result. Select Remove picked entry before another spin if you want to work through the list without repeating that entry.',
    ],
    sections: [
      {title: 'Ideas for a custom decision wheel', paragraphs: [
        'A useful decision wheel starts with a shortlist you are willing to accept. For a weekend plan, add options that fit your time, location, and budget. For household tasks, write separate chores such as watering plants or folding laundry. The Weekend plans and Chores presets are editable starting points, not fixed recommendations.',
        'You can also use the wheel to pick a presentation topic, a game challenge, or the first item on a reading list. Keep entries specific enough to act on. “Read chapter three” is a clearer outcome than “reading.” If two options need different amounts of time, decide whether either is practical before the spin.',
      ]},
      {title: 'Equal entries and repeated choices', paragraphs: [
        'With six entries, each line has a one-in-six chance on a spin. Repeating the same choice on two lines gives that choice two chances. The wheel points out duplicates, but keeps them because sometimes repeated entries are intentional. Shuffle changes the order around the circle; it does not change the odds.',
        'Leaving the list unchanged allows the same result on consecutive spins. For a checklist or turn order, remove each selected entry after it appears. Reset wheel restores the original example list and clears recent spins, so copy any result you want to keep before resetting or leaving the page.',
      ]},
    ],
    questions: [
      {question: 'Can I make my own wheel for free?', answer: 'Yes. Replace the example entries with your choices and spin without an account. The editor supports up to 100 entries, and you can change the list again between spins.'},
      {question: 'Can I change the weight of a choice?', answer: 'There is no separate weight field. Each line is one chance, so a repeated choice appears more than once in the draw. Use a single line per choice when you want equal odds for distinct choices.'},
      {question: 'Does clicking at a different time affect the result?', answer: 'The result is chosen when you start a spin. The animation then lands on that entry. Clicking again during the animation does not start another draw or stop the wheel early.'},
      {question: 'Can I save or share my custom wheel?', answer: 'This version keeps the list only in the current page. Copy result copies the selected text, not a custom wheel link. Copy your entries elsewhere before closing or reloading if you need the list later.'},
    ],
  },
  'wheel-of-names': {
    question: 'What is a wheel of names?',
    answer: 'A wheel of names is a random name picker: each name in your list becomes an entry, and a spin selects one. Use it to choose who goes first, invite a student to respond, or select the next participant in a group activity. Each line receives an equal chance; the tool does not assess eligibility or rank people.',
    steps: [
      'Replace the example names with your participants, one name per line. You can paste a column from a spreadsheet or type the list directly.',
      'Check spelling and distinguish people with the same first name, for example Alex R and Alex S. Remove accidental duplicate lines before the draw.',
      'Select Spin the wheel and read the name in Your result. The full name appears there even if its label is shortened on the wheel.',
      'Use Remove picked entry for a new participant on the next round. Leave the list unchanged if every round should include everyone again.',
    ],
    sections: [
      {title: 'Using a name picker in class or a group', paragraphs: [
        'For classroom participation, enter the students who are taking part in that activity. A teacher can spin once for the next response, or remove each selected entry to work through the class. The Table groups preset is useful when you want to choose a group rather than an individual.',
        'For games or presentations, decide the selection rule first. A single spin can pick the starting player. Repeated spins with removal can create a turn order. The recent-spins list shows the latest ten results, so copy your sequence as you go if your group is larger or you need a permanent record.',
      ]},
      {title: 'Names, duplicates, and selection rules', paragraphs: [
        'The picker treats each line as a separate entry. If Jordan appears twice in a list of ten lines, that label has two chances out of ten. This is different from ten distinct people with equal chances. The editor shows a duplicate notice, but it cannot tell whether repeated names belong to different people.',
        'For a casual prize draw, check the list yourself before spinning and agree whether winners can be selected again. This page provides random selection, not identity checks, an independent audit, or a verified record of a draw. The displayed list and results belong to the current browser page and can be edited between rounds.',
      ]},
    ],
    questions: [
      {question: 'How do I pick a name without repeats?', answer: 'After a result appears, select Remove picked entry, then spin again. That removes one line. If the same name appears on several lines, remove the duplicate lines first to prevent that label from returning.'},
      {question: 'How many names can I put on the wheel?', answer: 'You can add up to 100 names, each up to 60 characters. For more than 40 entries, slice labels are hidden to keep the display readable; the editable list and full result remain available.'},
      {question: 'Can I use this as a random team generator?', answer: 'You can pick participants one at a time and assign each result to a team yourself. This wheel does not automatically balance teams or generate a complete team roster.'},
      {question: 'Are the names uploaded or saved?', answer: 'The wheel does not upload your entries or save them to an account. They stay in the current page and are cleared by a reload or by leaving. Use initials or short labels if you do not need to display full names.'},
    ],
  },
  'yes-or-no-wheel': {
    question: 'How does a yes or no wheel work?',
    answer: 'A yes or no wheel randomly selects between Yes and No. With one entry for each answer, both have a 50% chance on every spin. Choose the Yes / No / Maybe preset for three equally likely answers, or edit the list to match a different low-stakes choice. A spin is a random answer, not a prediction.',
    steps: [
      'Decide what your question means before you spin. A clear question such as “Should we play another round?” works better than a question with several conditions.',
      'Choose Yes / No for two equal options, or Yes / No / Maybe if postponing the decision is an acceptable outcome.',
      'Check that the list contains one copy of each intended answer, then select Spin the wheel.',
      'Read the result and decide how to use it. Keep both answers in the list for another independent yes/no spin; removing one makes the remaining answer certain.',
    ],
    sections: [
      {title: 'Yes/no odds and the maybe option', paragraphs: [
        'The default wheel has two entries, so Yes has a one-in-two chance and No has a one-in-two chance. Adding Maybe creates three entries and changes each answer’s chance to one in three. The maybe option is not a tie or a special exception; it is another ordinary entry.',
        'Short sequences do not have to alternate. Several Yes results in a row can occur without changing the next spin’s odds. If you edit the list to Yes, Yes, No, the combined chance of Yes becomes two out of three. Restore the Yes / No preset whenever you want the original equal split.',
      ]},
      {title: 'Good questions for a random decision spinner', paragraphs: [
        'Use this wheel when either answer is acceptable: choosing a game rule, trying a drawing challenge, or deciding whether to add another round to a quiz. You can change the labels to “Now” and “Later” or “Inside” and “Outside” if that makes the choice easier to understand.',
        'For choices that depend on facts, preferences, or consequences, review those first. A random spinner cannot evaluate whether a purchase is affordable, whether an activity is appropriate, or what another person wants. If you find yourself spinning until you get a preferred answer, that preference may already be your decision.',
      ]},
    ],
    questions: [
      {question: 'Is the yes or no wheel exactly 50/50?', answer: 'The default list contains one Yes and one No, giving each an equal chance on each draw. That does not mean a short run of spins will produce exactly equal totals.'},
      {question: 'Can I add a maybe answer?', answer: 'Yes. Select Yes / No / Maybe above the entries. The list changes to three answers, each with a one-in-three chance. You can also type your own third answer.'},
      {question: 'Do I have to enter my question?', answer: 'No question field is required. Keep your question in mind or say it to your group, then spin. The tool selects an entry without interpreting or storing a question.'},
      {question: 'Why did I get the same answer twice?', answer: 'Each draw uses a new random value, so repeats are possible. With the default two-entry list, the second spin still has a 50% chance of matching the first.'},
    ],
  },
  'number-picker-wheel': {
    question: 'What is a number picker wheel?',
    answer: 'A number picker wheel selects a random number from the entries shown on the wheel. Use a preset such as 1–10 or 1–100, or enter a first and last integer to create your own inclusive range. Each listed number gets one chance unless you deliberately repeat it. Remove a picked number to draw without replacement.',
    steps: [
      'Select 1–10, 1–20, 1–50, or 1–100, or enter a First number and Last number. Both endpoints are included.',
      'Select Apply range after editing the endpoints. The range must contain no more than 100 integers, and both endpoints must be between -1,000,000 and 1,000,000.',
      'Review the generated entries. You can remove particular numbers or replace the list with your own numbers, one per line.',
      'Spin to pick a number. Remove picked entry excludes that line from the next draw; applying the range again restores all numbers in that range.',
    ],
    sections: [
      {title: 'Choosing a range: 1–10, 1–50, and 1–100', paragraphs: [
        'A range from 1 to 10 contains ten numbers, with a 10% chance for each number. A range from 1 to 100 contains one hundred numbers, with a 1% chance for each. The number of entries in an inclusive range is last number minus first number plus one. For example, 25 through 40 contains sixteen entries.',
        'Negative integers and zero work too. A range from -3 to 3 creates seven entries: -3, -2, -1, 0, 1, 2, and 3. The range fields generate consecutive whole numbers. For decimals, unusual sequences, or excluded values, enter the exact labels you want directly in the list instead.',
      ]},
      {title: 'Drawing numbers for games and classroom activities', paragraphs: [
        'Use a number wheel to choose an exercise, a question number, a seat, or a numbered game space. Match the list to the available choices. If a workbook has questions 1 through 30 but the class has already completed question 12, generate the range and delete that line before the spin.',
        'For a sequence without repeated numbers, remove each picked entry after its result appears. The probabilities then change with the remaining list: after one pick from 1–10 is removed, each of the nine remaining numbers has a one-in-nine chance. Shuffling only changes the visual order, not the numbers or their odds.',
      ]},
    ],
    questions: [
      {question: 'Can I spin a number wheel from 1 to 100?', answer: 'Yes. Choose the 1–100 preset. All 100 numbers are included. The small slice labels are hidden on large wheels, but the full entry list and the selected number remain visible.'},
      {question: 'Can I exclude a number from the range?', answer: 'Yes. Apply the range, then delete that number’s line from the entries. If you later select a preset or apply the range again, the generated list replaces your edits.'},
      {question: 'Does the wheel include the first and last numbers?', answer: 'Yes. Both endpoints are included. Setting the first and last numbers to the same integer makes a one-entry wheel, so that number is the only possible result.'},
      {question: 'How is this different from a random number generator?', answer: 'This tool presents a small, editable set as a visual wheel, with a limit of 100 entries. Finflo’s Random Number Generator is a better fit when you need larger ranges, decimal outputs, or multiple values in one calculation.'},
    ],
  },
  'what-to-eat-wheel': {
    question: 'What is a what-to-eat wheel?',
    answer: 'A what-to-eat wheel is a random food picker for choosing a meal, cuisine, or restaurant from a shortlist. Start with dinner ideas, cuisines, or quick lunches, then edit the options to match what you can actually eat or order. A spin picks one entry; it does not check ingredients, restaurant availability, or nutrition.',
    steps: [
      'Choose Dinner ideas, Cuisines, or Quick lunches as a starting point, or replace the list with your own meals and restaurants.',
      'Remove choices that do not fit your ingredients, dietary needs, time, or budget. Keep each line at the same level of detail, such as meals rather than a mixture of meals and individual ingredients.',
      'Select Spin the wheel and read the selected food choice. Check the practical details before ordering or cooking.',
      'To pick several different ideas, remove each result and spin again. Copy your chosen meals elsewhere if you are building a meal plan.',
    ],
    sections: [
      {title: 'Make a food wheel that fits tonight', paragraphs: [
        'A short list often works better than a long list of every food you can name. For a quick dinner, include meals you can prepare with what is already available. If you are ordering with friends, agree on a few restaurants everyone is comfortable choosing before starting the wheel.',
        'The Cuisines preset is useful when you want a general direction, while Dinner ideas gives more specific meal labels. You can replace “Pizza” with the name of your favorite local pizza place, or replace “Curry” with a recipe you already know. The result is only as practical as the options you enter.',
      ]},
      {title: 'Use a dinner spinner for variety', paragraphs: [
        'For variety over several meals, remove the selected entry after each spin. That keeps the same line from winning again until you restore the list. If two entries are variations of the same meal, such as pasta and spaghetti, consider whether they are meaningfully different choices for your plan.',
        'The wheel does not favor healthier, cheaper, or faster meals. Each line gets the same chance. Make those comparisons before adding a choice, and check ingredients separately when allergies or dietary restrictions matter. You can keep a personal shortlist outside this page and paste it back in on your next visit.',
      ]},
    ],
    questions: [
      {question: 'Can the wheel decide what I should eat for dinner?', answer: 'It can randomly choose from your dinner shortlist. It does not know your dietary needs or what is available, so remove unsuitable choices before spinning and use the result as a meal idea.'},
      {question: 'Can I add restaurants or fast-food places?', answer: 'Yes. Replace the entries with the restaurants you are considering, one per line. Check their menus, hours, and delivery options yourself; this wheel does not retrieve local restaurant information.'},
      {question: 'Can I make a vegetarian food wheel?', answer: 'Yes. Replace the sample foods with vegetarian meals you would enjoy. The wheel accepts your labels and does not verify ingredients, so review the actual recipes or menus separately.'},
      {question: 'Can I use it to plan a week of meals?', answer: 'You can select a meal, copy it, remove the picked entry, and repeat. Recent spins shows the latest ten picks during your visit. It is not a saved meal planner or a nutrition-balancing tool.'},
    ],
  },
  'random-color-wheel': {
    question: 'What does a random color wheel do?',
    answer: 'A random color wheel chooses one color from a list for a drawing, craft, or creative prompt. Finflo’s classic preset contains eight named colors, and warm and cool presets offer smaller groups. Supported color names display their actual swatch and hex code in the result. This is a random picker, not a color-harmony or accessibility checker.',
    steps: [
      'Choose Classic colors, Warm colors, or Cool colors, or edit the list with your own color names.',
      'Review the entries. The classic preset contains Red, Orange, Yellow, Green, Blue, Purple, Pink, and Teal, with one equal chance per line.',
      'Spin and read the selected name. A supported color also shows a swatch and its six-digit hex code below the result.',
      'Copy result to copy the name and supported hex code. Remove the picked entry before another spin if you want several different colors.',
    ],
    sections: [
      {title: 'Creative ways to use a color spinner', paragraphs: [
        'A color spinner can give a drawing session a starting constraint: use the selected color as an accent, a background, or the subject of a sketch. For a group craft activity, enter the colors of the materials you actually have so each outcome is usable.',
        'You can also choose a sequence of colors by removing each result before the next spin. That creates variety, but it does not guarantee a coordinated palette. Treat the picks as ingredients for your design and adjust the combination after seeing it. The warm and cool presets help narrow the list without making the decision for you.',
      ]},
      {title: 'Named colors, hex codes, and custom labels', paragraphs: [
        'The supported names are Red, Orange, Yellow, Green, Blue, Purple, Pink, Teal, White, and Black. Each maps to a particular on-screen hex value. “Red,” for example, is a label for the red swatch used here, not a promise to represent every shade someone might call red.',
        'Other text can be entered as a choice, including custom shade names or hex strings, but arbitrary entries are treated as labels. They use the standard wheel styling and do not automatically generate a matching swatch. For interface design, separately check foreground/background contrast before using any chosen color for text or controls.',
      ]},
    ],
    questions: [
      {question: 'Does the wheel choose from every possible color?', answer: 'No. It chooses from the entries in your list. The default contains eight named colors, not every RGB value. Edit the list to change the set of possible results.'},
      {question: 'Can I get the hex code of the picked color?', answer: 'Yes, for the ten supported color names. The result shows the hex code, and Copy result includes it with the name. A custom label without a supported color mapping shows text only.'},
      {question: 'Can I pick multiple different colors?', answer: 'Spin, remove the picked entry, then spin again. Repeat until you have the number of colors you want. This creates a selection without repeated entries but does not test whether the colors work well together.'},
      {question: 'Is this the same as an artist’s color wheel?', answer: 'No. An artist’s color wheel explains relationships between hues. This page is a random selection tool. Its slice order is not a color-theory model, and Shuffle changes that order without changing the available choices.'},
    ],
  },
  'truth-or-dare-wheel': {
    question: 'What is a truth or dare wheel?',
    answer: 'A truth or dare wheel randomly selects a question or a playful challenge for a group game. This version starts with eight lighthearted prompts, including favorite memories, imaginary trips, drawing, and a robot dance. Choose truths only, dares only, or a mixture, and edit the prompts to fit your group before you begin.',
    steps: [
      'Read the preset prompts together. Choose Truths & dares, Truths only, or Dares only, depending on the kind of round you want.',
      'Edit or replace prompts before starting. Agree that a player can skip a prompt or suggest an alternative.',
      'Decide whose turn it is, then spin the wheel to choose that player’s prompt. The wheel selects a prompt, not a participant.',
      'After the turn, remove the picked entry if you want fresh prompts in the remaining rounds. Reset wheel restores the original mixed list.',
    ],
    sections: [
      {title: 'Questions and dares for a relaxed game', paragraphs: [
        'The default questions ask about favorites, memories, and things someone would like to learn. The dares are short activities such as drawing a cat with closed eyes or inventing a superhero name. They are designed as starting points for a lighthearted game rather than a way to pressure someone into sharing personal information.',
        'For children, classmates, or a new group, read and adapt the list together. Keep prompts clear, short, and practical for the space you are in. A seated drawing challenge may suit a small room better than a movement challenge. Players should be able to pass without being given a penalty by the tool.',
      ]},
      {title: 'How to change the balance of a round', paragraphs: [
        'The starting list has four truths and four dares, so each type has half of the total probability. Selecting Truths only or Dares only changes the list to four prompts of that type. If you add extra dares, the combined chance of getting a dare increases because each line is one chance.',
        'You can also enter only “Truth” and “Dare” as two labels, then supply your own prompt after the result. If you want the wheel to provide an actual question or challenge, keep the full prompt on each line. Long slice labels are shortened visually, but the result displays the complete entry.',
      ]},
    ],
    questions: [
      {question: 'Does this wheel include truth-or-dare questions?', answer: 'Yes. The default list contains four questions and four playful dares. You can edit all of them, select a single-type preset, or replace the list with prompts your group has agreed on.'},
      {question: 'Can I use it for kids or teens?', answer: 'The starter prompts are lighthearted, but the group or supervising adult should review them for the participants and setting. The wheel cannot assess individual comfort, abilities, or whether a user-added prompt is appropriate.'},
      {question: 'How do I avoid repeating a prompt?', answer: 'Select Remove picked entry after a turn. The next spin then uses the remaining prompts. If a prompt appears on several lines, remove the duplicates first if you want it used only once.'},
      {question: 'Can the wheel choose the player too?', answer: 'This page chooses one prompt. Use the Wheel of Names separately to choose a participant, or agree on a turn order before playing. It does not pair players and prompts automatically.'},
    ],
  },
  'activity-wheel': {
    question: 'What is an activity wheel?',
    answer: 'An activity wheel is a random things-to-do picker. Add activities you would enjoy and spin when you need an idea for a break, a quiet afternoon, or time with friends. Finflo offers indoor, outdoor, and creative presets, and every entry can be edited. The wheel picks an idea; you decide whether it fits your situation.',
    steps: [
      'Choose Indoor ideas, Outdoor ideas, or Creative breaks, or start with the mixed activity list.',
      'Remove activities that do not fit the time, supplies, weather, or participants. Add specific ideas you would be happy to try.',
      'Select Spin the wheel to choose an activity. The full activity appears below the wheel after the spin.',
      'Use the result as your next step, or remove it and pick another activity for a later slot. Copy useful ideas before leaving because the list is not saved.',
    ],
    sections: [
      {title: 'Build a useful list of things to do', paragraphs: [
        'When you have only ten minutes, list activities that can actually fit into that break: sketch one object, read a few pages, or make a short playlist. For an afternoon, you might include cooking a recipe, visiting a park, or playing a board game. Mixing very different time commitments can make the result less useful.',
        'For a family or classroom activity, agree on options before spinning. The wheel can pick a shared activity or select the next station in a rotation. Add the materials or duration to the label when useful, such as “Draw with pencils for ten minutes,” while keeping each entry within the length limit.',
      ]},
      {title: 'Indoor, outdoor, and creative presets', paragraphs: [
        'Indoor ideas focus on activities such as reading, puzzles, music, and games. Outdoor ideas include a walk, a picnic, and nature photography. Creative breaks include sketching, origami, writing, and hand lettering. These presets are shortlists to adapt, not live recommendations based on your location or circumstances.',
        'To work through a set over time, remove each picked entry after you use it. The remaining list then offers a different activity on the next spin. Recent spins can help you remember the last ten choices during the visit, but it is not a schedule or a saved activity tracker.',
      ]},
    ],
    questions: [
      {question: 'Can this wheel help when I am bored?', answer: 'It can provide a random starting idea from a list you choose. Review the options first so the result is something you can do now, rather than an activity that needs unavailable time or supplies.'},
      {question: 'Can I make an activity wheel for kids?', answer: 'Yes. Replace the options with activities suited to the children, available materials, and supervision. Review each entry together before spinning; the wheel does not check age suitability or practical conditions.'},
      {question: 'Can I turn it into a workout or chore wheel?', answer: 'Yes. Enter your own activities, one per line. For workouts, choose activities already appropriate for you; the wheel does not create a balanced training plan or assess fitness. The custom wheel also has a chores preset.'},
      {question: 'Will it remember activities from yesterday?', answer: 'No. Entries and recent spins remain only in the current page. Reloading or leaving starts over. Keep a separate copy of your list if you want to reuse it on another visit.'},
    ],
  },
};
