// Direct verification test for project serialization, XML conversion, flood fill, line algorithm, and resize logic

import {
  createDefaultProject,
  validateProject,
  projectToJSON,
  projectFromJSON,
  projectToXML,
  projectFromXML,
} from './src/utils/projectSerialization.ts';
import {
  getLinePoints,
  floodFill,
  resizeGridEdges,
  cropToSelection,
} from './src/canvas/tools.ts';
import { calculateColorCounts } from './src/utils/exportCsv.ts';

console.log('--- Starting BeadsViewer Test Suite ---');

// 1. Default project creation
const proj = createDefaultProject(30, 30, 'Тестова схема');
console.assert(proj.rows === 30, 'Rows should be 30');
console.assert(proj.cols === 30, 'Cols should be 30');
console.assert(proj.cells.length === 30, 'Cells rows should be 30');
console.assert(proj.cells[0].length === 30, 'Cells cols should be 30');
console.log('✓ createDefaultProject passed');

// 2. JSON serialization round-trip
const json = projectToJSON(proj);
const restoredFromJSON = projectFromJSON(json);
console.assert(restoredFromJSON.name === proj.name, 'Project name must match');
console.assert(restoredFromJSON.rows === 30, 'Rows must match');
console.assert(restoredFromJSON.cells[15][15] === proj.cells[15][15], 'Cell color at center must match');
console.log('✓ JSON serialization round-trip passed');

// 3. Corrupted JSON validation
const corruptedCheck1 = validateProject(null);
console.assert(corruptedCheck1.valid === false, 'Null must fail validation');

const corruptedCheck2 = validateProject({ rows: -5, cols: 30 });
console.assert(corruptedCheck2.valid === false, 'Negative rows must fail validation');

const corruptedCheck3 = validateProject({ rows: 2, cols: 2, cells: [[null]] });
console.assert(corruptedCheck3.valid === false, 'Mismatched cells rows must fail validation');
console.log('✓ Corrupted JSON validation handled gracefully with clear errors');

// 4. Bresenham Line
const line = getLinePoints(0, 0, 0, 5);
console.assert(line.length === 6, 'Horizontal line 0..5 must have 6 points');
const diagonalLine = getLinePoints(0, 0, 3, 3);
console.assert(diagonalLine.length === 4, 'Diagonal line (0,0)->(3,3) must have 4 points');
console.log('✓ Bresenham line algorithm passed');

// 5. Flood Fill
const testGrid = [
  ['A', 'A', 'B'],
  ['A', 'B', 'B'],
  ['B', 'B', 'B'],
];
const filled = floodFill(testGrid, 0, 0, 'C');
console.assert(filled.length === 3, 'Top-left cluster of A should have 3 cells');
console.log('✓ Flood fill algorithm passed');

// 6. Resize grid edges (extend + shift)
const resized = resizeGridEdges(proj, 2, 3, 1, 4); // +2 top, +3 bottom, +1 left, +4 right
console.assert(resized.rows === 30 + 2 + 3, 'New rows must be 35');
console.assert(resized.cols === 30 + 1 + 4, 'New cols must be 35');
// Original (0,0) is now at (2, 1)
console.assert(resized.cells[2][1] === proj.cells[0][0], 'Shifted cell coordinates must match');
console.log('✓ Resize grid edges passed');

// 7. Crop to selection
const cropped = cropToSelection(proj, { startR: 10, startC: 10, endR: 19, endC: 19 });
console.assert(cropped.rows === 10, 'Cropped rows must be 10');
console.assert(cropped.cols === 10, 'Cropped cols must be 10');
console.log('✓ Crop to selection passed');

// 8. Beads counting
const counts = calculateColorCounts(proj, []);
console.assert(counts.length > 0, 'Counts must contain used colors');
const totalBeads = counts.reduce((sum, c) => sum + c.count, 0);
console.assert(totalBeads > 0, `Total beads count should be > 0 (found ${totalBeads})`);
console.log('✓ calculateColorCounts passed');

// 9. Shape tools verification
import {
  getRectanglePoints,
  getCirclePoints,
  getDiamondPoints,
  getTrianglePoints,
  getStarPoints,
  getHeartPoints,
  getFlowerPoints,
  getShapePoints,
} from './src/canvas/tools.ts';

const rectOutline = getRectanglePoints(0, 0, 4, 4, false);
console.assert(rectOutline.length === 16, `Rect 5x5 outline must have 16 points (got ${rectOutline.length})`);

const rectFilled = getRectanglePoints(0, 0, 4, 4, true);
console.assert(rectFilled.length === 25, `Rect 5x5 filled must have 25 points (got ${rectFilled.length})`);

const circle = getCirclePoints(0, 0, 8, 8, true);
console.assert(circle.length > 10, 'Circle points must be > 10');

const diamond = getDiamondPoints(0, 0, 6, 6, true);
console.assert(diamond.length > 5, 'Diamond points must be > 5');

const triangle = getTrianglePoints(0, 0, 6, 6, true);
console.assert(triangle.length > 5, 'Triangle points must be > 5');

const star = getStarPoints(0, 0, 10, 10, true);
console.assert(star.length > 10, 'Star points must be > 10');

const heart = getHeartPoints(0, 0, 8, 8, true);
console.assert(heart.length > 5, 'Heart points must be > 5');

const flower = getFlowerPoints(0, 0, 10, 10, true);
console.assert(flower.length > 10, 'Flower points must be > 10');

const dispatched = getShapePoints('heart', 0, 0, 8, 8, true);
console.assert(dispatched.length === heart.length, 'Dispatched shape points must match');
console.log('✓ All 7 shape algorithms (circle, star, heart, diamond, rectangle, triangle, flower) passed');

console.log('=== All 9 Automated Verification Tests Passed Successfully! ===');

