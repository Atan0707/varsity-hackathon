"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAppKit, useAppKitAccount } from "@reown/appkit/react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const { open } = useAppKit();
  const { address, isConnected } = useAppKitAccount();
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  // Add the formatAddress function
  const formatAddress = (address: string | undefined) => {
    if (!address) return "";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Remove the setActiveLink related code in useEffect
  useEffect(() => {
    setMounted(true);
  }, []);

  // Add scroll event listener to change navbar appearance on scroll
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Add event listeners for wallet connection events
  useEffect(() => {
    if (typeof window !== "undefined") {
      const handleConnected = () => {
        toast.success("Wallet Connected", {
          description: "Your wallet has been connected successfully.",
          icon: "🦊",
        });
      };

      const handleDisconnected = () => {
        toast.error("Wallet Disconnected", {
          description: "Your wallet has been disconnected.",
          icon: "🔌",
        });
      };

      const handleChainChanged = () => {
        toast.info("Network Changed", {
          description: "You have switched to a different blockchain network.",
          icon: "🔄",
        });
      };

      document.addEventListener("appkit:connected", handleConnected);
      document.addEventListener("appkit:disconnected", handleDisconnected);
      document.addEventListener("appkit:chain-changed", handleChainChanged);

      return () => {
        document.removeEventListener("appkit:connected", handleConnected);
        document.removeEventListener("appkit:disconnected", handleDisconnected);
        document.removeEventListener(
          "appkit:chain-changed",
          handleChainChanged
        );
      };
    }
  }, []);

  // Handle wallet connection
  const handleConnectClick = () => {
    open();
  };

  // Close mobile menu when route changes
  useEffect(() => {
    const handleRouteChange = () => {
      if (mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener("popstate", handleRouteChange);
    return () => window.removeEventListener("popstate", handleRouteChange);
  }, [mobileMenuOpen]);

  // Update the isActive function to use pathname directly
  const isActive = (path: string) => {
    return pathname === path || pathname.startsWith(`${path}/`);
  };

  return (
    <nav
      className={`w-full py-4 bg-[rgb(256,252,228)] z-20 shadow-sm`}
    >
      <div className="container mx-auto px-6">
        <div className="flex justify-between items-center">
          {/* Left side navigation */}
          <div className="flex items-center space-x-8">
            <Link href="/" className="text-[rgba(15,45,50,255)] hover:text-[rgba(15,45,50,0.8)] font-medium">
              Home
            </Link>
            <Link href="/mintItem" className="text-[rgba(15,45,50,255)] hover:text-[rgba(15,45,50,0.8)] font-medium">
              Mint
            </Link>
            <Link href="/pool" className="text-[rgba(15,45,50,255)] hover:text-[rgba(15,45,50,0.8)] font-medium">
              Pool
            </Link>
            <Link href="#" className="text-[rgba(15,45,50,255)] hover:text-[rgba(15,45,50,0.8)] font-medium">
              Page 3
            </Link>
            <Link href="#" className="text-[rgba(15,45,50,255)] hover:text-[rgba(15,45,50,0.8)] font-medium">
              Page 4
            </Link>
            <Link href="#" className="text-[rgba(15,45,50,255)] hover:text-[rgba(15,45,50,0.8)] font-medium">
              Page 5
            </Link>
          </div>

          {/* Center logo */}
          <div className="hidden md:block absolute left-1/2 transform -translate-x-1/2">
            <Link href="/" className="flex-shrink-0">
              <span className="text-xl font-bold text-[rgba(15,45,50,255)]">
                blockgiving
              </span>
            </Link>
          </div>

          {/* Right side links/buttons */}
          <div className="flex items-center space-x-6">
            <Link href="/support" className="text-[rgba(15,45,50,255)] hover:text-[rgba(15,45,50,0.8)] font-medium">
              Support Center
            </Link>
            
            {mounted && (
              <>
                {isConnected && address ? (
                  <button
                    onClick={() => {
                      open({ view: "Account" });
                      toast("Account Details", {
                        description: "Viewing your wallet account details.",
                        icon: "👤",
                      });
                    }}
                    className="px-4 py-1.5 text-[rgba(15,45,50,255)] border border-[rgba(15,45,50,255)] rounded hover:bg-[rgba(15,45,50,0.1)] font-medium"
                  >
                    {formatAddress(address)}
                  </button>
                ) : (
                  <button
                    onClick={handleConnectClick}
                    className="px-4 py-1.5 text-[rgba(15,45,50,255)] border border-[rgba(15,45,50,255)] rounded hover:bg-[rgba(15,45,50,0.1)] font-medium"
                  >
                    Connect
                  </button>
                )}
              </>
            )}
            
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-[rgba(15,45,50,255)] hover:bg-[rgba(15,45,50,0.1)] focus:outline-none md:hidden"
              aria-expanded={mobileMenuOpen}
            >
              <span className="sr-only">Open main menu</span>
              <svg
                className={`${mobileMenuOpen ? "hidden" : "block"} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
              <svg
                className={`${mobileMenuOpen ? "block" : "hidden"} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu - kept for mobile functionality */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            className="md:hidden overflow-hidden"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <div className="px-4 pt-2 pb-3 space-y-3 bg-[rgb(256,252,228)] shadow-lg">
              <div className="flex justify-center pb-4 mb-2 border-b border-[rgba(15,45,50,0.1)]">
                <span className="text-xl font-bold text-[rgba(15,45,50,255)]">
                  blockgiving
                </span>
              </div>
              <Link
                href="/"
                className="block px-3 py-2 text-[rgba(15,45,50,255)] font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                Home
              </Link>
              <Link
                href="/mintItem"
                className="block px-3 py-2 text-[rgba(15,45,50,255)] font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                Mint
              </Link>
              <Link
                href="/pool"
                className="block px-3 py-2 text-[rgba(15,45,50,255)] font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                Pool
              </Link>
              <Link
                href="#"
                className="block px-3 py-2 text-[rgba(15,45,50,255)] font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                Page 3
              </Link>
              <Link
                href="#"
                className="block px-3 py-2 text-[rgba(15,45,50,255)] font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                Page 4
              </Link>
              <Link
                href="#"
                className="block px-3 py-2 text-[rgba(15,45,50,255)] font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                Page 5
              </Link>
              <Link
                href="#"
                className="block px-3 py-2 text-[rgba(15,45,50,255)] font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                Support Center
              </Link>
              {!isConnected && (
                <button
                  onClick={handleConnectClick}
                  className="w-full mt-2 px-4 py-2 text-[rgba(15,45,50,255)] border border-[rgba(15,45,50,255)] rounded hover:bg-[rgba(15,45,50,0.1)] font-medium"
                >
                  Connect
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}