import { avatarColor, initials } from "@/lib/utils/avatar";

interface AvatarProps { name: string; size?: number; }

export function Avatar({ name, size = 36 }: AvatarProps) {
  return (
    <div
      className="rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0"
      style={{ width: size, height: size, backgroundColor: avatarColor(name) }}
    >
      {initials(name)}
    </div>
  );
}
