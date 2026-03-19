function stripExtension(input: string) {
  const lastDot = input.lastIndexOf(".");
  if (lastDot <= 0) return input;
  return input.slice(0, lastDot);
}

function parseVersionToken(token: string): number | null {
  // Ej: V001, v12, V2
  const m = token.trim().match(/^V(\d+)$/i);
  if (!m) return null;
  const num = Number(m[1]);
  if (!Number.isFinite(num)) return null;
  return num;
}

export function parseDepartmentTitleVersion(raw: string): {
  department: string | null;
  title: string | null;
  versionNumber: number | null;
} {
  const input = stripExtension(raw).trim();
  if (!input) {
    return { department: null, title: null, versionNumber: null };
  }

  // Separador típico del caso de uso: " - "
  const segments = input
    .split(" - ")
    .map((s) => s.trim())
    .filter(Boolean);

  if (segments.length === 0) {
    return { department: null, title: null, versionNumber: null };
  }

  // Versión: normalemente la última parte con token V###
  let versionNumber: number | null = null;
  const versionIndexFromEnd = segments
    .map((s, idx) => ({ s, idx }))
    .reverse()
    .find(({ s }) => parseVersionToken(s) !== null)?.idx;

  if (typeof versionIndexFromEnd === "number") {
    versionNumber = parseVersionToken(segments[versionIndexFromEnd]) ?? null;
    segments.splice(versionIndexFromEnd, 1);
  }

  // Ahora: primer segmento = departamento (posible prefijo tipo "PE.DSI")
  const departmentSeg = segments[0] ?? null;
  const department =
    departmentSeg
      ? departmentSeg.includes(".")
        ? departmentSeg.split(".").slice(-1)[0]
        : departmentSeg
      : null;

  // Título = resto de segmentos
  const title = segments.length >= 2 ? segments.slice(1).join(" - ") : null;

  return {
    department: department ? department.trim() : null,
    title: title ? title.trim() : null,
    versionNumber,
  };
}

