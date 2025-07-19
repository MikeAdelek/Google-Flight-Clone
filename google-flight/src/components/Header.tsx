import React, { useState } from "react";
import { Menu, X } from "lucide-react";

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <>
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl sm:text-2xl font-bold text-blue-600">
                FlightSearch
              </h1>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-8">
              <a
                href="#"
                className="text-gray-700 hover:text-blue-600 transition-colors"
              >
                Flights
              </a>
              <a
                href="#"
                className="text-gray-700 hover:text-blue-600 transition-colors"
              >
                Hotels
              </a>
              <a
                href="#"
                className="text-gray-700 hover:text-blue-600 transition-colors"
              >
                Cars
              </a>
              <a
                href="#"
                className="text-gray-700 hover:text-blue-600 transition-colors"
              >
                Packages
              </a>
            </nav>

            {/* Mobile Menu Button */}
            <button
              onClick={toggleMenu}
              className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-blue-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>

          {/* Mobile Navigation */}
          {isMenuOpen && (
            <div className="md:hidden border-t border-gray-200 py-4">
              <div className="flex flex-col space-y-3">
                <a
                  href="/"
                  className="text-gray-700 hover:text-blue-600 hover:bg-gray-50 px-3 py-2 rounded-md transition-colors"
                >
                  Flights
                </a>
                <a
                  href="#"
                  className="text-gray-700 hover:text-blue-600 hover:bg-gray-50 px-3 py-2 rounded-md transition-colors"
                >
                  Hotels
                </a>
                <a
                  href="#"
                  className="text-gray-700 hover:text-blue-600 hover:bg-gray-50 px-3 py-2 rounded-md transition-colors"
                >
                  Cars
                </a>
                <a
                  href="#"
                  className="text-gray-700 hover:text-blue-600 hover:bg-gray-50 px-3 py-2 rounded-md transition-colors"
                >
                  Packages
                </a>
              </div>
            </div>
          )}
        </div>
      </header>
    </>
  );
};

export default Header;
