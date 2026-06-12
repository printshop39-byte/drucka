import { X } from 'lucide-react';

interface AnnouncementBarProps {
  visible: boolean;
  onClose: () => void;
}

export default function AnnouncementBar({ visible, onClose }: AnnouncementBarProps) {
  if (!visible) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[60] bg-charcoal text-white text-center py-2.5 px-4 text-xs sm:text-sm font-medium tracking-wide">
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 relative">
        <span>
          <span className="text-gold">FREE SHIPPING</span> on orders above ₹2,999 &nbsp;•&nbsp; <span className="text-gold">FREE GICLÉE PRINT</span> with every frame
        </span>
        <button
          onClick={onClose}
          className="absolute right-0 text-white/50 hover:text-white transition-colors"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
