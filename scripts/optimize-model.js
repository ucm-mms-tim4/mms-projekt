// Makes a lighter copy of a team model for the game. The input file is not changed.
// Usage: pnpm optimize-model <input.glb> <output.glb>
//
// - The team's materials have backface culling off, so the GPU also shades back
//   faces nobody can see. A material becomes single-sided when all its meshes are
//   closed and face outward. Glass and cutouts stay double-sided.
// - Unused data is removed: UVs without textures, duplicate vertex data.
// - No quantization: it moves node origins, and doors rotate around them.
import { NodeIO, Primitive, PropertyType } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { dedup, prune, weld } from "@gltf-transform/functions";

const [input, output] = process.argv.slice(2);
if (!input || !output) {
  console.error("Usage: pnpm optimize-model <input.glb> <output.glb>");
  process.exit(1);
}

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const document = await io.read(input);
const root = document.getRoot();
const primitives = root.listMeshes().flatMap((mesh) => mesh.listPrimitives());

for (const material of root.listMaterials()) {
  const used = primitives.filter((p) => p.getMaterial() === material);
  if (
    material.getAlphaMode() === "OPAQUE" &&
    used.length > 0 &&
    used.every(isClosedOutward)
  ) {
    material.setDoubleSided(false);
  }
}

// Only vertex data is deduplicated. Shared meshes would become Babylon instances,
// and merged materials would lose their names. Gameplay needs both intact.
await document.transform(
  dedup({ propertyTypes: [PropertyType.ACCESSOR] }),
  weld(),
  // Empty nodes stay: some mark places for gameplay (INT_Kabel_MiestoOpravy).
  prune({ keepLeaves: true }),
);
await io.write(output, document);

const singleSided = root.listMaterials().filter((m) => !m.getDoubleSided());
console.log(
  `${output}: ${singleSided.length} of ${root.listMaterials().length} materials single-sided`,
);

// Closed: every edge is shared by exactly two triangles, in opposite directions.
// Outward: the signed volume is positive (glTF front faces are counter-clockwise).
// Vertices are matched by position, because seams split them in the file.
function isClosedOutward(primitive) {
  const position = primitive.getAttribute("POSITION");
  const indices = primitive.getIndices();
  if (
    !position ||
    !indices ||
    primitive.getMode() !== Primitive.Mode.TRIANGLES
  ) {
    return false;
  }
  const ids = new Map();
  const vertexId = (index) => {
    const key = position
      .getElement(index, [])
      .map((v) => Math.round(v * 1e4))
      .join();
    if (!ids.has(key)) {
      ids.set(key, ids.size);
    }
    return ids.get(key);
  };

  const edges = new Map();
  let volume = 0;
  for (let i = 0; i < indices.getCount(); i += 3) {
    const corners = [0, 1, 2].map((k) => indices.getScalar(i + k));
    const [a, b, c] = corners.map((index) => position.getElement(index, []));
    volume +=
      a[0] * (b[1] * c[2] - b[2] * c[1]) -
      a[1] * (b[0] * c[2] - b[2] * c[0]) +
      a[2] * (b[0] * c[1] - b[1] * c[0]);
    const v = corners.map(vertexId);
    for (let k = 0; k < 3; k++) {
      const edge = `${v[k]}>${v[(k + 1) % 3]}`;
      edges.set(edge, (edges.get(edge) ?? 0) + 1);
    }
  }
  for (const [edge, count] of edges) {
    const [from, to] = edge.split(">");
    if (count !== 1 || edges.get(`${to}>${from}`) !== 1) {
      return false;
    }
  }
  return volume > 0;
}
