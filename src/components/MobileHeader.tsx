import { Menu } from "lucide-react";

interface MobileHeaderProps {
  onMenuClick: () => void;
  title: string;
}

export function MobileHeader({ onMenuClick, title }: MobileHeaderProps) {
  return (
    <header className="md:hidden sticky top-0 z-30 bg-white border-b border-gray-200 px-4 py-4 flex items-center gap-4">
      <button
        type="button"
        onClick={onMenuClick}
        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <Menu className="w-6 h-6 text-gray-700" />
      </button>

      <h1 className="text-lg font-semibold text-gray-900 truncate">
        {title}
      </h1>
    </header>
  );
}