"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/mode-toggle"
import { Home, TrendingUp, BadgeDollarSign, Info, Menu, X, Mail, FileText } from "lucide-react"
import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { BrandLogo } from "@/components/layout/brand-logo"

export default function Navbar() {
    const [scrolled, setScrolled] = useState(false)
    const [mobileOpen, setMobileOpen] = useState(false)

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20)
        }
        window.addEventListener("scroll", handleScroll)
        return () => window.removeEventListener("scroll", handleScroll)
    }, [])

    const pathname = usePathname()

    const closeMobileMenu = () => {
        setMobileOpen(false)
    }

    return (
        <div className={cn(
            "fixed inset-x-0 top-0 z-50 flex justify-center w-full transition-all duration-500"
        )}>
            <header className={cn(
                "w-full border-b bg-background/78 backdrop-blur-2xl transition-all duration-500"
            )}>
                <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">

                    {/* Logo */}
                    <div id="navbar-brand-logo" className="flex items-center gap-2 flex-shrink-0">
                        <Link href="/" className="flex items-center gap-3 group" onClick={closeMobileMenu}>
                            <BrandLogo
                                imageClassName="transition-transform duration-300 group-hover:scale-105 w-6 h-6 sm:w-7 sm:h-7"
                                titleClassName="text-sm sm:text-base lg:text-lg"
                            />
                        </Link>
                    </div>

                    {/* Desktop Nav */}
                    <nav className="hidden lg:flex items-center justify-center gap-1">
                        {[
                            { label: 'Home', href: '/', icon: Home },
                            { label: 'Market', href: '/market', icon: TrendingUp },
                            { label: 'Plans', href: '/plans', icon: BadgeDollarSign },
                            { label: 'Blog', href: '/blog', icon: FileText },
                            { label: 'About', href: '/about', icon: Info },
                            { label: 'Contact', href: '/contact', icon: Mail },
                        ].map((item) => {
                            const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
                            const Icon = item.icon;

                            return (
                                <Link
                                    key={item.label}
                                    href={item.href}
                                    className={cn(
                                        "px-3 py-2 text-sm transition-all duration-300 rounded-lg inline-flex items-center gap-2 whitespace-nowrap",
                                        isActive
                                            ? "bg-primary/10 text-foreground font-semibold"
                                            : "font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                    )}
                                >
                                    <Icon className="h-4 w-4" />
                                    {item.label}
                                </Link>
                            )
                        })}
                    </nav>

                    {/* Right actions */}
                    <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                        <ModeToggle />

                        {/* ⭐ FIXED → visible only on desktop */}
                        <Link href="/login" className="hidden lg:block" onClick={closeMobileMenu}>
                            <Button variant="ghost" size="sm" className="rounded-full font-semibold hover:bg-muted text-foreground/80 whitespace-nowrap">
                                Log In
                            </Button>
                        </Link>

                        {/* ⭐ FIXED → visible only on desktop */}
                        <Link href="/trial" className="hidden lg:block" onClick={closeMobileMenu}>
                            <Button size="sm" className="relative overflow-hidden rounded-full bg-primary text-primary-foreground font-bold hover:bg-primary/90 px-4 sm:px-6 shadow-lg shadow-primary/25 group/btn whitespace-nowrap">
                                <span className="relative z-10 text-sm sm:text-base">Get Started</span>
                                <div className="absolute inset-0 -translate-x-[100%] group-hover/btn:animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                            </Button>
                        </Link>

                        {/* Mobile menu button */}
                        <Button
                            variant="outline"
                            size="icon"
                            className="lg:hidden rounded-full"
                            onClick={() => setMobileOpen((v) => !v)}
                            aria-label="Toggle navigation"
                        >
                            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                        </Button>
                    </div>
                </div>

                {/* Drawer */}
                <div
                    className={cn(
                        "lg:hidden origin-top transition-all duration-300 overflow-hidden border-t border-border/40 bg-background/90 backdrop-blur-xl px-4",
                        mobileOpen ? "max-h-96 py-4" : "max-h-0 py-0"
                    )}
                >
                    <div className="flex flex-col gap-2">
                        {[
                            { label: 'Home', href: '/', icon: Home },
                            { label: 'Market', href: '/market', icon: TrendingUp },
                            { label: 'Plans', href: '/plans', icon: BadgeDollarSign },
                            { label: 'Blog', href: '/blog', icon: FileText },
                            { label: 'About', href: '/about', icon: Info },
                            { label: 'Contact', href: '/contact', icon: Mail },
                        ].map((item) => {
                            const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
                            const Icon = item.icon;
                            return (
                                <Link
                                    key={item.label}
                                    href={item.href}
                                    className={cn(
                                        "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm sm:text-base",
                                        isActive
                                            ? "bg-primary/10 text-foreground font-semibold border border-primary/20"
                                            : "text-muted-foreground hover:text-foreground hover:bg-border/30"
                                    )}
                                    onClick={closeMobileMenu}
                                >
                                    <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                                    {item.label}
                                </Link>
                            )
                        })}

                        {/* Drawer actions */}
                        <div className="flex flex-col sm:flex-row gap-2 pt-3 mt-1 border-t border-border/40">
                            <Link href="/login" className="sm:flex-1" onClick={closeMobileMenu}>
                                <Button variant="ghost" className="w-full rounded-xl py-2.5 sm:py-2 text-sm sm:text-base">Log In</Button>
                            </Link>

                            <Link href="/trial" className="sm:flex-1" onClick={closeMobileMenu}>
                                <Button className="w-full rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 py-2.5 sm:py-2 text-sm sm:text-base">Get Started</Button>
                            </Link>
                        </div>
                    </div>
                </div>

            </header>
        </div>
    )
}
