"use client";

import { useEffect, useRef, useState } from "react";

export function useIdSync({ id, sectionId, suffix, onIdChange }) {
    const safeSectionId = sectionId ? String(sectionId) : '';
    const safeId = id ? String(id) : '';

    const normalizedSectionId = safeSectionId.replace(/-+$/, '') || '';
    const prefix = normalizedSectionId ? `${normalizedSectionId}-` : "";
    const generatedId = normalizedSectionId ? (suffix ? `${normalizedSectionId}-${suffix}` : `${normalizedSectionId}-element`) : undefined;
    const normalizedId = safeId.replace(/-+/g, '-') || '';
    const elementId = normalizedId || generatedId;

    const [tempId, setTempId] = useState("");
    const prevSectionIdRef = useRef(sectionId);

    useEffect(() => {
        const newTempId = (elementId && elementId.startsWith(prefix))
            ? elementId.slice(prefix.length)
            : (elementId || "");

        if (newTempId !== tempId) {
            // disable-next-line react-hooks/set-state-in-effect
            setTempId(newTempId);
        }
    }, [elementId, prefix, tempId]);

    useEffect(() => {
        const prevSectionId = prevSectionIdRef.current;
        if (prevSectionId && prevSectionId !== sectionId) {
            const oldPrefix = `${prevSectionId}-`;
            if (elementId && elementId.startsWith(oldPrefix)) {
                const suffixPart = elementId.slice(oldPrefix.length);
                const newId = `${sectionId}-${suffixPart}`;
                if (onIdChange) {
                    onIdChange(newId);
                }
            }
        }
        prevSectionIdRef.current = sectionId;
    }, [sectionId, elementId, onIdChange]);

    return {
        elementId,
        prefix,
        tempId,
        setTempId
    };
}
