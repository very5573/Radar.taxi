import Link from "next/link";

function SidebarItem({ item, isOpen }) {
  const Icon = item.icon;

  return (
    <Link
      href={item.path}
      className="flex items-center gap-3 px-3 py-2 rounded-lg
      hover:bg-gray-100 transition"
    >
      {item.avatarUrl ? (
        <img
          src={item.avatarUrl}
          alt="avatar"
          className="w-6 h-6 rounded-full"
        />
      ) : (
        <Icon className="text-gray-700" />
      )}

      {isOpen && (
        <span className="flex-1 text-sm font-medium">
          {item.label}
        </span>
      )}

      {isOpen && item.badge && (
        <span className="text-xs bg-red-500 text-white px-2 rounded-full">
          {item.badge}
        </span>
      )}
    </Link>
  );
}

export default SidebarItem;
