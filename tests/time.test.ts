import { describe, it, expect } from "vitest";
import {
  zeitTomin,
  minToZeit,
  alleSlots,
  slotsFuerBuchung,
  innerhalbOeffnung,
  wochentagGruppe,
} from "@/lib/time";

describe("Zeit-/Slot-Helfer", () => {
  it("rechnet zwischen HH:MM und Minuten um", () => {
    expect(zeitTomin("07:15")).toBe(435);
    expect(minToZeit(435)).toBe("07:15");
    expect(minToZeit(0)).toBe("00:00");
  });

  it("erzeugt 15-Min-Slots innerhalb der Oeffnungszeiten (07:00-23:00)", () => {
    const slots = alleSlots();
    expect(slots[0]).toBe("07:00");
    // Letzter Startslot endet um 23:00 -> 22:45.
    expect(slots[slots.length - 1]).toBe("22:45");
    // 16 Stunden * 4 = 64 Slots.
    expect(slots.length).toBe(64);
  });

  it("berechnet die belegten Slots einer Buchung", () => {
    expect(slotsFuerBuchung("18:00", 60)).toEqual(["18:00", "18:15", "18:30", "18:45"]);
    expect(slotsFuerBuchung("07:30", 30)).toEqual(["07:30", "07:45"]);
  });

  it("prueft die Lage innerhalb der Oeffnungszeiten", () => {
    expect(innerhalbOeffnung("22:30", 30)).toBe(true); // endet 23:00
    expect(innerhalbOeffnung("22:45", 30)).toBe(false); // endet 23:15
    expect(innerhalbOeffnung("06:45", 30)).toBe(false); // vor Oeffnung
  });

  it("bestimmt die Wochentag-Gruppe", () => {
    expect(wochentagGruppe("2026-06-20")).toBe("wochenende"); // Samstag
    expect(wochentagGruppe("2026-06-21")).toBe("wochenende"); // Sonntag
    expect(wochentagGruppe("2026-06-19")).toBe("werktags"); // Freitag
  });
});
