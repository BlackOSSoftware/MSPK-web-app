"use client";
import React, { useState, useEffect } from 'react';

export default function TickerMarquee() {
    const [indices, setIndices] = useState([
        { symbol: "SPX", price: 6774.75, change: 0.79, isPositive: true },
        { symbol: "NDQ", price: 23685.40, change: 1.12, isPositive: true },
        { symbol: "DJI", price: 41250.80, change: -0.15, isPositive: false },
        { symbol: "VIX", price: 12.45, change: -2.30, isPositive: false },
        { symbol: "Gold", price: 2045.50, change: 0.85, isPositive: true },
        { symbol: "Oil", price: 78.20, change: -0.45, isPositive: false },
        { symbol: "BTC", price: 42500.00, change: 2.10, isPositive: true },
        { symbol: "EUR/USD", price: 1.0950, change: 0.05, isPositive: true },
    ]);

    useEffect(() => {
        const interval = setInterval(() => {
            setIndices(prev => prev.map(item => {
                const fluctuation = (Math.random() - 0.5) * (item.price * 0.0005);
                const newPrice = item.price + fluctuation;
                return { ...item, price: newPrice };
            }));
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex animate-marquee hover:pause whitespace-nowrap items-center">
            {[...indices, ...indices, ...indices, ...indices].map((item, i) => (
                <span key={i} className="flex items-center gap-1.5 mx-4 text-[10px] font-mono font-medium opacity-80 hover:opacity-100 transition-opacity cursor-default">
                    <span className={item.isPositive ? "text-emerald-400" : "text-red-400 font-bold"}>{item.symbol}</span>
                    <span className="text-foreground font-bold">{item.price.toFixed(item.price < 10 ? 4 : 2)}</span>
                    <span className={item.isPositive ? "text-emerald-500" : "text-red-500"}>{item.isPositive ? '+' : ''}{item.change}%</span>
                </span>
            ))}
        </div>
    );
}
