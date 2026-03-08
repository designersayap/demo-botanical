"use client";

import { createContext, useContext } from 'react';

// Default to '100%' to simulate full desktop width when context is missing (e.g. in Staging/Production)
export const CanvasContext = createContext({
    canvasWidth: '100%'
});

export const useCanvas = () => useContext(CanvasContext);
