const fs = require('fs');

// Load and parse the mesh.json file
const rawData = fs.readFileSync('./mesh.json', 'utf8');
const meshData = JSON.parse(rawData);

// Helper to extract position from matrix
function extractPosition(matrix) {
  return {
    x: matrix[12] || 0,
    y: matrix[13] || 0,
    z: matrix[14] || 0,
  };
}

// Extract TObject entries
const objects = [];

let i = 0;
for (const entry of Object.values(meshData)) {
  const object = entry.object;
  if (object && object.type === 'Mesh') {
    objects.push({
      id: object.uuid,
      type: 'cube',
      name: `cube ${i}`,
      scale: 0,
      path: '',
      visible: true,
      position: extractPosition(object.matrix || []),
    });
      i++;
  }
}

// Save to new JSON file
const output = { objects };
fs.writeFileSync('mesh_objects.json', JSON.stringify(output, null, 2), 'utf8');

console.log('mesh_objects.json created successfully.');
