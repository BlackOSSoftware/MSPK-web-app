import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";

const TICKER_ITEMS = [
    { symbol: "NIFTY", price: "21,750.00", change: "+0.45%", isUp: true },
    { symbol: "BANKNIFTY", price: "48,150.00", change: "-0.12%", isUp: false },
    { symbol: "SENSEX", price: "72,400.00", change: "+0.60%", isUp: true },
    { symbol: "GOLD", price: "62,500.00", change: "+0.10%", isUp: true },
    { symbol: "USD/INR", price: "83.15", change: "-0.05%", isUp: false },
    { symbol: "BTC/USD", price: "45,200.00", change: "+2.5%", isUp: true },
    { symbol: "CRUDE", price: "6,100.00", change: "-1.2%", isUp: false },
];

export function MarketTicker() {
    return (
        <div className="absolute top-0 left-0 right-0 z-[40] w-full bg-background/80 dark:bg-black/60 backdrop-blur-md border-b border-border/10 dark:border-white/5 h-10 flex items-center shadow-sm overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-background to-transparent z-10"></div>
            <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none"></div>

            <div className="animate-marquee whitespace-nowrap flex gap-16 items-center w-full hover:[animation-play-state:paused] cursor-default">
                {/* Duplicate items for infinite scroll effect */}
                {[...TICKER_ITEMS, ...TICKER_ITEMS, ...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs font-medium tracking-wide">
                        <span className="text-muted-foreground font-bold">{item.symbol}</span>
                        <div className="flex items-center gap-1.5 font-mono">
                            <span className="text-foreground">{item.price}</span>
                            <span className={cn("flex items-center gap-0.5", item.isUp ? "text-green-500" : "text-red-500")}>
                                {item.isUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                                {item.change}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
