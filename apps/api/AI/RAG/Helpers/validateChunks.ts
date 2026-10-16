
type Chunk = {
  text: string;
  metadata: {
    page?: number;
    currentSection?: string;
    blockTypes?: string[];
  };
};

type ValidationResult = {
  valid: boolean;
  errors: string[];
  warnings: string[];
};

export function validateChunks(
  chunks: Chunk[],
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  console.log(`Validating ${chunks.length} chunks...`);

  if (chunks.length === 0) {
    return {
      valid: false,
      errors: ["No chunks were produced."],
      warnings,
    };
  }

  chunks.forEach((chunk, index) => {
    if (
      typeof chunk.text !== "string" ||
      chunk.text.trim().length === 0
    ) {
      errors.push(`Chunk ${index} has empty text.`);
      return;
    }

    const { page, currentSection, blockTypes } =
      chunk.metadata ?? {};

    if (
      page !== undefined &&
      (!Number.isInteger(page) || page < 1)
    ) {
      errors.push(`Chunk ${index} has an invalid page number.`);
    }

    if (
      currentSection !== undefined &&
      typeof currentSection !== "string"
    ) {
      errors.push(`Chunk ${index} has an invalid section.`);
    }

    if (
      blockTypes !== undefined &&
      (!Array.isArray(blockTypes) ||
        !blockTypes.every((type) => typeof type === "string"))
    ) {
      errors.push(`Chunk ${index} has invalid block types.`);
    }

    if (!page) {
      warnings.push(`Chunk ${index} has no page reference.`);
    }

    if (!currentSection) {
      warnings.push(`Chunk ${index} has no section context.`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
