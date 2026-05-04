import Image from 'next/image';
import { cn } from '@/lib/utils';

interface UserAvatarProps {
  name: string | null | undefined;
  image: string | null | undefined;
  className?: string;
}

export function UserAvatar({ name, image, className }: UserAvatarProps) {
  const sizeClass = 'size-8';

  if (image) {
    return (
      <Image
        src={image}
        alt={name ?? 'User avatar'}
        width={32}
        height={32}
        className={cn(sizeClass, 'rounded-full object-cover', className)}
      />
    );
  }

  const initials = (name ?? '?')
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div
      className={cn(
        sizeClass,
        'rounded-full bg-primary/20 flex items-center justify-center text-xs font-semibold text-primary select-none shrink-0',
        className
      )}
    >
      {initials}
    </div>
  );
}
