import { execFile } from "child_process";
import { promises as fs } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { promisify } from "util";
import { randomUUID } from "crypto";

const execFileAsync = promisify(execFile);

const SOFFICE_CANDIDATES = [
  "soffice",
  "soffice.exe",
  "C:\\Program Files\\LibreOffice\\program\\soffice.exe",
  "C:\\Program Files (x86)\\LibreOffice\\program\\soffice.exe",
];

function getExtension(filename: string) {
  const lastDot = filename.lastIndexOf(".");
  return lastDot === -1 ? "" : filename.slice(lastDot).toLowerCase();
}

export function isWordDocument(filename: string) {
  const ext = getExtension(filename);
  return ext === ".doc" || ext === ".docx";
}

export function isPdfDocument(filename: string) {
  return getExtension(filename) === ".pdf";
}

async function findSofficeBinary() {
  for (const candidate of SOFFICE_CANDIDATES) {
    try {
      await execFileAsync(candidate, ["--version"]);
      return candidate;
    } catch {
      // try next
    }
  }

  throw new Error(
    "Nao foi encontrado LibreOffice/soffice no servidor. Instala-o para permitir preview de Word na web.",
  );
}

export async function generatePreviewPdf(file: File) {
  if (isPdfDocument(file.name)) {
    return file;
  }

  if (!isWordDocument(file.name)) {
    return null;
  }

  const soffice = await findSofficeBinary();
  const workdir = join(tmpdir(), `doc-preview-${randomUUID()}`);
  await fs.mkdir(workdir, { recursive: true });

  const inputPath = join(workdir, file.name);
  const baseName = file.name.replace(/\.[^.]+$/, "");
  const outputPath = join(workdir, `${baseName}.pdf`);

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(inputPath, buffer);

    await execFileAsync(soffice, [
      "--headless",
      "--convert-to",
      "pdf",
      "--outdir",
      workdir,
      inputPath,
    ]);

    const pdfBuffer = await fs.readFile(outputPath);
    return new File([pdfBuffer], `${baseName}.pdf`, {
      type: "application/pdf",
    });
  } catch (error) {
    throw new Error(
      error instanceof Error
        ? `Falha ao converter Word para PDF: ${error.message}`
        : "Falha ao converter Word para PDF.",
    );
  } finally {
    await fs.rm(workdir, { recursive: true, force: true });
  }
}
