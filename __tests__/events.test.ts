import { assertEventLocationOrOnline, assertEventDates } from "@/lib/events";

describe("assertEventLocationOrOnline", () => {
  test("passes when location is provided", () => {
    expect(assertEventLocationOrOnline({ isOnline: false, location: "Sala A" })).toBe(true);
  });

  test("passes when isOnline is true (no location needed)", () => {
    expect(assertEventLocationOrOnline({ isOnline: true, location: undefined })).toBe(true);
  });

  test("throws when neither online nor location", () => {
    expect(() =>
      assertEventLocationOrOnline({ isOnline: false, location: "" }),
    ).toThrow();
  });

  test("throws when isOnline false and location is whitespace", () => {
    expect(() =>
      assertEventLocationOrOnline({ isOnline: false, location: "   " }),
    ).toThrow();
  });
});

describe("assertEventDates", () => {
  test("passes when no end date", () => {
    expect(assertEventDates({ startsAt: "2026-05-06T10:00", endsAt: undefined })).toBe(true);
  });

  test("passes when end is after start", () => {
    expect(
      assertEventDates({ startsAt: "2026-05-06T10:00", endsAt: "2026-05-06T12:00" }),
    ).toBe(true);
  });

  test("throws when end is before start", () => {
    expect(() =>
      assertEventDates({ startsAt: "2026-05-06T12:00", endsAt: "2026-05-06T10:00" }),
    ).toThrow();
  });

  test("passes when end equals start", () => {
    expect(
      assertEventDates({ startsAt: "2026-05-06T10:00", endsAt: "2026-05-06T10:00" }),
    ).toBe(true);
  });
});
