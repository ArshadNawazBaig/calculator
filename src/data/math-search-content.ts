type SearchFormulaRow = {
  id: string;
  modeId?: string;
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
  quickLinks?: {href: string; label: string}[];
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
    modifiedAt: '2026-11-15',
    quickLinks: [{href: '#irregular-area', label: 'Irregular shapes'}, {href: '#land-area', label: 'Acres and hectares'}],
    answerHeading: 'How do I calculate area?',
    answer: 'Area measures the space inside a flat shape. A rectangle uses length × width, a triangle uses base × perpendicular height ÷ 2, and a circle uses π × radius². Choose your shape, enter each dimension with its unit, select an area unit, then press Calculate. Results can use square feet, square meters, acres, or hectares.',
    tableHeading: 'Area formulas and examples by shape',
    tableIntroduction: 'Choose the shape that matches the measurements you know. There are eight shapes and a second triangle method for three known sides. In these formulas, h is perpendicular height, r is radius, and θ is the sector angle in degrees. For an ellipse, a and b are half the full axis lengths.',
    tableCaption: 'Area examples use meters and return square meters (m²). Answers involving π are rounded to two decimal places.',
    firstColumn: 'Shape or mode',
    rows: [
      {id: 'rectangle', label: 'Rectangle', formula: 'A = l × w', example: 'Length 6 m; width 4 m', result: '24 m²'},
      {id: 'square', label: 'Square', formula: 'A = s²', example: 'Side 4 m', result: '16 m²'},
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
          'Measure height at a right angle to the base, even when the perpendicular line falls outside the shape. A sloping side is not the height of a triangle, trapezoid, or parallelogram. For a circle, halve the diameter to get the radius. For an ellipse 8 m across and 4 m high, enter semi-axes of 4 m and 2 m.',
          'When only three triangle side lengths are known, choose Triangle from three sides. The two shorter sides must add up to more than the longest side: 3, 4, and 5 form a triangle, but 3, 4, and 7 do not. A sector needs a central angle; select degrees or radians to match your measurement.',
        ],
        link: {before: 'If you know triangle angles as well as sides, use the ', href: '/triangle-calculator', label: 'triangle calculator', after: ' to solve the missing measurements.'},
      },
      {
        id: 'irregular-area',
        heading: 'Area of an irregular shape or L-shaped room',
        paragraphs: [
          'Draw the outline and split it into rectangles, triangles, or circular pieces without overlap. Calculate each piece using the same area unit, then add the results. For a cutout, subtract its area instead.',
          'For example, an L-shaped floor fits inside a 6 m × 4 m rectangle and has a 2 m × 1 m corner missing. The outer rectangle is 24 m² and the missing corner is 2 m², so the floor covers 24 − 2 = 22 m². Calculate the two rectangles separately; do not multiply the two longest sides and ignore the cutout.',
          'This calculator uses dimensions you enter, rather than tracing a boundary on a map. For a four-sided plot without right angles or parallel bases, four side lengths alone are insufficient: you also need information such as a diagonal and triangle side lengths, an angle, or coordinates.',
        ],
        link: {before: 'For flooring measurements and material estimates, see the ', href: '/square-footage-calculator', label: 'square footage calculator', after: '.'},
      },
      {
        id: 'area-unit-conversion',
        heading: 'Square feet, square meters, and mixed units',
        paragraphs: [
          'Each dimension has its own unit selector. A rectangle 3 ft long and 24 in wide covers 6 ft² when Area unit is Square feet: 24 in equals 2 ft, then 3 × 2 = 6. For a measurement such as 5 ft 6 in, enter 5.5 Feet or 66 Inches, not 5.6 Feet.',
          'Square the length conversion factor when converting area: 1 ft² = 144 in² = 0.09290304 m², and 1 m² = 10,000 cm². To convert square feet to square meters, multiply by 0.09290304; to convert square meters to square feet, divide by 0.09290304.',
        ],
        link: {before: 'To include depth and calculate the space inside a solid, use the ', href: '/volume-calculator', label: 'volume calculator', after: '.'},
      },
      {
        id: 'land-area',
        heading: 'Land area in acres and hectares',
        paragraphs: [
          'For a rectangular plot, enter the length and width, then choose Acres or Hectares as the area unit. A 150 ft × 200 ft plot has an area of 30,000 ft². Dividing by 43,560 gives approximately 0.688705 acres. A 120 m × 80 m field covers 9,600 m², or 0.96 hectares.',
          'One acre equals 43,560 ft² or 4,046.8564224 m² using the international foot; one hectare equals 10,000 m². Acres and hectares are already area units, so they are not squared again.',
          'Use horizontal dimensions for a plan-view land area. Distances measured along a slope describe a different surface. Irregular boundaries need additional measurements or a survey; an idealized rectangle cannot establish a property boundary.',
        ],
        link: {before: 'For converting an area you already know, use the ', href: '/conversion-calculator', label: 'unit conversion calculator', after: '.'},
      },
      {
        id: 'area-checks',
        heading: 'Check the result before using it',
        paragraphs: [
          'A circle with radius 3 m has area 9π ≈ 28.27 m². Entering its 6 m diameter as the radius would give four times the correct area. Similarly, an ellipse needs semi-axes, not its full width and height.',
          'Area and perimeter answer different questions. A 6 m × 4 m rectangle covers 24 m² but needs 20 m of edging around its boundary. Flooring uses area; fencing uses perimeter. Covering the outside of a three-dimensional object requires surface area.',
          'Keep unrounded values while combining pieces, then round the final total to suit your measurements. Extra decimal places do not make a tape measurement more accurate. A flooring or paint allowance is a separate decision from the geometric area.',
        ],
        link: {before: 'For the outside of a box, cylinder, sphere, or other solid, use the ', href: '/surface-area-calculator', label: 'surface area calculator', after: '.'},
      },
    ],
  },
  'ratio-calculator': {
    "modifiedAt": "2026-11-15",
    "answerHeading": "How do I simplify or solve a ratio?",
    "answer": "To simplify a ratio, divide its whole-number terms by their greatest common factor: 18:24 becomes 3:4 after dividing by 6. Enter decimals or fractions directly; the calculator clears denominators first and shows the exact steps. To find a missing value in A:B = C:D, use AD = BC. You can also scale both terms together.",
    "tableHeading": "Ratio formulas and worked examples",
    "tableIntroduction": "Simplify ratio accepts whole numbers, decimals, or integer fractions directly. Keep the quantities in the same order on both sides of A:B = C:D. Select Solve any proportion term for an unknown A, B, C, or D; select Scale a ratio to enlarge or shrink both quantities. After opening the proportion solver, choose the missing term; after opening the scaling calculator, choose enlarge or shrink.",
    "tableCaption": "Proportion formulas assume nonzero denominators. A divisor of zero can make an equation invalid or prevent a unique solution.",
    "firstColumn": "Task",
    "rows": [
      {
        "id": "simplify",
        "label": "Simplify a ratio",
        "formula": "(a ÷ g):(b ÷ g), where g = GCF(a, b)",
        "example": "18:24; divide both terms by 6",
        "result": "3:4",
        "modeId": "simplify"
      },
      {
        "id": "solve-a",
        "label": "Find A",
        "formula": "A = B × C ÷ D",
        "example": "A:4 = 9:12",
        "result": "A = 3",
        "modeId": "all-proportions"
      },
      {
        "id": "solve-b",
        "label": "Find B",
        "formula": "B = A × D ÷ C",
        "example": "3:B = 9:12",
        "result": "B = 4",
        "modeId": "all-proportions"
      },
      {
        "id": "solve-c",
        "label": "Find C",
        "formula": "C = A × D ÷ B",
        "example": "3:4 = C:12",
        "result": "C = 9",
        "modeId": "all-proportions"
      },
      {
        "id": "solve-d",
        "label": "Find D",
        "formula": "D = B × C ÷ A",
        "example": "3:4 = 9:D",
        "result": "D = 12",
        "modeId": "all-proportions"
      },
      {
        "id": "scale-enlarge",
        "label": "Enlarge a ratio",
        "formula": "(a × k):(b × k)",
        "example": "3:4 enlarged by a factor of 5",
        "result": "15:20",
        "modeId": "scale"
      },
      {
        "id": "scale-shrink",
        "label": "Shrink a ratio",
        "formula": "(a ÷ k):(b ÷ k)",
        "example": "15:20 shrunk by a factor of 5",
        "result": "3:4",
        "modeId": "scale"
      }
    ],
    "sections": [
      {
        "id": "simplify-decimal-ratio",
        "heading": "How do I simplify a ratio with decimals or fractions?",
        "paragraphs": [
          "Enter each decimal or fraction directly in Simplify ratio. For 1.5:2.25, the exact fractions are 3/2:9/4. Multiplying both terms by 4 gives 6:9; dividing by their greatest common factor, 3, gives 2:3.",
          "For 1/2:3/4, multiplying both terms by the common denominator 4 gives 2:3 immediately. The calculator keeps decimal digits and integer fractions exact instead of rounding them before simplification. Fraction inputs use integer numerators and nonzero integer denominators; mixed numbers should first be written as improper fractions."
        ],
        "link": {
          "before": "Use the ",
          "href": "/fraction-calculator",
          "label": "fraction calculator",
          "after": " to convert mixed numbers or perform fraction arithmetic."
        }
      },
      {
        "id": "ratio-percentages",
        "heading": "Does a 3:4 ratio mean 75%?",
        "paragraphs": [
          "It depends on the comparison. In a 3:4 ratio, the first quantity is 3 ÷ 4 = 75% of the second quantity. But the first quantity is 3 ÷ (3 + 4) ≈ 42.86% of the combined total, and the second is about 57.14%.",
          "A part-to-part ratio compares the two quantities with each other. A part-to-whole fraction compares one quantity with their sum. Label the quantities before converting a ratio to a percentage."
        ],
        "link": {
          "before": "For a known part and whole, use the ",
          "href": "/percent-calculator",
          "label": "percentage calculator",
          "after": " to calculate the share of the total."
        }
      },
      {
        "id": "equivalent-ratios",
        "heading": "How can I tell whether two ratios are equivalent?",
        "paragraphs": [
          "Cross-multiply: 3:4 and 9:12 are equivalent because 3 × 12 = 4 × 9 = 36. Reversing only one ratio changes the comparison; 3:4 and 12:9 are not equivalent.",
          "Use matching units when comparing the same kind of measurement. For example, 1 m:50 cm becomes 100 cm:50 cm = 2:1. A ratio of 0:0 has no defined relationship and cannot be simplified."
        ],
        "link": {
          "before": "To find the divisor for a whole-number ratio by itself, use the ",
          "href": "/gcf-calculator",
          "label": "greatest common factor calculator",
          "after": "."
        }
      }
    ]
  },

  'volume-calculator': {
    modifiedAt: '2026-11-15',
    quickLinks: [{href: '#volume-capacity', label: 'Tank capacity'}, {href: '#volume-unit-conversion', label: 'Cubic units and liters'}],
    answerHeading: 'How do I calculate volume?',
    answer: 'Volume measures the space inside a three-dimensional shape. A rectangular prism uses length × width × height, a cylinder uses π × radius² × height, and a sphere uses 4π × radius³ ÷ 3. Choose a solid, enter each dimension with its unit, select a volume unit, then press Calculate for cubic feet, cubic meters, or another cubic unit.',
    tableHeading: 'Volume formulas and examples by solid',
    tableIntroduction: 'Choose from eleven solids and an alternate spherical-cap method. Here r and r₂ are radii, and h is perpendicular height or the capsule’s straight length. For an ellipsoid, a, b, and c are semi-axes. Divide a diameter or full axis length by two before entering a radius or semi-axis.',
    tableCaption: 'Volume examples use meters and return cubic meters (m³). Answers involving π are rounded to two decimal places.',
    firstColumn: 'Solid',
    rows: [
      {id: 'cuboid', label: 'Rectangular prism', formula: 'V = a × b × h', example: 'Length 6 m; width 4 m; height 2 m', result: '48 m³'},
      {id: 'cube', label: 'Cube', formula: 'V = a³', example: 'Edge 3 m', result: '27 m³'},
      {id: 'cylinder', label: 'Cylinder', formula: 'V = πr²h', example: 'Radius 2 m; height 5 m', result: '62.83 m³'},
      {id: 'sphere', label: 'Sphere', formula: 'V = 4πr³ ÷ 3', example: 'Radius 3 m', result: '113.1 m³'},
      {id: 'cone', label: 'Cone', formula: 'V = πr²h ÷ 3', example: 'Radius 3 m; height 4 m', result: '37.7 m³'},
      {id: 'pyramid', label: 'Rectangular pyramid', formula: 'V = a × b × h ÷ 3', example: 'Base 6 m × 4 m; height 3 m', result: '24 m³'},
      {id: 'ellipsoid', label: 'Ellipsoid', formula: 'V = 4πabc ÷ 3', example: 'Semi-axes 3 m, 2 m, 1 m', result: '25.13 m³'},
      {id: 'capsule', label: 'Capsule', formula: 'V = πr²h + 4πr³ ÷ 3', example: 'Radius 2 m; straight cylinder length 6 m', result: '108.91 m³'},
      {id: 'cap', label: 'Spherical cap', formula: 'V = πh²(3r − h) ÷ 3', example: 'Sphere radius 5 m; cap height 2 m', result: '54.45 m³'},
      {id: 'cap-inverse', label: 'Cap: alternate dimensions', formula: 'V = πh(3a² + h²) ÷ 6, where a is base radius', example: 'Base radius 4 m; cap height 2 m', result: '54.45 m³'},
      {id: 'frustum', label: 'Conical frustum', formula: 'V = πh(r² + rr₂ + r₂²) ÷ 3', example: 'Radii 4 m and 2 m; height 3 m', result: '87.96 m³'},
      {id: 'tube', label: 'Hollow cylinder: material', formula: 'V = π(r² − r₂²)h', example: 'Outer radius 3 m; inner radius 2 m; height 5 m', result: '78.54 m³'},
    ],
    sections: [
      {
        id: 'volume-measurements',
        heading: 'Measure the radius, perpendicular height, and straight length',
        paragraphs: [
          'Use the center-to-edge radius of a sphere, cylinder, cone, or capsule. Entering diameter instead of radius makes a sphere’s volume eight times too large and a cylinder’s volume four times too large. Cone and pyramid height is perpendicular to the base, not measured along the sloping side.',
          'A capsule combines a cylinder with two hemispherical ends. Enter only the straight cylinder length as h; overall length is h + 2r. For an ellipsoid, enter half of each full axis length. A solid measuring 6 m × 4 m × 2 m across its three axes has semi-axes 3 m, 2 m, and 1 m.',
        ],
      },
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
          'Volume conversions cube the length factor: 1 ft³ = 1,728 in³ = 0.028316846592 m³. Select each dimension’s actual unit before calculating. For example, a box 2 ft × 12 in × 6 in has volume 1 ft³ when Volume unit is Cubic feet. Enter 5 ft 6 in as 5.5 Feet or 66 Inches, not 5.6 Feet.',
        ],
        link: {before: 'To convert a known volume to liters, milliliters, or US or imperial gallons, use the ', href: '/conversion-calculator', label: 'unit conversion calculator', after: '.'},
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
      {
        id: 'spherical-cap-volume',
        heading: 'Why can a spherical cap have two answers?',
        paragraphs: [
          'With the sphere radius r and cap height h, the cap is defined: h must be greater than zero and no greater than 2r. With a base radius a and cap height h, the alternate mode first finds r = (a² + h²) ÷ (2h). For a = 4 m and h = 2 m, r = 5 m and volume is about 54.45 m³.',
          'With only sphere radius r and base radius a, there can be two cap heights: r − √(r² − a²) and r + √(r² − a²). A sphere of radius 5 m cut along a base circle of radius 4 m gives heights 2 m and 8 m. The alternate mode shows both caps, so choose the one matching the piece you measured.',
        ],
      },
      {
        id: 'volume-checks',
        heading: 'Volume, material allowance, and measurement precision',
        paragraphs: [
          'Area uses square units; volume uses cubic units. A slab 6 m long, 4 m wide, and 0.1 m thick covers 24 m² and contains 2.4 m³. Thickness must be included when estimating material, even when it is much smaller than the other dimensions.',
          'The result models the dimensions entered. Keep unrounded values when combining pieces, then round to match measurement precision. Material allowances, compaction, and purchase quantities are separate from geometric volume.',
        ],
        link: {before: 'For slabs and round columns with an extra-material allowance, use the ', href: '/concrete-calculator', label: 'concrete calculator', after: '.'},
      },
    ],
  },
  'surface-area-calculator': {
    modifiedAt: '2026-11-15',
    quickLinks: [{href: '#open-and-closed-surfaces', label: 'Open and closed surfaces'}, {href: '#surface-area-units', label: 'Square units'}],
    answerHeading: 'How do I calculate surface area?',
    answer: 'Surface area is the sum of the faces or curved surfaces of a three-dimensional object. A closed rectangular prism uses 2(ab + ah + bh), a closed cylinder uses 2πr(r + h), and a sphere uses 4πr². Choose a solid, enter each dimension with its unit, and select a surface area unit for a result in square feet, square meters, or another square unit.',
    tableHeading: 'Surface area formulas and examples by solid',
    tableIntroduction: 'These formulas give total surface area, including the bases or ends described below. Here r and r₂ are radii, h is perpendicular height or the capsule’s straight length, and a, b, and c are ellipsoid semi-axes. Ellipsoid surface area uses an approximation; the other listed formulas are exact for their ideal shapes.',
    tableCaption: 'Examples use meters and return square meters (m²). Decimal results are rounded to two places; the ellipsoid result is approximate.',
    firstColumn: 'Solid and included surfaces',
    rows: [
      {id: 'cuboid', label: 'Rectangular prism: six faces', formula: 'A = 2(ab + ah + bh)', example: 'Length 6 m; width 4 m; height 2 m', result: '88 m²'},
      {id: 'cube', label: 'Cube: six faces', formula: 'A = 6a²', example: 'Edge 3 m', result: '54 m²'},
      {id: 'cylinder', label: 'Cylinder: side and both ends', formula: 'A = 2πr(r + h)', example: 'Radius 2 m; height 5 m', result: '87.96 m²'},
      {id: 'sphere', label: 'Sphere', formula: 'A = 4πr²', example: 'Radius 3 m', result: '113.1 m²'},
      {id: 'cone', label: 'Cone: side and base', formula: 'A = πr(r + √(r² + h²))', example: 'Radius 3 m; perpendicular height 4 m', result: '75.4 m²'},
      {id: 'pyramid', label: 'Rectangular pyramid: sides and base', formula: 'A = ab + a√((b/2)² + h²) + b√((a/2)² + h²)', example: 'Base 6 m × 4 m; perpendicular height 3 m', result: '62.6 m²'},
      {id: 'ellipsoid', label: 'Ellipsoid: approximate', formula: 'A ≈ 4π[((ab)ᵖ + (ac)ᵖ + (bc)ᵖ) ÷ 3]^(1/p), p = 1.6075', example: 'Semi-axes 3 m, 2 m, 1 m', result: '48.97 m²'},
      {id: 'capsule', label: 'Capsule: cylinder and rounded ends', formula: 'A = 2πrh + 4πr²', example: 'Radius 2 m; straight cylinder length 6 m', result: '125.66 m²'},
      {id: 'cap', label: 'Spherical cap: curved face and base', formula: 'A = 2πrh + π(2rh − h²)', example: 'Sphere radius 5 m; cap height 2 m', result: '113.1 m²'},
      {id: 'cap-inverse', label: 'Cap: alternate dimensions', formula: 'r = (a² + h²) ÷ (2h); A = 2πrh + πa², where a is base radius', example: 'Base radius 4 m; cap height 2 m', result: '113.1 m²'},
      {id: 'frustum', label: 'Conical frustum: side and both bases', formula: 'A = π(r + r₂)√((r − r₂)² + h²) + π(r² + r₂²)', example: 'Radii 4 m and 2 m; height 3 m', result: '130.79 m²'},
      {id: 'tube', label: 'Hollow cylinder: inner, outer, and end rings', formula: 'A = 2π(r + r₂)h + 2π(r² − r₂²)', example: 'Outer radius 3 m; inner radius 2 m; height 5 m', result: '188.5 m²'},
    ],
    sections: [
      {
        id: 'surface-area-measurements',
        heading: 'Which measurements define each solid?',
        paragraphs: [
          'Use radius from center to edge, not diameter across the whole circle. Cone, frustum, and pyramid height is perpendicular to the base. The calculator derives slant height for the surface formula. The pyramid is a right rectangular pyramid, with its apex above the center of the base.',
          'For a capsule, h is only the straight cylindrical section between the rounded ends. Its full length is h + 2r. For an ellipsoid, enter three semi-axes, each half of a full axis. A hollow cylinder needs an outer radius strictly larger than its inner radius.',
        ],
      },
      {
        id: 'open-and-closed-surfaces',
        heading: 'Total, lateral, and open-container surface area',
        paragraphs: [
          'Total area includes every face in the selected model. Lateral area includes the sides but excludes the bases. A closed cylinder includes the curved side and two circular ends. For an open-top cylinder, subtract πr² from its total; for the curved side alone, subtract 2πr².',
          'For a cylinder with radius 2 m and height 5 m, total area is 28π ≈ 87.96 m². With the top removed, it is 24π ≈ 75.40 m². The curved side alone is 20π ≈ 62.83 m². These are three different surfaces of the same dimensions.',
          'The cone and rectangular pyramid include their bases. The hollow cylinder includes its inner curved wall, outer curved wall, and two flat annular ends. It does not mean only the outside wall: for that, use 2πrh with the outer radius.',
        ],
      },
      {
        id: 'surface-area-units',
        heading: 'Square feet, square meters, and mixed dimensions',
        paragraphs: [
          'Select the actual unit for each measurement. A rectangular prism with length 2 ft, width 12 in, and height 6 in becomes 2 ft × 1 ft × 0.5 ft. Its surface area is 2(2 + 1 + 0.5) = 7 ft² when Surface area unit is Square feet.',
          'Area conversion squares the length factor: 1 ft² = 144 in² = 0.09290304 m², and 1 m² = 10,000 cm². Surface area always uses square units, even though the object itself is three-dimensional. Volume uses cubic units.',
        ],
        link: {before: 'To calculate how much space a solid contains, use the ', href: '/volume-calculator', label: 'volume calculator', after: '.'},
      },
      {
        id: 'cap-and-ellipsoid-surfaces',
        heading: 'Spherical caps and the ellipsoid approximation',
        paragraphs: [
          'A spherical cap’s total area combines the curved portion, 2πrh, and its flat circular base, π(2rh − h²). For sphere radius 5 m and cap height 2 m, these are 20π and 16π m², giving 36π ≈ 113.10 m² in total. The alternate-dimensions mode shows curved and total areas separately.',
          'Base radius and cap height determine one cap. Sphere radius and base radius can describe a smaller and a larger cap, so the alternate mode can show two solutions. Use the measurements and the indicated cap heights to identify your surface.',
          'The ellipsoid calculation uses A ≈ 4π[((ab)ᵖ + (ac)ᵖ + (bc)ᵖ) ÷ 3]^(1/p), with p = 1.6075. This is the Knud Thomsen approximation, not an exact general ellipsoid surface formula. When all three semi-axes equal r, it reduces to the sphere formula 4πr².',
        ],
      },
      {
        id: 'composite-surface-area',
        heading: 'Joined solids and material estimates',
        paragraphs: [
          'Adding the total areas of two touching solids counts their hidden contact surfaces twice. Subtract both copies of each shared face when finding the exposed area of the joined object. Two 1 m cubes joined along one face have exposed area 6 + 6 − 2 = 10 m², rather than 12 m².',
          'For painting, wrapping, or cladding, count only the surfaces you plan to cover. Coats, overlaps, openings, and material waste require separate adjustments. Keep unrounded numbers while combining areas, then round the final result to the precision of your measurements.',
        ],
        link: {before: 'For an individual flat face, use the ', href: '/area-calculator', label: 'area calculator', after: '.'},
      },
    ],
  },
};
