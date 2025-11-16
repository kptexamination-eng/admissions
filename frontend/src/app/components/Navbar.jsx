"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useRef } from "react";
import { Menu, X, ChevronDown } from "lucide-react";
import { UserButton, SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";

export default function Navbar() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const openTimeout = useRef(null);
  const closeTimeout = useRef(null);

  const groupedMenus = [
    {
      title: "About",
      links: [
        { href: "/about", label: "About" },
        { href: "/ourTeam", label: "Our Team" },
      ],
    },
    {
      title: "Downloads",
      links: [{ href: "/statistics", label: "Important Files" }],
    },
    {
      title: "Announcements",
      links: [
        { href: "/events", label: "Events" },
        { href: "/announcements", label: "Announcements" },
      ],
    },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <img src="/logo.jpg" alt="KPT Logo" className="h-16 w-auto" />
            <span className="font-bold text-lg text-blue-800">
              KPT Examinations
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6 text-gray-700 relative">
            {groupedMenus.map((group) => (
              <div
                key={group.title}
                className="relative"
                onMouseEnter={() => {
                  clearTimeout(closeTimeout.current);
                  openTimeout.current = setTimeout(() => {
                    setOpenDropdown(group.title);
                  }, 150); // slight delay before opening
                }}
                onMouseLeave={() => {
                  clearTimeout(openTimeout.current);
                  closeTimeout.current = setTimeout(() => {
                    setOpenDropdown(null);
                  }, 250); // delay before closing
                }}
              >
                <button
                  onClick={() =>
                    setOpenDropdown(
                      openDropdown === group.title ? null : group.title
                    )
                  }
                  className="flex items-center gap-1 font-medium hover:text-blue-700 transition"
                >
                  {group.title}
                  <ChevronDown
                    className={`h-4 w-4 transition-transform duration-200 ${
                      openDropdown === group.title ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {openDropdown === group.title && (
                  <div
                    className="absolute left-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-100 py-2 animate-fadeIn"
                    onMouseEnter={() => clearTimeout(closeTimeout.current)}
                    onMouseLeave={() => {
                      closeTimeout.current = setTimeout(() => {
                        setOpenDropdown(null);
                      }, 250);
                    }}
                  >
                    {group.links.map((link) =>
                      link.external ? (
                        <a
                          key={link.href}
                          href={link.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition"
                        >
                          {link.label}
                        </a>
                      ) : (
                        <Link
                          key={link.href}
                          href={link.href}
                          className={`block px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition ${
                            pathname === link.href
                              ? "bg-blue-50 text-blue-700 font-semibold"
                              : ""
                          }`}
                        >
                          {link.label}
                        </Link>
                      )
                    )}
                  </div>
                )}
              </div>
            ))}

            {/* Auth */}
            <SignedOut>
              <SignInButton mode="modal">
                <button className="bg-blue-700 text-white px-4 py-1.5 rounded-lg hover:bg-blue-800 transition">
                  Sign In
                </button>
              </SignInButton>
            </SignedOut>

            <SignedIn>
              <Link
                href="/dashboard"
                className={`font-semibold ${
                  pathname.startsWith("/admin")
                    ? "text-blue-700 underline"
                    : "text-blue-700 hover:text-blue-900"
                }`}
              >
                Dashboard
              </Link>
              <UserButton afterSignOutUrl="/" />
            </SignedIn>
          </div>

          {/* Mobile Toggle */}
          <div className="md:hidden">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="text-gray-700 hover:text-blue-700 focus:outline-none"
            >
              {menuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {menuOpen && (
        <div className="md:hidden bg-white shadow-md border-t border-gray-100 animate-fadeIn">
          <div className="px-6 py-4 space-y-4">
            {groupedMenus.map((group) => (
              <div key={group.title}>
                <button
                  onClick={() =>
                    setOpenDropdown(
                      openDropdown === group.title ? null : group.title
                    )
                  }
                  className="flex justify-between items-center w-full font-semibold text-gray-700 hover:text-blue-700 transition"
                >
                  {group.title}
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${
                      openDropdown === group.title ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {openDropdown === group.title && (
                  <div className="pl-4 mt-2 space-y-1">
                    {group.links.map((link) =>
                      link.external ? (
                        <a
                          key={link.href}
                          href={link.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block text-gray-700 hover:text-blue-700 transition"
                        >
                          {link.label}
                        </a>
                      ) : (
                        <Link
                          key={link.href}
                          href={link.href}
                          onClick={() => setMenuOpen(false)}
                          className={`block text-gray-700 hover:text-blue-700 transition ${
                            pathname === link.href
                              ? "text-blue-700 font-semibold"
                              : ""
                          }`}
                        >
                          {link.label}
                        </Link>
                      )
                    )}
                  </div>
                )}
              </div>
            ))}

            {/* Auth */}
            <div className="pt-3 border-t border-gray-200">
              <SignedOut>
                <SignInButton mode="modal">
                  <button className="w-full bg-blue-700 text-white px-4 py-2 rounded-lg hover:bg-blue-800 transition">
                    Sign In
                  </button>
                </SignInButton>
              </SignedOut>

              <SignedIn>
                <div className="flex justify-between items-center mt-2">
                  <Link
                    href="/admin"
                    onClick={() => setMenuOpen(false)}
                    className="font-semibold text-blue-700 hover:text-blue-900"
                  >
                    Dashboard
                  </Link>
                  <UserButton afterSignOutUrl="/" />
                </div>
              </SignedIn>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
