"use client";

import { useRouter, usePathname } from "next/navigation";

import PlaceIcon from "@mui/icons-material/Place";
import HistoryIcon from "@mui/icons-material/History";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";

export default function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();

  // URL se role extract kar rahe hain
  // Example: /rider/trips → ["", "rider", "trips"]
  const segments = pathname.split("/");
  const role = segments[1]; 

  if (!role) return null; // safety

  const tabs = [
    {
      name: "Home",
      path: `/${role}/home`,
      icon: <PlaceIcon fontSize="small" />
    },
    {
      name: "Trips",
      path: `/${role}/trips`,
      icon: <HistoryIcon fontSize="small" />
    },
    {
      name: "Wallet",
      path: `/${role}/wallet`,
      icon: <AccountBalanceWalletIcon fontSize="small" />
    },
    {
      name: "Profile",
      path: `/${role}/profile`,
      icon: <AccountCircleIcon fontSize="small" />
    }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around py-2 z-50">

      {tabs.map((tab) => {
        const isActive = pathname === tab.path;

        return (
          <button
            key={tab.path}
            onClick={() => router.push(tab.path)}
            className={`flex flex-col items-center transition ${
              isActive ? "text-indigo-600" : "text-gray-400"
            }`}
          >
            {tab.icon}
            <span className="text-xs">{tab.name}</span>
          </button>
        );
      })}

    </nav>
  );
}