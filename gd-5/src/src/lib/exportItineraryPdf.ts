import { jsPDF } from "jspdf";

interface Activity {
  time: string;
  start_time?: string;
  duration?: string;
  travel_time?: string;
  activity: string;
  description: string;
  type: string;
  cost_estimate?: string;
  hidden_gem?: boolean;
  photo_spot?: boolean;
  local_food_tip?: string;
  insider_tip?: string;
  community_pick?: boolean;
}
interface DayPlan { day: number; title: string; weather_note?: string; activities: Activity[]; }
interface Itinerary {
  destination: string;
  destination_airport?: string;
  duration: string;
  summary?: string;
  days: DayPlan[];
  estimated_budget: string;
  best_season?: string;
  tips?: string[];
  packing_essentials?: string[];
  local_phrases?: string[];
  flight_suggestion?: { from_hub: string; to: string; estimated_price_range: string; flight_duration: string };
  hotel_suggestion?: { name: string; area: string; style: string; estimated_price_range: string };
  budget_breakdown?: Record<string, string>;
}

interface QuizExtras {
  food_preferences?: string | string[];
  beverage_preferences?: string | string[];
  departure_city?: string | string[];
}

const black: [number, number, number] = [45, 45, 45];
const ACCENT: [number, number, number] = [234, 179, 8];
const MUTED: [number, number, number] = [110, 110, 110];

function buildBookingLinks(itinerary: Itinerary, departureCity: string) {
  const departDate = new Date(Date.now() + 14 * 86400000);
  const cin = departDate.toISOString().split("T")[0];
  const cout = new Date(Date.now() + 21 * 86400000).toISOString().split("T")[0];
  const yymmdd = departDate.toISOString().slice(2, 10).replace(/-/g, "");

  const fromCode = (departureCity || "").slice(0, 3).toUpperCase() || "NYC";
  const toCode = (itinerary.destination_airport || itinerary.destination.split(",")[0]).slice(0, 3).toUpperCase();
  const flightUrl = `https://www.skyscanner.com/transport/flights/${fromCode}/${toCode}/${yymmdd}/`;

  const hotelQuery = encodeURIComponent(
    itinerary.hotel_suggestion?.name
      ? `${itinerary.hotel_suggestion.name} ${itinerary.destination}`
      : itinerary.destination,
  );
  const hotelUrl = `https://www.booking.com/searchresults.html?ss=${hotelQuery}&checkin=${cin}&checkout=${cout}&group_adults=2`;

  return { flightUrl, hotelUrl };
}

export function exportItineraryPdf(itinerary: Itinerary, quizData: QuizExtras = {}) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 40;
  let y = margin;

  const departureCity = Array.isArray(quizData.departure_city) ? quizData.departure_city[0] : (quizData.departure_city || "");
  const foodPrefs = Array.isArray(quizData.food_preferences) ? quizData.food_preferences.join(", ") : (quizData.food_preferences || "");
  const bevPrefs = Array.isArray(quizData.beverage_preferences) ? quizData.beverage_preferences.join(", ") : (quizData.beverage_preferences || "");
  const { flightUrl, hotelUrl } = buildBookingLinks(itinerary, departureCity);

  const ensureSpace = (needed: number) => {
    if (y + needed > pageH - margin) {
      doc.addPage();
      y = margin;
    }
  };

  const addWrapped = (text: string, opts: { size?: number; color?: [number, number, number]; bold?: boolean; indent?: number; gap?: number } = {}) => {
    const { size = 10, color = black, bold = false, indent = 0, gap = 4 } = opts;
    doc.setFontSize(size);
    doc.setTextColor(color[0], color[1], color[2]);
    doc.setFont("helvetica", bold ? "bold" : "normal");
    const lines = doc.splitTextToSize(text, pageW - margin * 2 - indent);
    lines.forEach((line: string) => {
      ensureSpace(size + 2);
      doc.text(line, margin + indent, y);
      y += size + 2;
    });
    y += gap;
  };

  // ── Header banner ──
  doc.setFillColor(black[0], black[1], black[2]);
  doc.rect(0, 0, pageW, 90, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("MystiGo", margin, 35);
  doc.setFontSize(22);
  doc.text(itinerary.destination, margin, 62);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(220, 220, 220);
  doc.text(`${itinerary.duration}  ·  ${itinerary.estimated_budget}${itinerary.best_season ? "  ·  Best: " + itinerary.best_season : ""}`, margin, 78);
  y = 110;

  if (itinerary.summary) addWrapped(itinerary.summary, { size: 11, color: MUTED, gap: 10 });

  // ── Preferences applied ──
  if (foodPrefs || bevPrefs) {
    addWrapped("Personalized For", { size: 9, color: ACCENT, bold: true, gap: 2 });
    if (foodPrefs) addWrapped(`Food: ${foodPrefs}`, { size: 10 });
    if (bevPrefs) addWrapped(`Beverages: ${bevPrefs}`, { size: 10, gap: 8 });
  }

  // ── Booking links ──
  ensureSpace(60);
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageW - margin, y);
  y += 12;
  addWrapped("Booking Links", { size: 12, bold: true, gap: 4 });

  doc.setFontSize(10);
  doc.setTextColor(20, 90, 180);
  doc.textWithLink("✈  Book flights on Skyscanner", margin, y, { url: flightUrl });
  y += 16;
  doc.textWithLink("🏨  Book hotels on Booking.com", margin, y, { url: hotelUrl });
  y += 22;
  doc.setTextColor(black[0], black[1], black[2]);

  // ── Day by day ──
  itinerary.days?.forEach((day) => {
    ensureSpace(60);
    // Day header strip
    doc.setFillColor(black[0], black[1], black[2]);
    doc.rect(margin, y, pageW - margin * 2, 28, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(`Day ${day.day}  ·  ${day.title}`, margin + 10, y + 18);
    y += 36;

    if (day.weather_note) {
      addWrapped(day.weather_note, { size: 9, color: MUTED, gap: 6 });
    }

    day.activities?.forEach((act) => {
      ensureSpace(40);
      const timeLabel = act.start_time ? `${act.time} · ${act.start_time}` : act.time;
      const meta = [timeLabel, act.duration, act.cost_estimate].filter(Boolean).join(" · ");
      addWrapped(meta, { size: 9, color: ACCENT, bold: true, gap: 2 });

      const tags = [
        act.hidden_gem ? "Hidden Gem" : null,
        act.photo_spot ? "Photo Spot" : null,
        act.community_pick ? "Community Pick" : null,
      ].filter(Boolean).join(" · ");

      addWrapped(act.activity + (tags ? `   [${tags}]` : ""), { size: 11, bold: true, gap: 2 });
      if (act.travel_time) addWrapped(`→ ${act.travel_time}`, { size: 9, color: MUTED, gap: 2 });
      addWrapped(act.description, { size: 10, color: MUTED, gap: 3 });
      if (act.local_food_tip) addWrapped(`🍽  ${act.local_food_tip}`, { size: 9, color: [200, 100, 30], gap: 2 });
      if (act.insider_tip) addWrapped(`💡  ${act.insider_tip}`, { size: 9, color: [120, 70, 180], gap: 6 });
      y += 4;
    });

    y += 6;
  });

  // ── Tips & packing ──
  if (itinerary.tips?.length) {
    ensureSpace(40);
    addWrapped("Travel Tips", { size: 12, bold: true, gap: 4 });
    itinerary.tips.forEach((t) => addWrapped(`•  ${t}`, { size: 10, color: MUTED, gap: 2 }));
    y += 6;
  }

  if (itinerary.packing_essentials?.length) {
    ensureSpace(40);
    addWrapped("Packing Essentials", { size: 12, bold: true, gap: 4 });
    itinerary.packing_essentials.forEach((t) => addWrapped(`•  ${t}`, { size: 10, color: MUTED, gap: 2 }));
    y += 6;
  }

  if (itinerary.local_phrases?.length) {
    ensureSpace(40);
    addWrapped("Local Phrases", { size: 12, bold: true, gap: 4 });
    itinerary.local_phrases.forEach((t) => addWrapped(`•  ${t}`, { size: 10, color: MUTED, gap: 2 }));
    y += 6;
  }

  if (itinerary.budget_breakdown) {
    ensureSpace(40);
    addWrapped("Budget Breakdown", { size: 12, bold: true, gap: 4 });
    Object.entries(itinerary.budget_breakdown).forEach(([k, v]) => {
      addWrapped(`${k.charAt(0).toUpperCase() + k.slice(1)}: ${v}`, { size: 10, color: MUTED, gap: 2 });
    });
  }

  // ── Footer on every page ──
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
    doc.text(`MystiGo · ${itinerary.destination} · Page ${i} of ${pageCount}`, margin, pageH - 18);
  }

  const safe = itinerary.destination.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
  doc.save(`mystigo-${safe}-itinerary.pdf`);
}
