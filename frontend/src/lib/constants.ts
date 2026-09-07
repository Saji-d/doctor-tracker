// Shared value sets for doctor specialization and patient condition.
// Used by both the create/edit forms (as Select options) and the list-page
// filters, so a value entered on one page is always findable via search on
// the other — a free-text field here would silently break filtering.
export const SPECIALIZATIONS = [
  "Cardiology",
  "Dermatology",
  "Neurology",
  "Orthopedics",
  "Pediatrics",
  "General Medicine",
];

export const CONDITIONS = [
  "Hypertension",
  "Diabetes Type 2",
  "Asthma",
  "Migraine",
  "Arthritis",
  "Eczema",
  "Anxiety Disorder",
  "Common Cold",
  "Back Pain",
  "Allergic Rhinitis",
];
