import { resolveRecipientsForDocument } from "@/lib/communications";

// ── mocks ────────────────────────────────────────────────────────────────────
const mockSelect = jest.fn();
const mockFrom = jest.fn(() => ({
  select: mockSelect,
}));
const mockClient = { from: mockFrom };

jest.mock("@/lib/supabase-service-server", () => ({
  createSupabaseServiceServerClient: () => mockClient,
}));

// helper to build chainable Supabase-like mocks
function chainable(returnValue: { data: any; error: any }) {
  const chain: any = {};
  const methods = ["select", "eq", "in", "single", "maybeSingle", "order", "limit", "ilike", "gte", "lte"];
  methods.forEach((m) => {
    chain[m] = jest.fn().mockReturnValue(chain);
  });
  chain.then = (resolve: any) => resolve(returnValue);
  chain.select = jest.fn().mockReturnValue(chain);
  chain.eq = jest.fn().mockReturnValue(chain);
  chain.in = jest.fn().mockReturnValue(chain);
  chain.single = jest.fn().mockResolvedValue(returnValue);
  chain.maybeSingle = jest.fn().mockResolvedValue(returnValue);
  return chain;
}

describe("resolveRecipientsForDocument", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("returns empty when document has no tags", async () => {
    // doc query
    mockFrom.mockImplementationOnce(() => ({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { id: "doc-1", tags: [] },
            error: null,
          }),
        }),
      }),
    }));

    const result = await resolveRecipientsForDocument("doc-1");
    expect(result.recipients).toHaveLength(0);
    expect(result.tags).toHaveLength(0);
  });

  test("skips tags without department", async () => {
    // doc query
    mockFrom
      .mockImplementationOnce(() => ({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { id: "doc-2", tags: ["financeiro", "rh"] },
              error: null,
            }),
          }),
        }),
      }))
      // document_tags query — neither has department
      .mockImplementationOnce(() => ({
        select: jest.fn().mockReturnValue({
          in: jest.fn().mockResolvedValue({
            data: [
              { name: "financeiro", department: null },
              { name: "rh", department: null },
            ],
            error: null,
          }),
        }),
      }));

    const result = await resolveRecipientsForDocument("doc-2");
    expect(result.recipients).toHaveLength(0);
    expect(result.departments).toHaveLength(0);
  });

  test("deduplicates users with multiple matching tags", async () => {
    mockFrom
      .mockImplementationOnce(() => ({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { id: "doc-3", tags: ["financeiro", "compras"] },
              error: null,
            }),
          }),
        }),
      }))
      .mockImplementationOnce(() => ({
        select: jest.fn().mockReturnValue({
          in: jest.fn().mockResolvedValue({
            data: [
              { name: "financeiro", department: "FINANCEIRO" },
              { name: "compras", department: "COMPRAS" },
            ],
            error: null,
          }),
        }),
      }))
      .mockImplementationOnce(() => ({
        select: jest.fn().mockReturnValue({
          in: jest.fn().mockResolvedValue({
            data: [
              { id: "u-1", name: "Alice", email: "alice@x.com", department: "FINANCEIRO" },
              { id: "u-1", name: "Alice", email: "alice@x.com", department: "COMPRAS" },
              { id: "u-2", name: "Bob", email: "bob@x.com", department: "COMPRAS" },
            ],
            error: null,
          }),
        }),
      }));

    const result = await resolveRecipientsForDocument("doc-3");
    expect(result.recipients).toHaveLength(2);
    const ids = result.recipients.map((r) => r.userId);
    expect(ids).toContain("u-1");
    expect(ids).toContain("u-2");
  });
});
