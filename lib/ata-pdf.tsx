import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";
import type { WorkstreamAtaRecord } from "@/lib/workstream-atas";
import type { Contramedida } from "@/lib/workstream-atas";

// ---------------------------------------------------------------------------
// Constantes de design (replicam o template PowerPoint)
// ---------------------------------------------------------------------------
const C = {
  black: "#1A1A1A",
  dark: "#2D2D2D",
  yellow: "#FFE500",
  gray: "#6B6B6B",
  lightGray: "#E8E8E8",
  white: "#FFFFFF",
  headerBg: "#FFFFFF",
  sectionBorder: "#D0D0D0",
  tableHeaderBg: "#F0F0F0",
  accent: "#1A1A1A",
} as const;

// ---------------------------------------------------------------------------
// Estilos
// ---------------------------------------------------------------------------
const s = StyleSheet.create({
  // --- Páginas ---
  pageCover: {
    backgroundColor: C.white,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: 60,
    fontFamily: "Helvetica",
  },
  pageContent: {
    backgroundColor: C.white,
    flexDirection: "column",
    padding: 28,
    fontFamily: "Helvetica",
  },
  pageBack: {
    backgroundColor: C.white,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: 60,
    fontFamily: "Helvetica",
  },

  // --- Logo / header ---
  logoWrap: {
    alignItems: "center",
    marginBottom: 8,
  },
  logoMain: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 2,
    color: C.black,
    textTransform: "uppercase",
  },
  logoSub: {
    fontSize: 7,
    letterSpacing: 4,
    color: C.gray,
    textTransform: "uppercase",
    marginTop: 2,
  },
  logoHr: {
    width: 160,
    borderBottomWidth: 0.5,
    borderBottomColor: C.lightGray,
    marginTop: 6,
  },

  // --- Capa ---
  coverTitle: {
    fontSize: 38,
    fontFamily: "Helvetica-Bold",
    color: C.black,
    textTransform: "uppercase",
    letterSpacing: 3,
    textAlign: "center",
    marginTop: 40,
  },
  coverWs: {
    fontSize: 18,
    fontFamily: "Helvetica",
    color: C.black,
    textAlign: "center",
    marginTop: 20,
    letterSpacing: 1,
  },
  coverDate: {
    fontSize: 11,
    color: C.gray,
    textAlign: "center",
    letterSpacing: 0.5,
  },

  // --- Página de conteúdo: header ---
  contentHeader: {
    alignItems: "center",
    marginBottom: 10,
  },
  contentTitle: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    color: C.black,
    textTransform: "uppercase",
    letterSpacing: 2,
    marginTop: 6,
  },

  // --- Grid 2×2 ---
  grid: {
    flexDirection: "row",
    flex: 1,
    gap: 8,
  },
  col: {
    flexDirection: "column",
    flex: 1,
    gap: 8,
  },

  // --- Caixa de secção ---
  section: {
    flex: 1,
    borderWidth: 0.75,
    borderColor: C.sectionBorder,
    borderRadius: 3,
    padding: 10,
    flexDirection: "column",
  },
  sectionLabel: {
    fontSize: 6.5,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 1.2,
    color: C.gray,
    marginBottom: 6,
  },
  bulletText: {
    fontSize: 8.5,
    color: C.dark,
    lineHeight: 1.55,
  },

  // --- Tabela de contramedidas ---
  tableHeader: {
    flexDirection: "row",
    backgroundColor: C.tableHeaderBg,
    borderRadius: 2,
    paddingVertical: 4,
    paddingHorizontal: 4,
    marginBottom: 3,
  },
  tableColAction: { flex: 3 },
  tableColOwner: { flex: 1.2 },
  tableColDate: { flex: 1 },
  tableHeaderText: {
    fontSize: 6,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    color: C.gray,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 3,
    paddingHorizontal: 4,
    borderBottomWidth: 0.4,
    borderBottomColor: C.lightGray,
  },
  tableRowText: {
    fontSize: 7.5,
    color: C.dark,
    lineHeight: 1.4,
  },

  // --- Participantes ---
  participants: {
    borderTopWidth: 0.75,
    borderTopColor: C.sectionBorder,
    paddingTop: 7,
    marginTop: 8,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
  },
  participantsLabel: {
    fontSize: 6.5,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 1.2,
    color: C.gray,
    paddingTop: 1,
  },
  participantsText: {
    fontSize: 8.5,
    color: C.dark,
    flex: 1,
    lineHeight: 1.5,
  },

  // --- Rodapé ---
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 6,
    paddingTop: 5,
    borderTopWidth: 0.4,
    borderTopColor: C.lightGray,
  },
  footerText: {
    fontSize: 6.5,
    color: C.lightGray,
    letterSpacing: 0.5,
  },

  // --- Contracapa ---
  backTitle: {
    fontSize: 28,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 3,
    color: C.black,
    textTransform: "uppercase",
    marginTop: 20,
  },
  backSub: {
    fontSize: 9,
    letterSpacing: 5,
    color: C.gray,
    textTransform: "uppercase",
    marginTop: 4,
  },
  backUrl: {
    fontSize: 10,
    color: C.gray,
    marginTop: 40,
    letterSpacing: 1,
  },
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function Logo({ large = false }: { large?: boolean }) {
  return (
    <View style={s.logoWrap}>
      <Text style={large ? [s.logoMain, { fontSize: 28 }] : s.logoMain}>Groupe GM</Text>
      <Text style={large ? [s.logoSub, { fontSize: 8 }] : s.logoSub}>Amenities Exclusivos</Text>
      <View style={large ? [s.logoHr, { width: 220, marginTop: 8 }] : s.logoHr} />
    </View>
  );
}

function SectionBox({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <View style={s.section}>
      <Text style={s.sectionLabel}>{label}</Text>
      {children}
    </View>
  );
}

function BulletContent({ text }: { text: string }) {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  return (
    <>
      {lines.map((line, i) => (
        <Text key={i} style={s.bulletText}>
          {line}
        </Text>
      ))}
    </>
  );
}

function ContramedidaTable({ rows }: { rows: Contramedida[] }) {
  return (
    <View>
      <View style={s.tableHeader}>
        <View style={s.tableColAction}>
          <Text style={s.tableHeaderText}>Ações</Text>
        </View>
        <View style={s.tableColOwner}>
          <Text style={s.tableHeaderText}>Owner</Text>
        </View>
        <View style={s.tableColDate}>
          <Text style={s.tableHeaderText}>Data</Text>
        </View>
      </View>
      {rows.map((row, i) => (
        <View key={i} style={s.tableRow}>
          <View style={s.tableColAction}>
            <Text style={s.tableRowText}>{row.action}</Text>
          </View>
          <View style={s.tableColOwner}>
            <Text style={s.tableRowText}>{row.owner || "—"}</Text>
          </View>
          <View style={s.tableColDate}>
            <Text style={s.tableRowText}>{row.deadline || "—"}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

function formatDate(iso: string) {
  try {
    return new Date(iso + "T00:00:00").toLocaleDateString("pt-PT", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

// ---------------------------------------------------------------------------
// Mapeamento de workstream → label curto
// ---------------------------------------------------------------------------
const WS_LABEL: Record<string, string> = {
  ws1: "Workstream 1",
  ws2: "Workstream 2",
  ws3: "Workstream 3",
  ws4: "Workstream 4",
  steering: "Steering",
  ps: "Progresso Semanal",
};

// ---------------------------------------------------------------------------
// Documento principal
// ---------------------------------------------------------------------------
export function AtaPdf({ ata }: { ata: WorkstreamAtaRecord }) {
  const wsLabel = WS_LABEL[ata.workstream] ?? ata.workstream.toUpperCase();
  const dateLabel = formatDate(ata.meetingDate);

  return (
    <Document
      title={`Ata ${wsLabel} — ${dateLabel}`}
      author="Groupe GM"
      subject="Projeto SOAP — Ata de Reunião"
    >
      {/* ------------------------------------------------------------------ */}
      {/* Página 1 — Capa                                                     */}
      {/* ------------------------------------------------------------------ */}
      <Page size="A4" orientation="landscape" style={s.pageCover}>
        <Logo large />
        <Text style={s.coverTitle}>Projeto SOAP</Text>

        <Text style={[s.coverWs, { marginTop: 24, textAlign: "center" }]}>
          {"Ata de reunião — "}
          <Text style={{ fontFamily: "Helvetica-Bold" }}>{wsLabel}</Text>
        </Text>

        <Text style={[s.coverDate, { marginTop: 14, textAlign: "center" }]}>
          {"Data:  "}
          <Text style={{ color: C.black }}>{dateLabel}</Text>
        </Text>
      </Page>

      {/* ------------------------------------------------------------------ */}
      {/* Página 2 — Conteúdo                                                 */}
      {/* ------------------------------------------------------------------ */}
      <Page size="A4" orientation="landscape" style={s.pageContent}>
        {/* Header */}
        <View style={s.contentHeader}>
          <Logo />
          <Text style={s.contentTitle}>
            {wsLabel} · {dateLabel}
          </Text>
        </View>

        {/* Grid 2×2 */}
        <View style={s.grid}>
          {/* Coluna esquerda */}
          <View style={s.col}>
            <SectionBox label="1. Situação atual (progresso face ao plano)">
              <BulletContent text={ata.situacaoAtual || "—"} />
            </SectionBox>
            <SectionBox label="2. Problemas identificados (desvios e bloqueios)">
              <BulletContent text={ata.problemasIdentificados || "—"} />
            </SectionBox>
          </View>

          {/* Coluna direita */}
          <View style={s.col}>
            <SectionBox label="3. Contramedidas e decisões (ações acordadas, responsável e prazo)">
              {ata.contramedidas.length > 0 ? (
                <ContramedidaTable rows={ata.contramedidas} />
              ) : (
                <Text style={s.bulletText}>—</Text>
              )}
            </SectionBox>
            <SectionBox label="4. Próximos passos (foco para a semana seguinte)">
              <BulletContent text={ata.proximosPassos || "—"} />
            </SectionBox>
          </View>
        </View>

        {/* Participantes */}
        <View style={s.participants}>
          <Text style={s.participantsLabel}>Participantes:</Text>
          <Text style={s.participantsText}>
            {ata.participantes
              .split("\n")
              .map((l) => l.replace(/^•\s*/, "").trim())
              .filter(Boolean)
              .join("  ·  ")}
          </Text>
        </View>

        {/* Rodapé */}
        <View style={s.footer}>
          <Text style={s.footerText}>Groupe GM · Projeto SOAP · Confidencial</Text>
          <Text style={s.footerText}>{dateLabel}</Text>
        </View>
      </Page>

      {/* ------------------------------------------------------------------ */}
      {/* Página 3 — Contracapa                                               */}
      {/* ------------------------------------------------------------------ */}
      <Page size="A4" orientation="landscape" style={s.pageBack}>
        <Logo large />
        <Text style={s.backUrl}>www.groupegm.pt</Text>
      </Page>
    </Document>
  );
}
