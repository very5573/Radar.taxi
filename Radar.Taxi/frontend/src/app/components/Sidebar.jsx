"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { useSelector } from "react-redux";

import HomeIcon from "@mui/icons-material/Home";
import SearchIcon from "@mui/icons-material/Search";
import ExploreIcon from "@mui/icons-material/Explore";
import MovieIcon from "@mui/icons-material/Movie";
import SendIcon from "@mui/icons-material/Send";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import MenuIcon from "@mui/icons-material/Menu";
import Brightness4Icon from "@mui/icons-material/Brightness4";
import Brightness7Icon from "@mui/icons-material/Brightness7";

import SidebarDropdown from "../components/slider/SidebarDropdown";
import PostDropdown from "../components/slider/PostDropdown";

const menuItems = [
  { label: "Home", icon: HomeIcon, path: "/" },
  { label: "Search", icon: SearchIcon, path: "/search" },
  { label: "Reels", icon: MovieIcon, path: "/reels" },
  { label: "Create", type: "create" },
  { label: "Messages", icon: SendIcon, path: "/messages" },
  { label: "Notifications", icon: FavoriteBorderIcon, path: "/notifications" },
  { label: "Profile", icon: AccountCircleIcon, path: "/profile" },
  { label: "More", icon: MenuIcon, type: "more" },
];

function Sidebar() {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const { user } = useSelector((state) => state.auth);

  // Apply dark mode to body and sidebar background
  useEffect(() => {
    if (darkMode) {
      document.body.classList.add("dark");
    } else {
      document.body.classList.remove("dark");
    }
  }, [darkMode]);

  return (
    <aside
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => {
        setExpanded(false);
        setMoreOpen(false);
      }}
      className={`fixed left-0 top-0 z-50 h-screen transition-all duration-300 flex flex-col
        ${expanded ? "w-64" : "w-20"}
        ${darkMode ? "bg-gray-950 text-gray-200" : "bg-white text-gray-900"} shadow-md`}
    >
      {/* Logo */}
      {/* Logo */}
<div
  className={`h-20 flex items-center justify-center border-b 
  ${darkMode ? "border-gray-800" : "border-gray-200"} pb-3`}
>
  {expanded && (
    <span
      className="text-2xl font-extrabold tracking-wide bg-clip-text text-transparent mt-2"
      style={{
        backgroundImage:
          "linear-gradient(90deg, #feda75, #fa7e1e, #d62976, #962fbf, #4f5bd5)",
      }}
    >
      Tripathi
    </span>
  )}
</div>


      {/* Menu */}
      <nav className="flex flex-col gap-2 p-3 flex-1 relative">
        {menuItems.map((item) => {
          if (item.type === "create") {
            return <PostDropdown key="create" expanded={expanded} />;
          }

          if (item.type === "more") {
            const Icon = item.icon;
            return (
              <div key="more" className="relative">
                <button
                  onClick={() => setMoreOpen((prev) => !prev)}
                  className={`flex w-full items-center gap-4 px-3 py-3 rounded-lg
                    hover:bg-gray-100 dark:hover:bg-gray-800 transition group`}
                >
                  <Icon className={`text-3xl ${darkMode ? "text-gray-300" : "text-gray-700"} group-hover:text-black dark:group-hover:text-white`} />
                  {expanded && <span className="text-sm font-medium">More</span>}
                </button>

                <SidebarDropdown open={moreOpen} setOpen={setMoreOpen} />
              </div>
            );
          }

          const Icon = item.icon;
          const isActive = pathname === item.path;

          return (
            <Link
              key={item.label}
              href={item.path}
              className={`flex items-center gap-4 px-3 py-3 rounded-lg
                ${isActive
                  ? `${darkMode ? "bg-gray-800 font-semibold" : "bg-gray-100 font-semibold"}`
                  : `hover:bg-gray-100 dark:hover:bg-gray-800`} 
                transition group`}
            >
              {item.label === "Profile" && user?.avatar ? (
                <img
                  src={user.avatar}
                  alt="avatar"
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <Icon className={`text-3xl ${darkMode ? "text-gray-300" : "text-gray-700"} group-hover:text-black dark:group-hover:text-white`} />
              )}

              {expanded && <span className="text-sm font-medium">{item.label}</span>}

              {expanded && item.badge && (
                <span className="ml-auto text-xs bg-red-500 text-white px-2 rounded-full">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Dark Mode Toggle Switch */}
      <div className="p-3 border-t transition-colors duration-300" 
           style={{ borderColor: darkMode ? "#1f2937" : "#e5e7eb" }}>
        <div
          onClick={() => setDarkMode(!darkMode)}
          className={`cursor-pointer w-14 h-7 flex items-center rounded-full p-1 
                      transition-colors duration-300 ${darkMode ? "bg-gray-700" : "bg-gray-300"}`}
        >
          <div
            className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform duration-300
                        ${darkMode ? "translate-x-7" : ""}`}
          />
        </div>
        {expanded && <span className="ml-3 text-sm font-medium">{darkMode ? "Night Mode" : "Light Mode"}</span>}
      </div>
    </aside>
  );
}

export default Sidebar;
