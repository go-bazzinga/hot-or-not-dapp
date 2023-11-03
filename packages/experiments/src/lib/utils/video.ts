import type { UpDownPost } from '$lib/helpers/db.type'

export function joinArrayUniquely(
  a: UpDownPost[],
  b: UpDownPost[],
): UpDownPost[] {
  b.forEach((o) => {
    const duplicates = a.findIndex((v) => v.oid === o.oid && v.ouid === o.ouid)
    if (duplicates < 0) {
      a.push(o)
    }
  })
  return a
}
