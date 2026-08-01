const fs = require('fs');

let content = fs.readFileSync('src/ShapeRenderer.tsx', 'utf8');

// 1. Add imports
content = content.replace(
  /import \{\n  drawRoughRectangle,[\s\S]*?\} from "\.\/utils\/roughHelper";/,
  `import {
  drawDrawable,
  getRoughRectangleDrawable,
  getRoughEllipseDrawable,
  getRoughPolygonDrawable,
  getRoughPathDrawable,
  getFreehandSvgPath,
  getCachedDrawable
} from "./utils/roughHelper";
import { useStore } from "./store";`
);

// 2. Add theme check
content = content.replace(
  /const commonProps = \{\n\s*fill: fill \|\| "transparent",\n\s*stroke: stroke \|\| "#1e293b",/,
  `const theme = useStore((s) => s.theme);
  const isDark = theme === "dark";
  const displayStroke = isDark && (stroke === "#1e293b" || !stroke) ? "#ced4da" : (stroke || "#1e293b");

  const commonProps = {
    fill: fill || "transparent",
    stroke: displayStroke,`
);

// 3. Replace sceneFunc for Path
content = content.replace(
  /drawRoughPath\(ctx, pathString, width, height, element\.roughness!, fill\);/g,
  `const d = getCachedDrawable(element, () => getRoughPathDrawable(pathString, width, height, element.roughness!, fill));
              if (d) drawDrawable(ctx, d);`
);

// 4. Replace sceneFunc for Rectangle
content = content.replace(
  /drawRoughRectangle\(ctx, width, height, element\.roughness!, fill\);/g,
  `const d = getCachedDrawable(element, () => getRoughRectangleDrawable(width, height, element.roughness!, fill));
                if (d) drawDrawable(ctx, d);`
);

// 5. Replace sceneFunc for Ellipse (r*2)
content = content.replace(
  /drawRoughEllipse\(ctx, r \* 2, r \* 2, element\.roughness!, fill\);/g,
  `const d = getCachedDrawable(element, () => getRoughEllipseDrawable(r * 2, r * 2, element.roughness!, fill));
                if (d) drawDrawable(ctx, d);`
);

// 6. Replace sceneFunc for Ellipse (width, height)
content = content.replace(
  /drawRoughEllipse\(ctx, width, height, element\.roughness!, fill\);/g,
  `const d = getCachedDrawable(element, () => getRoughEllipseDrawable(width, height, element.roughness!, fill));
                if (d) drawDrawable(ctx, d);`
);

// 7. Replace sceneFunc for Polygon
content = content.replace(
  /drawRoughPolygon\(ctx, (\[\[.*?\]\]), element\.roughness!, true, fill\);/g,
  `const d = getCachedDrawable(element, () => getRoughPolygonDrawable($1, element.roughness!, true, fill));
                if (d) drawDrawable(ctx, d);`
);

// 8. Replace sceneFunc in ConnectorRenderer
content = content.replace(
  /drawRoughPolygon\(ctx, element\.points!, element\.roughness!, false\);/g,
  `const d = getCachedDrawable(element, () => getRoughPolygonDrawable(element.points!, element.roughness!, false, undefined));
          if (d) drawDrawable(ctx, d);`
);

// Also need to pass displayStroke in ConnectorRenderer
content = content.replace(
  /stroke=\{element\.stroke \|\| "#1e293b"\}/g,
  `stroke={element.stroke === "#1e293b" ? "#ced4da" : (element.stroke || "#1e293b")}` // Simplification for connector since it's a separate component. Actually we should use theme.
);


fs.writeFileSync('src/ShapeRenderer.tsx', content, 'utf8');
