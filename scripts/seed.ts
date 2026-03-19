import { mockCategories, mockDocuments, mockUsers } from "@/lib/constants";

async function main() {
  console.log("Seed local preparado.");
  console.log("Usuarios:", mockUsers.length);
  console.log("Categorias:", mockCategories.length);
  console.log("Documentos:", mockDocuments.length);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
