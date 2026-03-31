const COLORS = ["#1a73e8","#e37400","#188038","#a142f4","#d93025","#007b83","#c5221f","#0d652d"];

export function avatarColor(name: string): string {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) % COLORS.length;
  return COLORS[h];
}

export function initials(name: string): string {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}
