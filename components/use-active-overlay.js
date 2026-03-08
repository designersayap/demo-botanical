import { useMemo } from 'react';

export function useActiveOverlayPosition(overlayRect) {
    return useMemo(() => {
        if (!overlayRect) return {};

        // Calculate centered position with edge clamping
        const cx = overlayRect.left + (overlayRect.width / 2);
        const halfWidthEstimate = 80; // Estimate for overlay half-width (text + buttons)
        const windowWidth = typeof window !== 'undefined' ? window.innerWidth : 1000;

        let leftPos, rightPos, transform;

        // Check if we are close to the edges
        if (cx < halfWidthEstimate + 8) {
            // Too close to left edge: Clamp to 8px
            leftPos = 8;
            rightPos = 'auto';
            transform = 'none';
        } else if (cx > windowWidth - (halfWidthEstimate + 8)) {
            // Too close to right edge: Clamp to 8px from right
            leftPos = 'auto';
            rightPos = 8;
            transform = 'none';
        } else {
            // Safe zone: Center align
            leftPos = cx;
            rightPos = 'auto';
            transform = 'translateX(-50%)';
        }

        // Y Position: Clamped to header (42px) or 24px above element
        const topPos = Math.max(overlayRect.top - 24, 42);

        return {
            position: 'fixed',
            top: topPos,
            left: leftPos,
            right: rightPos,
            zIndex: 10002,
            pointerEvents: 'auto',
            transform: transform
        };
    }, [overlayRect]);
}
