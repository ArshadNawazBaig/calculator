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
  figure?: {id: string; caption: string};
  steps?: string[];
  link?: {sentence: string; href: string; label: string};
};

export type MathSearchContentEntry = {
  publishedAt?: string;
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
    publishedAt: '2026-11-15',
    modifiedAt: '2026-11-28',
    quickLinks: [{href: '#irregular-area', label: 'Irregular shapes'}, {href: '#land-area', label: 'Acres and hectares'}],
    answerHeading: 'How to use the area calculator',
    answer: 'Area measures the space inside a flat shape. A rectangle uses length × width, a triangle uses base × perpendicular height ÷ 2, and a circle uses π × radius². Choose your shape, enter each dimension with its unit, select an area unit, then press Calculate. Results can use square feet, square meters, acres, or hectares.',
    tableHeading: 'Area formulas and examples by shape',
    tableIntroduction: 'The area calculator covers eight shapes. For triangles, you can use the base and perpendicular height or all three side lengths. In these formulas, h is perpendicular height, r is radius, and θ is the sector angle in degrees. For an ellipse, a and b are half the full axis lengths.',
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
        link: {sentence: "If you know triangle angles as well as sides, use the {calculatorLink} to solve the missing measurements.", href: "/triangle-calculator", label: "triangle calculator"},
      },
      {
        id: 'irregular-area',
        heading: 'Area of an irregular shape or L-shaped room',
        paragraphs: [
          'Draw the outline and split it into rectangles, triangles, or circular pieces without overlap. Enter each piece in the area calculator using the same area unit, then add the results. For a cutout, subtract its area instead.',
          'For example, an L-shaped floor fits inside a 6 m × 4 m rectangle and has a 2 m × 1 m corner missing. The outer rectangle is 24 m² and the missing corner is 2 m², so the floor covers 24 − 2 = 22 m². Calculate the two rectangles separately; do not multiply the two longest sides and ignore the cutout.',
          'For an arched window, split the glass where the straight sides meet the curve. If the lower rectangle is 2 m wide and 1.5 m high, it covers 3 m². A semicircle spanning that width has a radius of 1 m. Enter that radius and an angle of 180° in Sector mode, then add its area to the rectangle for about 4.57 m² of glass.',
          'This calculator uses dimensions you enter, rather than tracing a boundary on a map. For a four-sided plot without right angles or parallel bases, four side lengths alone are insufficient: you also need information such as a diagonal and triangle side lengths, an angle, or coordinates.',
        ],
        link: {sentence: "For flooring measurements and material estimates, see the {calculatorLink}.", href: "/square-footage-calculator", label: "square footage calculator"},
      },
      {
        id: 'wall-area',
        heading: 'How much wall area is left after doors and windows?',
        paragraphs: [
          'Measure each wall from one inside corner to the next and from the floor to the ceiling. If the room has an alcove, follow the tape around the recess and include each short wall. When all the walls have the same height, add their widths and enter the total as the length in Rectangle mode. Use the common height as the other dimension. This gives the combined wall area before you subtract any openings.',
          'Take a room 5 m long and 4 m wide with walls 2.5 m high. Walking around the room gives 18 m of wall, so the four faces cover 45 m². A door measuring 0.9 m by 2 m takes up 1.8 m². A window measuring 1.5 m by 1.2 m takes up another 1.8 m². Subtract both openings to get 41.4 m² of wall. Measure to the outside edges of any trim you want to exclude. To leave out the baseboard as well, subtract its height times the length it actually runs.',
          'For a wall with a straight sloping top, measure the height at both ends. In the area calculator, choose Trapezoid and enter those heights as the parallel bases. The horizontal width of the wall is the distance between them. A wall 6 m wide with end heights of 2 m and 3 m covers 15 m². For a peaked gable, split the face into a rectangle below the eaves and a triangle above them. Measure the triangle vertically from the eaves to the peak.',
        ],
      },
      {
        id: 'polygon-area',
        heading: 'How do I find the area of a regular polygon, kite or rhombus?',
        paragraphs: [
          'Draw lines from the center of a regular polygon to its corners. The triangles have the same height, called the apothem, and their bases add up to the perimeter. The area is half the perimeter times the apothem. A regular hexagon with 4 m sides splits into 6 equilateral triangles. Enter 4 m for each side in Triangle from three sides, which uses Heron’s formula. Multiply the result by 6 to get about 41.57 m² for the hexagon.',
          'For a kite or rhombus, measure both full diagonals from corner to corner. They cross at right angles, so the area is half their product. Diagonals of 8 m and 5 m give 20 m². For a trapezoid, use the two parallel sides and the perpendicular distance between them.',
        ],
      },
      {
        id: 'path-area',
        heading: 'How much area does a border or path cover?',
        paragraphs: [
          'A path around a pond has two edges. Sketch the outside edge first, then shade the strip you want to cover. Run the area calculator once for the whole footprint inside the outer edge and once for the pond. Subtract the pond from the larger area. Keep both answers in the same square unit so the difference gives the amount of paving.',
          'For a round pond with a radius of 3 m and a path 1 m wide, the outside radius is 4 m. In Circle mode the outer disk covers 16π m² and the pond covers 9π m². The path covers 7π m², about 21.99 m². Measure both radii from the center. Using the path width as the radius would give the area of a small disk.',
          'For a rectangular bed, the border adds width on both sides and length at both ends. An 8 m by 5 m bed with a half-meter border outside it has an outer rectangle of 9 m by 6 m. The paved area is 54 − 40 = 14 m². If the same border sits inside the original outline, the planted rectangle is 7 m by 4 m, so the paving covers 40 − 28 = 12 m². Mark which edge your tape followed before entering the dimensions.',
        ],
      },
      {
        id: 'curved-bed-area',
        heading: 'How can I estimate the area of a curved garden bed?',
        paragraphs: [
          'For a bed with a straight back edge and a curved front, lay a tape along the straight edge. Mark several positions along the tape, including both ends of the bed. At each mark, measure the width of the bed at a right angle to the tape. Write down the widths in order. On a sketch, join the ends of neighboring width measurements with straight lines to see the strips you will measure.',
          'For example, mark a 6 m edge every 2 m. Suppose the widths at those four marks are 1 m, 3 m, 2 m and zero, where the bed ends in a point. In the area calculator, choose Trapezoid for the first strip. Enter 1 m and 3 m as the parallel bases and 2 m as the height. This strip covers about 4 m². The next strip covers 5 m². The pointed end forms a triangle with a base of 2 m and a height of 2 m, adding 2 m². Together the strips give an estimate of 11 m².',
          'Look at the sketch where the boundary curves most sharply. If the edge bows outward between two marks, the straight line cuts off some of the bed. Where the edge curves inward, the strip includes ground outside the bed. Take another width measurement at the bend and replace that strip with two narrower ones. If the marks are unevenly spaced, enter the actual distance between each pair as the height for that strip.',
        ],
      },
      {
        id: 'scale-drawing-area',
        heading: 'How do I find the floor area from a scale drawing?',
        paragraphs: [
          'Start with the scale printed on the plan. At a scale of 1:50, each centimeter on paper represents 50 cm in the room. A rectangle that measures 6 cm by 4 cm on the plan represents a floor 3 m long and 2 m wide. Choose Rectangle, enter those full-size dimensions in meters, and the result is 6 m².',
          'You can also start from an area marked on the plan. The paper rectangle covers 24 cm². Each side of a square on the drawing grows by a factor of 50 in the room, so each square grows by 50 × 50. The floor covers 60,000 cm². Divide by 10,000 to check the same answer in square meters. Multiplying the paper area by the length factor just once misses the change along the other side.',
          'If you resized a printout or zoomed a screenshot, use the scale bar on that copy. Measure the bar and the room in the same units. A wall that looks twice as long as a bar marked 2 m represents 4 m. A written dimension also provides a check. For flooring, trace the inside faces of the walls so the thickness of the walls stays outside the measured space.',
        ],
      },
      {
        id: 'area-unit-conversion',
        heading: 'Square feet, square meters, and mixed units',
        paragraphs: [
          'The area calculator lets you choose a unit for each length. A rectangle 3 ft long and 24 in wide covers 6 ft² when Area unit is Square feet: 24 in equals 2 ft, then 3 × 2 = 6. For a measurement such as 5 ft 6 in, enter 5.5 Feet or 66 Inches, not 5.6 Feet.',
          'Square the length conversion factor when converting area: 1 ft² = 144 in² = 0.09290304 m², and 1 m² = 10,000 cm². To convert square feet to square meters, multiply by 0.09290304; to convert square meters to square feet, divide by 0.09290304.',
        ],
        link: {sentence: "To include depth and calculate the space inside a solid, use the {calculatorLink}.", href: "/volume-calculator", label: "volume calculator"},
      },
      {
        id: 'land-area',
        heading: 'Land area in acres and hectares',
        paragraphs: [
          'For a rectangular plot, enter its length and width in the area calculator and select Acres or Hectares as the result unit. A 150 ft × 200 ft plot has an area of 30,000 ft². Dividing by 43,560 gives approximately 0.688705 acres. A 120 m × 80 m field covers 9,600 m², or 0.96 hectares.',
          'One acre equals 43,560 ft² or 4,046.8564224 m² using the international foot; one hectare equals 10,000 m². Acres and hectares are already area units, so they are not squared again.',
          'Use horizontal dimensions for a plan-view land area. Distances measured along a slope describe a different surface. Irregular boundaries need additional measurements or a survey; an idealized rectangle cannot establish a property boundary.',
        ],
        link: {sentence: "For converting an area you already know, use the {calculatorLink}.", href: "/conversion-calculator", label: "unit conversion calculator"},
      },
      {
        id: 'diagonal-area',
        heading: 'Measuring a four-sided plot with a diagonal',
        paragraphs: [
          'A diagonal lets you measure a plot whose corners are hard to reach with a square. Sketch the boundary, mark the corners in order, and draw a straight line between two opposite corners. Choose a diagonal that lies inside the plot. It divides the sketch into two triangles. Record the two edge lengths on each side of that line and measure the line itself.',
          'Suppose the first pair of boundary edges measures 3 m and 4 m, the next pair measures 12 m and 13 m, and the shared diagonal measures 5 m. Choose Triangle from three sides. Enter 3, 4 and 5 with meters selected. The first piece covers 6 m². For the other piece enter 5, 12 and 13 to get 30 m². Add the two areas for a total of 36 m².',
          'Keep a mark on the sketch beside each piece as you add it. Both calculations use the diagonal, but the two pieces meet only along that line. If you change which pair of edges goes with the diagonal, you are measuring a different layout. For a boundary with more corners you can use the same approach, as long as your triangles fill the outline without overlapping.',
        ],
      },
      {
        id: 'area-checks',
        heading: 'Check the result before using it',
        paragraphs: [
          'A circle with radius 3 m has area 9π ≈ 28.27 m². Entering its 6 m diameter as the radius would give four times the correct area. Similarly, an ellipse needs semi-axes, not its full width and height.',
          'Area and perimeter answer different questions. A 6 m × 4 m rectangle covers 24 m² but needs 20 m of edging around its boundary. Flooring uses area; fencing uses perimeter. Covering the outside of a three-dimensional object requires surface area.',
          'Keep unrounded values while combining pieces, then round the final total to suit your measurements. Extra decimal places do not make a tape measurement more accurate. A flooring or paint allowance is a separate decision from the geometric area.',
          'You can see how much a rough measurement matters by trying its two limits. Suppose a room is 4 m wide and one end of the long wall is hidden by a cabinet. If the wall could be anywhere from 5 m to 5.1 m long, the floor could cover 20 m² to 20.4 m². The extra strip is the full room width times the uncertain length. A second measurement of that wall tells you more than another decimal place in the result.',
        ],
        link: {sentence: "For the outside of a box, cylinder, sphere, or other solid, use the {calculatorLink}.", href: "/surface-area-calculator", label: "surface area calculator"},
      },
      {
        id: 'missing-dimension',
        heading: 'How can I find a missing length from a known area?',
        paragraphs: [
          'Suppose you have 24 m² of ground cover and space for a bed 3 m wide. Divide the available area by the width to find a length of 8 m. To check the layout, enter the length and width in Rectangle mode. For a triangular bed with a 3 m base and the same area, multiply the area by two before dividing by the base. Its perpendicular height would be 16 m.',
          'A square has equal sides, so take the square root of its area to get a side length. A square rug covering 36 ft² measures 6 ft along each side. For a round rug of the same area, first divide by π, then take the square root to get its radius in feet. Double the radius to get the full width you would measure across the rug. To check your answer, select Circle in the area calculator and enter the radius.',
          'When working backward, match the units before dividing. If the area is in square meters and the known side is in centimeters, convert that side to meters first. The missing side then comes out in meters. If all you know about a rectangle is its area, there are many possible layouts. Sketch the space and measure one edge to narrow it down, or specify that the shape is a square.',
        ],
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
        "link": {sentence: "Use the {calculatorLink} to convert mixed numbers or perform fraction arithmetic.", href: "/fraction-calculator", label: "fraction calculator"}
      },
      {
        "id": "ratio-percentages",
        "heading": "Does a 3:4 ratio mean 75%?",
        "paragraphs": [
          "It depends on the comparison. In a 3:4 ratio, the first quantity is 3 ÷ 4 = 75% of the second quantity. But the first quantity is 3 ÷ (3 + 4) ≈ 42.86% of the combined total, and the second is about 57.14%.",
          "A part-to-part ratio compares the two quantities with each other. A part-to-whole fraction compares one quantity with their sum. Label the quantities before converting a ratio to a percentage."
        ],
        "link": {sentence: "For a known part and whole, use the {calculatorLink} to calculate the share of the total.", href: "/percent-calculator", label: "percentage calculator"}
      },
      {
        "id": "equivalent-ratios",
        "heading": "How can I tell whether two ratios are equivalent?",
        "paragraphs": [
          "Cross-multiply: 3:4 and 9:12 are equivalent because 3 × 12 = 4 × 9 = 36. Reversing only one ratio changes the comparison; 3:4 and 12:9 are not equivalent.",
          "Use matching units when comparing the same kind of measurement. For example, 1 m:50 cm becomes 100 cm:50 cm = 2:1. A ratio of 0:0 has no defined relationship and cannot be simplified."
        ],
        "link": {sentence: "To find the divisor for a whole-number ratio by itself, use the {calculatorLink}.", href: "/gcf-calculator", label: "greatest common factor calculator"}
      }
    ]
  },

  'volume-calculator': {
    modifiedAt: '2026-11-25',
    quickLinks: [
      {href: '#volume-capacity', label: 'Tank capacity'},
      {href: '#tapered-planter', label: 'Tapered planter'},
      {href: '#composite-volume', label: 'Pipe wall and bore'},
      {href: '#volume-unit-conversion', label: 'Cubic units and liters'},
    ],
    answerHeading: 'How do I calculate volume?',
    answer: 'Volume measures the space a solid occupies. For a box, multiply length × width × height. For a cylinder, multiply the area of its circular base (π × radius²) by its height. A cone with the same base and height holds one third as much. Choose your shape and set the unit beside each measurement.',
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
        heading: 'How much water is in a partly filled tank?',
        paragraphs: [
          'A rectangular tank measures 100 cm long, 50 cm wide, and 40 cm high on the inside. It holds 200 L to the brim. If the water sits 5 cm below the rim, enter 35 cm for Height. The water occupies 100 × 50 × 35 = 175,000 cm³, or 175 L.',
          'Each extra centimeter of water in this tank adds 5 L because the footprint stays the same. Water depth also works as the height of an upright cylinder. In a cylinder lying on its side, the width of the water surface changes as it fills. A partial fill in that position needs a circular segment calculation.',
        ],
        figure: {
          id: 'solid-tank-waterline',
          caption: 'Measure the tank along the inside edges. For the water volume, the height stops at the waterline.',
        },
      },
      {
        id: 'tapered-planter',
        heading: 'How much soil will fill a tapered planter?',
        paragraphs: [
          'A round pot with straight, sloping sides measures 20 cm across the inside base and 32 cm across the inside rim. It is 24 cm deep. You want to leave 4 cm at the top for watering. How much potting mix will reach the mark?',
        ],
        figure: {
          id: 'solid-tapered-planter',
          caption: 'The upper diameter for this calculation is the width at the soil line. The empty space above it widens out to the rim.',
        },
        steps: [
          'Use the filled depth. From the inside floor to the soil line, the height is 24 − 4 = 20 cm.',
          'Find the width at that height. The pot widens by 12 cm over its full depth, so the diameter at the mark is 20 + 12 × (20 ÷ 24) = 30 cm. You can also measure across the pot at the mark.',
          'Choose Conical frustum. Enter 10 cm for Bottom radius, 15 cm for Top radius, and 20 cm for Height. In cubic centimeters the result is about 9,948 cm³, or 9.95 L. If a root ball is going into the pot, it takes up some of that space.',
        ],
        link: {sentence: 'Try your measurements in the {calculatorLink}.', href: '#mode-frustum', label: 'conical frustum calculator'},
      },
      {
        id: 'volume-unit-conversion',
        heading: 'How do cubic units convert to liters?',
        paragraphs: [
          'Picture a cube 10 cm on each side. It holds exactly 1 liter because 10 × 10 × 10 = 1,000 cm³. To turn cubic centimeters into liters, divide by 1,000. For cubic meters, multiply by 1,000. A single cubic centimeter is 1 mL.',
          'A box measuring 2 ft × 12 in × 6 in is 2 ft long, 1 ft wide, and half a foot tall. Its volume is 1 ft³, which equals 1,728 in³ or about 28.32 L. For cubic yards, divide cubic feet by 27.',
        ],
        link: {sentence: "To convert a known volume to liters, milliliters, or US or imperial gallons, use the {calculatorLink}.", href: "/conversion-calculator", label: "unit conversion calculator"},
      },
      {
        id: 'composite-volume',
        heading: 'How much water fits in a pipe, and how much material is in its wall?',
        paragraphs: [
          'Take a 2 m pipe with an outside diameter of 5 cm and an inside diameter of 4 cm. For water capacity, choose Cylinder. Use the inside radius of 2 cm and enter the pipe length of 2 m as Height. The pipe holds about 2,513 cm³, or 2.51 L.',
          'For the wall itself, choose Hollow cylinder. Use the same length with an outer radius of 2.5 cm and an inner radius of 2 cm. Subtracting the hollow center leaves about 1,414 cm³ of pipe material.',
          'Calculate each non-overlapping solid separately, then add their volumes in the same unit. Subtract empty regions when measuring material. A 4 m × 3 m × 2 m block with a 1 m × 1 m opening through its 2 m height contains 24 − 2 = 22 m³ of material.',
        ],
        figure: {
          id: 'solid-pipe-section',
          caption: 'Use the opening to find water capacity and the hatched ring to find wall material. Both extend the full length of the pipe.',
        },
        link: {sentence: 'To find the area you would paint or wrap, use the {calculatorLink}.', href: '/surface-area-calculator', label: 'surface area calculator'},
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
        link: {sentence: "For slabs and round columns with an extra-material allowance, use the {calculatorLink}.", href: "/concrete-calculator", label: "concrete calculator"},
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
        link: {sentence: "To calculate how much space a solid contains, use the {calculatorLink}.", href: "/volume-calculator", label: "volume calculator"},
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
        link: {sentence: "For an individual flat face, use the {calculatorLink}.", href: "/area-calculator", label: "area calculator"},
      },
    ],
  },
};
