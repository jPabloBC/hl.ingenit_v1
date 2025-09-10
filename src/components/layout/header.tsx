"use client";

import { Button } from "@/components/ui/button";
import Logo from "@/components/ui/logo";
import Link from "next/link";
import { useState } from "react";
import { Menu, X, DollarSign, Play, Calendar } from "lucide-react";
import Image from "next/image";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray8 mt-0 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Logo variant="default" size="lg" />
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            <Link href="/book">
              <Button variant="ghost" className="text-blue1 hover:text-blue8 font-body text-sm">
                <Calendar className="h-4 w-4 mr-2" />
                Reservar
              </Button>
            </Link>
            <Link href="/pricing">
              <Button variant="ghost" className="text-blue1 hover:text-blue8 font-body text-sm">
                <DollarSign className="h-4 w-4 mr-2" />
                Precios
              </Button>
            </Link>
            <Link href="/pricing">
              <Button variant="ghost" className="text-blue1 hover:text-blue8 font-body text-sm">
                <Play className="h-4 w-4 mr-2" />
                Demo
              </Button>
            </Link>
          </div>

          {/* Desktop CTA Buttons */}
          <div className="hidden md:flex items-center space-x-3">
            <Link href="/login">
              <Button variant="ghost" className="text-blue6 hover:text-white font-body text-sm border-[1px] border-blue6 hover:bg-blue6">
                Iniciar Sesión
              </Button>
            </Link>
            <Link href="/pricing">
              <Button className="bg-blue5 hover:bg-blue6 text-white font-body text-sm px-4">
                Elegir Plan
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleMenu}
              className="p-2 text-blue1 hover:text-blue8 hover:bg-blue15 rounded-lg transition-all duration-200"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        {isMenuOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-60 z-40 md:hidden backdrop-blur-sm"
            onClick={() => setIsMenuOpen(false)}
          />
        )}

        {/* Mobile Sidebar */}
        <div className={`fixed inset-y-0 left-0 z-50 bg-white shadow-2xl transform transition-all duration-300 ease-in-out md:hidden ${
          isMenuOpen ? 'translate-x-0' : '-translate-x-full'
        } w-1/2 max-w-xs`}>
          <div className="flex flex-col h-full">
            {/* Sidebar Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray8 bg-gradient-to-r from-blue2 to-blue6">
              <div className="flex items-center space-x-2">
                <div className="w-10 h-10 flex items-center justify-center rounded-full">
                  <Image
                    src="/assets/icon_ingenIT.png"
                    alt="INGENIT Icon"
                    width={32}
                    height={32}
                    className="h-9 w-9 object-contain"
                  />
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMenuOpen(false)}
                className="text-white hover:bg-white hover:bg-opacity-20"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Navigation Links */}
            <div className="flex-1 px-4 py-6 space-y-3">
              <Link href="/book" onClick={() => setIsMenuOpen(false)}>
                <div className="flex items-center p-3 text-blue1 hover:bg-blue15 rounded-lg transition-all duration-200 hover:shadow-md">
                  <Calendar className="h-5 w-5 mr-3 text-blue8" />
                  <span className="font-semibold text-sm">Reservar</span>
                </div>
              </Link>
              
              <Link href="/pricing" onClick={() => setIsMenuOpen(false)}>
                <div className="flex items-center p-3 text-blue1 hover:bg-blue15 rounded-lg transition-all duration-200 hover:shadow-md">
                  <DollarSign className="h-5 w-5 mr-3 text-blue8" />
                  <span className="font-semibold text-sm">Precios</span>
                </div>
              </Link>
              
              <Link href="/pricing" onClick={() => setIsMenuOpen(false)}>
                <div className="flex items-center p-3 text-blue1 hover:bg-blue15 rounded-lg transition-all duration-200 hover:shadow-md">
                  <Play className="h-5 w-5 mr-3 text-blue8" />
                  <span className="font-semibold text-sm">Demo</span>
                </div>
              </Link>
            </div>

            {/* CTA Buttons */}
            <div className="p-4 border-t border-gray8 bg-gray10 space-y-4">
              <Link href="/login" onClick={() => setIsMenuOpen(false)}>
                <Button 
                  variant="outline" 
                  className="w-full justify-center text-blue8 border-blue8 hover:bg-blue8 hover:text-white font-semibold py-2 rounded-lg transition-all duration-200 mb-3"
                >
                  Iniciar Sesión
                </Button>
              </Link>
              <Link href="/pricing" onClick={() => setIsMenuOpen(false)}>
                <Button 
                  className="w-full bg-blue8 hover:bg-blue6 text-white font-semibold py-2 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  Elegir Plan
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}