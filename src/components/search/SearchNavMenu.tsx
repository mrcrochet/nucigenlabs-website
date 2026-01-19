/**
 * Search Navigation Menu
 * 
 * Hamburger menu for SearchHome page to access other app pages
 * Uses the shared AppNavMenu component
 */

import { useState } from 'react';
import { Menu } from 'lucide-react';
import AppNavMenu from '../layout/AppNavMenu';

export default function SearchNavMenu() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Hamburger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed top-4 left-4 z-30 p-2 bg-background-glass-subtle/90 backdrop-blur-sm border border-borders-subtle rounded-lg text-text-secondary hover:text-text-primary hover:bg-background-glass-medium transition-colors"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Navigation Menu Drawer */}
      <AppNavMenu 
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </>
  );
}
