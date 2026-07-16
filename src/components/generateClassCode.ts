import type { ClassModelSpec } from "@/types";

/** Generates the class-skeleton artifact used by guided LLD lessons. */
export function generateClassCode(design: ClassModelSpec): string {
  const entities = design.entities.filter((entity) => entity.isEntity);
  const relationshipComment = design.relationships.map((relationship) => `// ${relationship}`).join("\n");
  const classes = entities
    .map((entity) => {
      const properties = entity.properties ?? [];
      const methods = design.methods.filter((method) => method.ownerId === entity.id);
      const propertyLines = properties.map((property) => `  ${property.name}: ${property.type}`);
      const methodLines = methods.map((method) => `  ${method.signature}`);
      const parts: string[] = [];
      if (propertyLines.length) parts.push(propertyLines.join("\n"));
      if (methodLines.length) parts.push(methodLines.join("\n"));
      const body = parts.length ? parts.join("\n\n") : "  // no members, identity only";
      return `class ${entity.name} {\n${body}\n}`;
    })
    .join("\n\n");
  return `${relationshipComment}\n\n${classes}`;
}
