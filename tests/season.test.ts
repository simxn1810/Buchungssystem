import { describe, it, expect } from "vitest";
import { saisonFuerDatum } from "@/lib/season";

describe("Saison-Erkennung", () => {
  it("Winter: 01.10.-30.04.", () => {
    expect(saisonFuerDatum("2026-01-15")).toBe("winter");
    expect(saisonFuerDatum("2026-04-30")).toBe("winter");
    expect(saisonFuerDatum("2026-10-01")).toBe("winter");
    expect(saisonFuerDatum("2026-12-24")).toBe("winter");
  });

  it("Sommer: 01.05.-30.09.", () => {
    expect(saisonFuerDatum("2026-05-01")).toBe("sommer");
    expect(saisonFuerDatum("2026-07-15")).toBe("sommer");
    expect(saisonFuerDatum("2026-09-30")).toBe("sommer");
  });
});
