'use client';

import { useState, useEffect, useRef } from 'react';

// A simple hook to count up to a target number smoothly
function useCountUp(target, duration = 2000) {
    const [count, setCount] = useState(0);
    const [hasAnimated, setHasAnimated] = useState(false);
    const elementRef = useRef(null);

    useEffect(() => {
        // Wait until the element is visible
        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting && !hasAnimated) {
                setHasAnimated(true);
            }
        }, { threshold: 0.1 });

        if (elementRef.current) {
            observer.observe(elementRef.current);
        }

        return () => observer.disconnect();
    }, [hasAnimated]);

    useEffect(() => {
        if (!hasAnimated) return;

        let startTime = null;
        const animateCount = (timestamp) => {
            if (!startTime) startTime = timestamp;
            const progress = timestamp - startTime;
            const percentage = Math.min(progress / duration, 1);

            // Easing function: easeOutQuart
            const easeOut = 1 - Math.pow(1 - percentage, 4);

            setCount(Math.floor(easeOut * target));

            if (progress < duration) {
                window.requestAnimationFrame(animateCount);
            } else {
                setCount(target);
            }
        };

        window.requestAnimationFrame(animateCount);
    }, [target, duration, hasAnimated]);

    return { count, elementRef };
}

export function AnimatedCounter({ target, label, prefix = '', suffix = '' }) {
    const { count, elementRef } = useCountUp(target);

    return (
        <div ref={elementRef} className="text-center p-6 bg-slate-800/50 backdrop-blur-sm rounded-3xl border border-slate-700/50 shadow-xl relative overflow-hidden group">
            {/* Decorative gradient blob */}
            <div className="absolute -top-10 -right-10 w-24 h-24 bg-green-500/20 rounded-full blur-2xl group-hover:bg-emerald-400/30 transition-colors" />

            <div className="text-4xl md:text-5xl font-extrabold text-white mb-2 tracking-tight">
                {prefix}{count.toLocaleString()}{suffix}
            </div>
            <div className="text-slate-400 font-medium uppercase tracking-wider text-sm">
                {label}
            </div>
        </div>
    );
}
