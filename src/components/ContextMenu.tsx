import React, { useEffect, useRef } from "react";
import { useStore } from "../store";
import {
  Copy,
  ClipboardPaste,
  CopyPlus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Lock,
  Unlock,
  Edit3,
} from "lucide-react";

interface ContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, onClose }) => {
  const {
    selectedIds,
    elements,
    copy,
    paste,
    duplicateSelected,
    deleteSelected,
    bringToFront,
    sendToBack,
    toggleLockSelected,
  } = useStore();

  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    // Slight delay to avoid immediately closing from the right-click event itself
    setTimeout(() => {
      document.addEventListener("click", handleClickOutside);
      document.addEventListener("contextmenu", handleClickOutside);
    }, 10);

    return () => {
      document.removeEventListener("click", handleClickOutside);
      document.removeEventListener("contextmenu", handleClickOutside);
    };
  }, [onClose]);

  if (selectedIds.length === 0) return null;

  const anyUnlocked = elements.some(
    (e) => selectedIds.includes(e.id) && !e.locked,
  );
  const hasText = elements.some(
    (e) =>
      selectedIds.includes(e.id) &&
      (e.type === "text" ||
        e.shapeType === "rectangle" ||
        e.shapeType === "circle" ||
        e.type === "shape"),
  );

  const MenuItem = ({
    icon: Icon,
    label,
    shortcut,
    onClick,
    danger = false,
  }: any) => (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
        onClose();
      }}
      className={`w-full flex items-center justify-between px-3 py-1.5 text-xs rounded hover:bg-slate-700 ${danger ? "text-red-400 hover:text-red-300 hover:bg-red-900/30" : "text-slate-200"}`}
    >
      <div className="flex items-center gap-2">
        <Icon className="w-3.5 h-3.5" />
        <span>{label}</span>
      </div>
      {shortcut && (
        <span className="text-[10px] text-slate-500">{shortcut}</span>
      )}
    </button>
  );

  const Divider = () => <div className="h-px bg-slate-700 my-1 mx-2" />;

  // Keep menu on screen
  const menuWidth = 200;
  const menuHeight = 300; // approximate
  const safeX = Math.min(x, window.innerWidth - menuWidth - 10);
  const safeY = Math.min(y, window.innerHeight - menuHeight - 10);

  return (
    <div
      ref={menuRef}
      className="fixed z-[100] w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-xl py-1"
      style={{ left: safeX, top: safeY }}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      <MenuItem icon={Copy} label="Copy" shortcut="Ctrl+C" onClick={copy} />
      <MenuItem
        icon={ClipboardPaste}
        label="Paste"
        shortcut="Ctrl+V"
        onClick={paste}
      />
      <MenuItem
        icon={CopyPlus}
        label="Duplicate"
        shortcut="Ctrl+D"
        onClick={duplicateSelected}
      />
      <MenuItem
        icon={Trash2}
        label="Delete"
        shortcut="Del"
        danger
        onClick={deleteSelected}
      />
      <Divider />
      <MenuItem
        icon={ArrowUp}
        label="Bring to Front"
        shortcut="Ctrl+Shift+↑"
        onClick={() => selectedIds.forEach(bringToFront)}
      />
      <MenuItem
        icon={ArrowDown}
        label="Send to Back"
        shortcut="Ctrl+Shift+↓"
        onClick={() => selectedIds.forEach(sendToBack)}
      />
      <Divider />
      <MenuItem
        icon={anyUnlocked ? Lock : Unlock}
        label={anyUnlocked ? "Lock" : "Unlock"}
        shortcut="Ctrl+L"
        onClick={toggleLockSelected}
      />
      {/* Edit text is handled via double click, but we can fake a double click or just leave it out as it's complex to trigger React state from here without moving edit state to store */}
    </div>
  );
};
