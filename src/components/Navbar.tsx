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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const isActive = (path: string) => {
    return pathname === path || pathname.startsWith(`${path}/`);
  };

  return (
    <nav
      className={`w-full py-2 md:py-4 bg-[rgb(256,252,228)] z-20 fixed top-0 border-b border-[rgba(15,45,50,0.1)]`}
    >
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex justify-between items-center h-14 md:h-16">
          {/* Left side navigation */}
          <div className="hidden lg:flex items-center space-x-8">
            <Link
              href="/"
              className={`text-[rgba(15,45,50,255)] hover:text-[rgba(15,45,50,0.8)] font-medium transition-colors pb-1
                ${pathname === "/" ? "border-b-[3px] border-[rgba(15,45,50,255)]" : ""}`}
            >
              Home
            </Link>
            <Link
              href="/pool"
              className={`text-[rgba(15,45,50,255)] hover:text-[rgba(15,45,50,0.8)] font-medium transition-colors pb-1
                ${pathname === "/pool" ? "border-b-[3px] border-[rgba(15,45,50,255)]" : ""}`}
            >
              Pool
            </Link>
            <Link
              href="/dao"
              className={`text-[rgba(15,45,50,255)] hover:text-[rgba(15,45,50,0.8)] font-medium transition-colors pb-1
                ${pathname === "/dao" ? "border-b-[3px] border-[rgba(15,45,50,255)]" : ""}`}
            >
              DAO
            </Link>
            <Link
              href="/mintItem"
              className={`text-[rgba(15,45,50,255)] hover:text-[rgba(15,45,50,0.8)] font-medium transition-colors pb-1
                ${pathname === "/mintItem" ? "border-b-[3px] border-[rgba(15,45,50,255)]" : ""}`}
            >
              Mint
            </Link>
          </div>

          {/* Center logo */}
          <div className="flex lg:absolute lg:left-1/2 lg:transform lg:-translate-x-1/2">
            <Link href="/" className="flex-shrink-0 group">
              <span className="text-xl md:text-2xl font-bold text-[rgba(15,45,50,255)] group-hover:text-[rgba(15,45,50,0.8)] transition-colors">
                GlassFund
              </span>
            </Link>
          </div>

          {/* Right side links/buttons */}
          <div className="flex items-center space-x-4 md:space-x-6">
            <div className="hidden lg:block">
              <Link
                href="/"
                className={`text-[rgba(15,45,50,255)] hover:text-[rgba(15,45,50,0.8)] font-medium transition-colors pb-1
                  ${pathname === "/support" ? "border-b-[3px] border-[rgba(15,45,50,255)]" : ""}`}
              >
                Support Center
              </Link>
            </div>

            {mounted && (
              <div className="hidden lg:block">
                {isConnected && address ? (
                  <button
                    onClick={() => {
                      open({ view: "Account" });
                      toast("Account Details", {
                        description: "Viewing your wallet account details.",
                        icon: "👤",
                      });
                    }}
                    className="px-4 py-1.5 text-[rgba(15,45,50,255)] border border-[rgba(15,45,50,255)] rounded-lg 
                      hover:bg-[rgba(15,45,50,0.1)] font-medium transition-colors"
                  >
                    {formatAddress(address)}
                  </button>
                ) : (
                  <button
                    onClick={handleConnectClick}
                    className="px-4 py-1.5 text-[rgba(15,45,50,255)] border border-[rgba(15,45,50,255)] rounded-lg 
                      hover:bg-[rgba(15,45,50,0.1)] font-medium transition-colors"
                  >
                    Connect
                  </button>
                )}
              </div>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-[rgba(15,45,50,255)] 
                hover:bg-[rgba(15,45,50,0.1)] focus:outline-none lg:hidden transition-colors"
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

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            className="fixed inset-0 top-[57px] bg-[rgb(256,252,228)] z-50 md:hidden"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <div className="flex flex-col h-full px-4 pt-4 pb-20 overflow-y-auto">
              <div className="space-y-4">
                <Link
                  href="/"
                  className="block px-4 py-3 text-[rgba(15,45,50,255)] font-medium text-lg hover:bg-[rgba(15,45,50,0.1)] rounded-lg"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Home
                </Link>
                <Link
                  href="/pool"
                  className="block px-4 py-3 text-[rgba(15,45,50,255)] font-medium text-lg hover:bg-[rgba(15,45,50,0.1)] rounded-lg"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Pool
                </Link>
                <Link
                  href="/dao"
                  className="block px-4 py-3 text-[rgba(15,45,50,255)] font-medium text-lg hover:bg-[rgba(15,45,50,0.1)] rounded-lg"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  DAO
                </Link>
                <Link
                  href="/mintItem"
                  className="block px-4 py-3 text-[rgba(15,45,50,255)] font-medium text-lg hover:bg-[rgba(15,45,50,0.1)] rounded-lg"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Mint
                </Link>
                <Link
                  href="/"
                  className="block px-4 py-3 text-[rgba(15,45,50,255)] font-medium text-lg hover:bg-[rgba(15,45,50,0.1)] rounded-lg"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Support Center
                </Link>
              </div>

              {/* Mobile Connect Button */}
              <div className="mt-8 px-4">
                {mounted && !isConnected && (
                  <button
                    onClick={() => {
                      handleConnectClick();
                      setMobileMenuOpen(false);
                    }}
                    className="w-full py-3 text-[rgba(15,45,50,255)] border-2 border-[rgba(15,45,50,255)] rounded-lg hover:bg-[rgba(15,45,50,0.1)] font-medium text-lg"
                  >
                    Connect Wallet
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}