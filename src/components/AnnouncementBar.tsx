import { X } from 'lucide-react';

interface AnnouncementBarProps {
  visible: boolean;
  onClose: () => void;
}

export default function AnnouncementBar({ visible, onClose }: AnnouncementBarProps) {
  if (!visible) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[60] bg-charcoal px-4 text-center text-xs font-medium tracking-wide text-white sm:text-sm">
      {/* Fixed 36px so it matches the hardcoded `top: 36px` offset the Navbar
          uses. The copy is therefore shortened on phones — at 390px the full
          sentence wrapped to two lines and overflowed the bar. */}
      <div className="relative mx-auto flex h-9 max-w-[1280px] items-center justify-center gap-2 pr-10">
        <span className="truncate sm:hidden">
          <span className="text-gold">FREE SHIPPING</span> over ₹2,999 &nbsp;•&nbsp; <span className="text-gold">FREE HD PRINT</span>
        </span>
        <span className="hidden sm:inline">
          <span className="text-gold">FREE SHIPPING</span> on orders above ₹2,999 &nbsp;•&nbsp; <span className="text-gold">FREE HD PHOTO PRINT</span> with every frame
        </span>
        <button
          onClick={onClose}
          aria-label="Dismiss announcement"
          className="absolute right-0 grid h-9 w-9 place-items-center text-white/50 transition-colors hover:text-white"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
