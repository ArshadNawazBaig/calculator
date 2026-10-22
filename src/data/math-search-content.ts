type SearchFormulaRow = {
  id: string;
  label: string;
  formula: string;
  example: string;
  result: string;
};

type SearchContentSection = {
  id: string;
  heading: string;
  paragraphs: string[];
  link?: {before: string; href: string; label: string; after: string};
};

export type MathSearchContentEntry = {
  modifiedAt: string;
  answerHeading: string;
  answer: string;
  tableHeading: string;
  tableIntroduction: string;
  tableCaption: string;
  firstColumn: string;
  rows: SearchFormulaRow[];
  sections: SearchContentSection[];
};

/** English editorial copy for the existing pages; examples are checked against the calculator engine. */
export const mathSearchContent: Record<string, MathSearchContentEntry | undefined> = {
  'area-calculator': {
    modifiedAt: '2026-10-22',
    answerHeading: 'How do I calculate area?',
    answer: 'To calculate area, choose a shape and enter its dimensions. A rectangle uses length × width, a triangle uses base × perpendicular height ÷ 2, and a circle uses π × radius². Select the unit beside each measurement to get the answer in square feet, square meters, or another square unit.',
    tableHeading: 'Area formulas and examples by shape',
    tableIntroduction: 'Choose the mode that matches the measurements you know. For a square, use Rectangle with equal length and width. In the formulas below, h is perpendicular height, r is radius, and θ is the sector angle in degrees.',
    tableCaption: 'Area examples use meters and return square meters (m²). Answers involving π are rounded to two decimal places.',
    firstColumn: 'Shape or mode',
    rows: [
      {id: 'rectangle', label: 'Rectangle or square', formula: 'A = l × w; square: A = s²', example: 'Length 6 m; width 4 m', result: '24 m²'},
      {id: 'triangle', label: 'Triangle: base and height', formula: 'A = b × h ÷ 2', example: 'Base 8 m; height 3 m', result: '12 m²'},
      {id: 'triangle-sss', label: 'Triangle: three sides', formula: 's = (a + b + c) ÷ 2; A = √[s(s − a)(s − b)(s − c)]', example: 'Sides 5 m, 12 m, 13 m; s = 15 m', result: '30 m²'},
      {id: 'circle', label: 'Circle', formula: 'A = πr²', example: 'Radius 3 m', result: '28.27 m²'},
      {id: 'sector', label: 'Circular sector', formula: 'A = πr² × θ ÷ 360', example: 'Radius 4 m; angle 90°', result: '12.57 m²'},
      {id: 'ellipse', label: 'Ellipse', formula: 'A = πab', example: 'Semi-axes 4 m and 2 m', result: '25.13 m²'},
      {id: 'trapezoid', label: 'Trapezoid', formula: 'A = (a + b) × h ÷ 2', example: 'Parallel bases 4 m and 8 m; height 3 m', result: '18 m²'},
      {id: 'parallelogram', label: 'Parallelogram', formula: 'A = b × h', example: 'Base 7 m; height 3 m', result: '21 m²'},
    ],
    sections: [
      {
        id: 'area-measurements',
        heading: 'Which measurements do I need?',
        paragraphs: [
          'Measure height at a right angle to the base. A sloping edge is not the height of a triangle, trapezoid, or parallelogram. For a circle, divide the diameter by 2 to get the radius. Ellipse inputs are semi-axes: an ellipse 8 m across and 4 m high needs inputs of 4 m and 2 m.',
          'If a triangle has no known height, choose Triangle from three sides. The three side lengths must form a valid triangle: the sum of the two shorter sides must exceed the longest side.',
        ],
        link: {before: 'If you know triangle angles as well as sides, use the ', href: '/triangle-calculator', label: 'triangle calculator', after: ' to solve the missing measurements.'},
      },
      {
        id: 'irregular-area',
        heading: 'How do I find the area of an irregular shape?',
        paragraphs: [
          'Split a composite shape into rectangles, triangles, or circular pieces that do not overlap, calculate each area, then add them. Alternatively, calculate an enclosing shape and subtract the cutouts. An L-shaped floor formed from a 6 m × 4 m rectangle with a 2 m × 1 m corner removed has area 24 − 2 = 22 m².',
          'Run the calculator once for each piece and combine the results in the same square unit. Four outside side lengths alone do not determine the area of an arbitrary quadrilateral; you also need information such as a diagonal, an angle, or coordinates.',
        ],
        link: {before: 'For flooring measurements and material estimates, see the ', href: '/square-footage-calculator', label: 'square footage calculator', after: '.'},
      },
      {
        id: 'area-unit-conversion',
        heading: 'Square feet, square meters, and mixed units',
        paragraphs: [
          'You can choose a different unit for each dimension. For example, a rectangle 3 ft long and 24 in wide has area 6 ft² when the result unit is Feet. The calculator converts lengths before multiplying them.',
          'Area conversions square the length conversion factor: 1 ft² = 144 in² = 0.09290304 m², and 1 m² = 10,000 cm². Area measures a surface; perimeter measures the distance around its boundary.',
        ],
        link: {before: 'To include depth and calculate the space inside a solid, use the ', href: '/volume-calculator', label: 'volume calculator', after: '.'},
      },
    ],
  },
  'ratio-calculator': {
    modifiedAt: '2026-10-22',
    answerHeading: 'How do I simplify or solve a ratio?',
    answer: 'To simplify a ratio, divide both whole-number terms by their greatest common factor: 18:24 becomes 3:4 after dividing by 6. To find a missing value in A:B = C:D, use AD = BC. This calculator can simplify two-term ratios, solve any one missing proportion term, or scale both terms together.',
    tableHeading: 'Ratio formulas and worked examples',
    tableIntroduction: 'Keep the quantities in the same order on both sides of A:B = C:D. Select Solve any proportion term for an unknown A, B, C, or D; select Scale a ratio to enlarge or shrink both quantities.',
    tableCaption: 'Proportion formulas assume nonzero denominators. A divisor of zero can make an equation invalid or prevent a unique solution.',
    firstColumn: 'Task',
    rows: [
      {id: 'simplify', label: 'Simplify a ratio', formula: '(a ÷ g):(b ÷ g), where g = GCF(a, b)', example: '18:24; divide both terms by 6', result: '3:4'},
      {id: 'solve-a', label: 'Find A', formula: 'A = B × C ÷ D', example: 'A:4 = 9:12', result: 'A = 3'},
      {id: 'solve-b', label: 'Find B', formula: 'B = A × D ÷ C', example: '3:B = 9:12', result: 'B = 4'},
      {id: 'solve-c', label: 'Find C', formula: 'C = A × D ÷ B', example: '3:4 = C:12', result: 'C = 9'},
      {id: 'solve-d', label: 'Find D', formula: 'D = B × C ÷ A', example: '3:4 = 9:D', result: 'D = 12'},
      {id: 'scale-enlarge', label: 'Enlarge a ratio', formula: '(a × k):(b × k)', example: '3:4 enlarged by a factor of 5', result: '15:20'},
      {id: 'scale-shrink', label: 'Shrink a ratio', formula: '(a ÷ k):(b ÷ k)', example: '15:20 shrunk by a factor of 5', result: '3:4'},
    ],
    sections: [
      {
        id: 'simplify-decimal-ratio',
        heading: 'How do I simplify a ratio with decimals or fractions?',
        paragraphs: [
          'Simplify ratio accepts whole numbers. For decimal quantities, first multiply both terms by the same power of 10 to remove the decimal places. For example, 1.5:2.25 becomes 150:225; dividing both terms by 75 gives 2:3.',
          'For fractions, multiply both terms by a common denominator. The ratio 1/2:3/4 becomes 2:3 when both terms are multiplied by 4. Convert these to whole-number terms before entering them in Simplify ratio.',
        ],
        link: {before: 'Use the ', href: '/fraction-calculator', label: 'fraction calculator', after: ' to simplify or compare fractional inputs first.'},
      },
      {
        id: 'ratio-percentages',
        heading: 'Does a 3:4 ratio mean 75%?',
        paragraphs: [
          'It depends on the comparison. In a 3:4 ratio, the first quantity is 3 ÷ 4 = 75% of the second quantity. But the first quantity is 3 ÷ (3 + 4) ≈ 42.86% of the combined total, and the second is about 57.14%.',
          'A part-to-part ratio compares the two quantities with each other. A part-to-whole fraction compares one quantity with their sum. Label the quantities before converting a ratio to a percentage.',
        ],
        link: {before: 'For a known part and whole, use the ', href: '/percent-calculator', label: 'percentage calculator', after: ' to calculate the share of the total.'},
      },
      {
        id: 'equivalent-ratios',
        heading: 'How can I tell whether two ratios are equivalent?',
        paragraphs: [
          'Cross-multiply: 3:4 and 9:12 are equivalent because 3 × 12 = 4 × 9 = 36. Reversing only one ratio changes the comparison; 3:4 and 12:9 are not equivalent.',
          'Use matching units when comparing the same kind of measurement. For example, 1 m:50 cm becomes 100 cm:50 cm = 2:1. A ratio of 0:0 has no defined relationship and cannot be simplified.',
        ],
        link: {before: 'To find the divisor for a whole-number ratio by itself, use the ', href: '/gcf-calculator', label: 'greatest common factor calculator', after: '.'},
      },
    ],
  },
  'volume-calculator': {
    modifiedAt: '2026-10-22',
    answerHeading: 'How do I calculate volume?',
    answer: 'To calculate volume, choose a three-dimensional shape and enter its dimensions. A rectangular prism uses length × width × height, a cylinder uses π × radius² × height, and a sphere uses 4π × radius³ ÷ 3. Select the input and output length units to get cubic feet, cubic meters, or another cubic unit.',
    tableHeading: 'Volume formulas and examples by solid',
    tableIntroduction: 'Here r is radius, h is perpendicular height, and R is the larger radius where two radii are needed. For an ellipsoid, a, b, and c are semi-axes. Divide a diameter or full axis length by 2 before using a radius or semi-axis field.',
    tableCaption: 'Volume examples use meters and return cubic meters (m³). Answers involving π are rounded to two decimal places.',
    firstColumn: 'Solid',
    rows: [
      {id: 'cuboid', label: 'Rectangular prism', formula: 'V = l × w × h', example: 'Length 6 m; width 4 m; height 2 m', result: '48 m³'},
      {id: 'cube', label: 'Cube', formula: 'V = a³', example: 'Edge 3 m', result: '27 m³'},
      {id: 'cylinder', label: 'Cylinder', formula: 'V = πr²h', example: 'Radius 2 m; height 5 m', result: '62.83 m³'},
      {id: 'sphere', label: 'Sphere', formula: 'V = 4πr³ ÷ 3', example: 'Radius 3 m', result: '113.1 m³'},
      {id: 'cone', label: 'Cone', formula: 'V = πr²h ÷ 3', example: 'Radius 3 m; height 4 m', result: '37.7 m³'},
      {id: 'pyramid', label: 'Rectangular pyramid', formula: 'V = l × w × h ÷ 3', example: 'Base 6 m × 4 m; height 3 m', result: '24 m³'},
      {id: 'ellipsoid', label: 'Ellipsoid', formula: 'V = 4πabc ÷ 3', example: 'Semi-axes 3 m, 2 m, 1 m', result: '25.13 m³'},
      {id: 'capsule', label: 'Capsule', formula: 'V = πr²h + 4πr³ ÷ 3', example: 'Radius 2 m; straight cylinder length 6 m', result: '108.91 m³'},
      {id: 'cap', label: 'Spherical cap', formula: 'V = πh²(3R − h) ÷ 3', example: 'Sphere radius 5 m; cap height 2 m', result: '54.45 m³'},
      {id: 'frustum', label: 'Conical frustum', formula: 'V = πh(R² + Rr + r²) ÷ 3', example: 'Radii 4 m and 2 m; height 3 m', result: '87.96 m³'},
      {id: 'tube', label: 'Hollow cylinder: material', formula: 'V = π(R² − r²)h', example: 'Outer radius 3 m; inner radius 2 m; height 5 m', result: '78.54 m³'},
    ],
    sections: [
      {
        id: 'volume-capacity',
        heading: 'How do I calculate the capacity of a tank or container?',
        paragraphs: [
          'For a full rectangular container, use its inside length, width, and height in Rectangular prism mode. For a full cylindrical container, use its inside radius and height in Cylinder mode. Outside measurements include the walls and can overstate the space available for liquid.',
          'A tank with inside dimensions 100 cm × 50 cm × 40 cm holds 200,000 cm³ = 0.2 m³ = 200 liters. This is its geometric full capacity; usable capacity may be lower if space is left at the top. A partially filled horizontal cylinder needs a liquid-segment calculation, not the full-cylinder formula.',
        ],
      },
      {
        id: 'volume-unit-conversion',
        heading: 'How do cubic units convert to liters?',
        paragraphs: [
          'One cubic meter equals 1,000 liters. One cubic centimeter equals 1 milliliter. To convert a result in m³ to liters, multiply by 1,000; to convert cm³ to liters, divide by 1,000.',
          'Volume conversions cube the length factor: 1 ft³ = 1,728 in³ = 0.028316846592 m³. Select each dimension’s actual unit before calculating. For example, a box 2 ft × 12 in × 6 in has volume 1 ft³ when the result unit is Feet.',
        ],
        link: {before: 'If your measurements describe a flat region with no depth, use the ', href: '/area-calculator', label: 'area calculator', after: ' to get square units.'},
      },
      {
        id: 'composite-volume',
        heading: 'How do I find the volume of a composite or hollow shape?',
        paragraphs: [
          'Calculate each non-overlapping solid separately, then add their volumes in the same unit. Subtract empty regions when measuring material. A 4 m × 3 m × 2 m block with a 1 m × 1 m opening through its 2 m height contains 24 − 2 = 22 m³ of material.',
          'The Hollow cylinder mode calculates the surrounding material. To calculate the capacity of its central opening, use Cylinder mode with the inner radius instead. Arbitrary irregular objects need additional geometry or a measurement method such as fluid displacement.',
        ],
        link: {before: 'To measure the outside covering of a solid rather than its capacity, use the ', href: '/surface-area-calculator', label: 'surface area calculator', after: '.'},
      },
    ],
  },
};
