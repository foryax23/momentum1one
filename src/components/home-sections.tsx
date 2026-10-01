import type { CourseOption } from "@/lib/offer-catalog";

function toSignup() {
  document.getElementById("signup")?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
}

/** "mo:pick-course" detail: a course title, or one exact campus-and-route row, where campus is the short name ("Derby"). */
export type CoursePick = string | { title: string; route: CourseOption["route"]; campus: string };

export function pickCourse(detail: CoursePick) {
  window.dispatchEvent(new CustomEvent<CoursePick>("mo:pick-course", { detail }));
  toSignup();
}
