// Shared so every table showing a patient's registration date (Recent
// Patients on the dashboard, the global Patients table) renders it the same
// way.
export function formatPatientDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
