// src/utils/noticeUtils.ts

export interface Visibility {
  general?: boolean;
  role?: string;
  department?: string;
  class?: string;
  batch?: string;
}

export interface Notice {
  _id: string;
  title?: string;
  content: string;
  createdAt?: string;
  visibility?: Visibility;
}

export function formatDate(iso?: string): string {
  if (!iso) return "";
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  });
}

/** Returns true when a notice is a general/broadcast notice (visibility.general === true). */
export function isGeneralNotice(notice: Notice): boolean {
  return notice.visibility?.general === true;
}

/**
 * Returns true if the notice should be visible to the given user.
 * Rules:
 *  - visibility.general === true → always visible to everyone
 *  - visibility.role present and doesn't match user.role → hidden
 *  - visibility.department present and user has department → must match
 *  - visibility.class present and user has class → must match
 *  - visibility.batch present and user has batch → must match
 *  - Missing user fields are non-restrictive (treat as matching)
 */
export function isNoticeVisible(notice: Notice, user: Record<string, string>): boolean {
  const v = notice.visibility;
  if (!v) return true;

  // General notices are visible to everyone
  if (v.general === true) return true;

  // Role check
  if (v.role && user.role && v.role !== user.role) return false;

  // Department check (only restrictive if both sides present)
  if (v.department && user.department && v.department !== user.department) return false;

  // Class check
  if (v.class && user.class && v.class !== user.class) return false;

  // Batch check
  if (v.batch && user.batch && v.batch !== user.batch) return false;

  return true;
}

export interface NoticeGroups {
  general: Notice[];
  department: Notice[];
  class: Notice[];
  batch: Notice[];
}

/** Assign each notice to exactly one group based on the visibility hierarchy. */
export function groupNotices(notices: Notice[]): NoticeGroups {
  const general: Notice[] = [];
  const department: Notice[] = [];
  const cls: Notice[] = [];
  const batch: Notice[] = [];

  for (const n of notices) {
    const v = n.visibility;
    if (!v || v.general === true) {
      general.push(n);
    } else if (v.batch) {
      batch.push(n);
    } else if (v.class) {
      cls.push(n);
    } else if (v.department) {
      department.push(n);
    } else {
      general.push(n);
    }
  }

  return { general, department, class: cls, batch };
}

/** Group notices by visibility.class value for teacher dashboard */
export function groupByClass(notices: Notice[]): Record<string, Notice[]> {
  const groups: Record<string, Notice[]> = {};
  for (const n of notices) {
    const key = n.visibility?.class || "__general__";
    if (!groups[key]) groups[key] = [];
    groups[key].push(n);
  }
  return groups;
}

export interface TeacherNoticeGroups {
  general: Notice[];
  batch: Notice[];
  byClass: Record<string, Notice[]>;
  department: Notice[];
  other: Notice[];
}

/**
 * Group notices into teacher-friendly categories.
 * Priority: general → batch → class (sub-grouped by value) → department → other
 */
export function groupNoticesForTeacher(notices: Notice[]): TeacherNoticeGroups {
  const general: Notice[] = [];
  const batch: Notice[] = [];
  const byClass: Record<string, Notice[]> = {};
  const department: Notice[] = [];
  const other: Notice[] = [];

  for (const n of notices) {
    const v = n.visibility;
    if (!v || v.general === true) {
      general.push(n);
    } else if (v.batch) {
      batch.push(n);
    } else if (v.class) {
      if (!byClass[v.class]) byClass[v.class] = [];
      byClass[v.class].push(n);
    } else if (v.department) {
      department.push(n);
    } else {
      other.push(n);
    }
  }

  return { general, batch, byClass, department, other };
}

export const dummyNotices: Notice[] = [
  {
    _id: "g1",
    title: "Welcome to the Portal",
    content: "Stay updated with the latest notices and announcements from your institution.",
    createdAt: new Date().toISOString(),
    visibility: { general: true }
  },
  {
    _id: "g2",
    title: "Holiday Notice",
    content: "The institute will remain closed on April 14th on account of a national holiday.",
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    visibility: { general: true }
  },
  {
    _id: "s1",
    title: "Assignment Submission",
    content: "Submit your assignments before Friday 5 PM via the student portal.",
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    visibility: { role: "student", department: "IT", class: "FE" }
  },
  {
    _id: "s2",
    title: "Lab Schedule Update",
    content: "The lab schedule for SE batch A has been updated. Please check the notice board.",
    createdAt: new Date(Date.now() - 259200000).toISOString(),
    visibility: { role: "student", department: "IT", class: "SE", batch: "A" }
  },
  {
    _id: "f1",
    title: "Faculty Meeting",
    content: "All IT department faculty members are requested to attend the meeting on Monday at 10 AM.",
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    visibility: { role: "faculty", department: "IT" }
  }
];
