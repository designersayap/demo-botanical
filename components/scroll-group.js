"use client";

import { useRef, useContext, useState, useEffect, useId } from "react";
const styles = {};;
import { Cog6ToothIcon, PaintBrushIcon } from "@heroicons/react/24/solid";

import { createPortal } from "react-dom";
import { componentLibrary } from "./component-library";
import { useActiveOverlayPosition } from "./use-active-overlay";
import { useCanvas } from "./canvas-context";


const openDialog = (id) => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('lunar:open-dialog', { detail: { id } }));
    
    // Runtime Fallback: If specific ID fails (e.g. timestamp from old data), try default dialogs
    if (id && id !== 'dialog-item-list' && id !== 'dialog-accordion') {
        window.dispatchEvent(new CustomEvent('lunar:open-dialog', { detail: { id: 'dialog-item-list' } }));
    }
  }
};

const showToast = (message, type = 'success') => {
  if (typeof window !== 'undefined') {
    // In exported files, we can use a simple alert as a fallback
    // or the user can implement their own toast listener
    alert(message);
  }
};

// Shim for BuilderSelect
const BuilderSelect = ({ label, labelContent, onLabelChange, type = 'select', name, value, onChange, className, containerClassName = 'form-group', isVisible = true, sectionId, id, onIdChange, suffix, required = false, onVisibilityChange, onRequiredChange, options = [], ...props }) => {
  if (!isVisible) return null;
  const normalizedSectionId = (sectionId && typeof sectionId === 'string') ? sectionId.replace(/-+$/, '') : '';
  const effectiveSuffix = suffix || name;
  let finalId = id || (normalizedSectionId ? normalizedSectionId + '-' + effectiveSuffix : undefined);
  finalId = finalId ? finalId.replace(/-+/g, '-') : undefined;

  if (type === 'select') {
    return (
      <div className={containerClassName}>
        {label && <label className="form-label caption-regular" htmlFor={finalId}>{label}</label>}
        <select id={finalId} name={name} className={className || 'form-select'} value={value} onChange={onChange} required={required} {...props}>
          {options.map(opt => <option key={opt.value} value={opt.value} disabled={opt.disabled}>{opt.label}</option>)}
        </select>
      </div>
    );
  }

  return (
    <div className={containerClassName}>
      <label className="form-checkbox-group" htmlFor={finalId}>
        <input type={type} id={finalId} name={name} className={className || (type === 'checkbox' ? 'form-checkbox' : 'form-radio')} checked={type === 'checkbox' || type === 'radio' ? value : undefined} onChange={onChange} required={required} {...props} />
        <span className="form-checkbox-label body-regular" dangerouslySetInnerHTML={{ __html: labelContent }} />
      </label>
    </div>
  );
};

// Shim for BuilderControlsPopover
const BuilderControlsPopover = () => null;

export default function ScrollGroup({
    sectionId,
    components = [],
    image,
    mobileImage,
    imageMobileRatio,
    scrollEffect = "parallax", // 'parallax' | 'sticky'
    enableBlur = false, // Toggle for blur effect
    disableEffects = false, // New prop to disable internal effects (for Staging/Export)
    onUpdate,
    updateComponent // passed from Canvas to render children
}) {
    const { activeElementId, setActiveElementId, activePopoverId, setActivePopoverId, localData, isStaging } = {};
    const { canvasWidth } = useCanvas();
    const fallbackId = useId();

    // Detect mobile simulation (<= 768px matches the CSS media query)
    const isMobileSimulation = (() => {
        if (!canvasWidth || canvasWidth === '100%') return false;
        const width = parseInt(canvasWidth, 10);
        return !isNaN(width) && width <= 768;
    })();
    // Fallback ID to ensure CSS selectors work even if sectionId is missing (e.g. in Export)
    const elementId = sectionId || `scroll-group-${fallbackId.replace(/:/g, '')}`;
    const isActive = activeElementId === elementId;
    const myPopoverBase = `popover-${elementId}`;
    const showSettings = activePopoverId && activePopoverId.startsWith(myPopoverBase);
    const isStyleOpen = activePopoverId === `${myPopoverBase}-style`;

    const sectionRef = useRef(null);
    const [popoverPosition, setPopoverPosition] = useState(null);
    const [overlayRect, setOverlayRect] = useState(null);

    // Desktop/Mobile Image Source Logic
    const isSticky = scrollEffect === 'sticky';
    const isStacked = scrollEffect === 'stacked';

    // Determine which image to show inline (for Builder simulation primarily)
    // If simulating mobile, show mobile image directly.
    // Otherwise show desktop image (and let CSS media query handle mobile if on real device)
    const currentImage = (isMobileSimulation && mobileImage) ? mobileImage : image;

    // Styles for Parallax (Fixed Background)
    const parallaxStyle = {
        backgroundImage: `url(${currentImage})`,
        backgroundAttachment: "fixed",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundSize: "cover",
        width: "100%",
        position: "relative"
    };

    // Styles for Sticky (Sticky Top Background)
    // Structure: Container (grid) -> Background (sticky top, z-1) + Content (relative, z1) in same cell
    const stickyContainerStyle = {
        position: "relative",
        width: '100%',
        isolation: 'isolate',
        display: 'grid',
        gridTemplateAreas: '"stack"'
    };

    const stickyBackgroundStyle = {
        gridArea: 'stack',
        position: "sticky",
        top: 0,
        height: "100vh",
        width: "100%",
        backgroundImage: `url(${currentImage})`,
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundSize: "cover",
        zIndex: -1, // Behind content
        alignSelf: 'start'
    };

    // Styles for Stacked (Sticky Component, Next Section Slides Over)
    const stackedStyle = {
        position: "relative", // Changed from sticky to relative since wrapper handles stickiness
        width: "100%",
        minHeight: "100vh", // Build height to ensure effect is visible
        backgroundImage: `url(${currentImage})`,
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundSize: "cover"
    };

    const contentStyle = {
        gridArea: 'stack',
        position: "relative",
        zIndex: 1
    };

    useEffect(() => {
        if (isActive && sectionRef.current) {
            const updatePosition = () => {
                if (sectionRef.current) {
                    const rect = sectionRef.current.getBoundingClientRect();
                    setOverlayRect(rect);
                    if (showSettings) {
                        setPopoverPosition({
                            top: rect.top,
                            left: rect.left + rect.width / 2
                        });
                    }
                }
            };
            undefined;
            window.addEventListener('scroll', updatePosition, true);
            window.addEventListener('resize', updatePosition);
            return () => {
                window.removeEventListener('scroll', updatePosition, true);
                window.removeEventListener('resize', updatePosition);
            };
        }
    }, [isActive, showSettings]);

    // Stacked Effect Logic (Blur + White Blend)
    const blurContainerRef = useRef(null);
    const whiteOverlayRef = useRef(null);

    useEffect(() => {
        // If effects are disabled (Staging/Export), do nothing
        if (disableEffects) return;

        if (!isStacked || !sectionRef.current || !enableBlur) {
            // Reset if disabled
            if (whiteOverlayRef.current) whiteOverlayRef.current.style.opacity = 0;
            if (blurContainerRef.current) blurContainerRef.current.style.filter = 'none';

            // Reset next elements (blur + background)
            if (sectionRef.current) {
                const wrapper = sectionRef.current.parentElement;
                let sibling = wrapper ? wrapper.nextElementSibling : sectionRef.current.nextElementSibling;
                let count = 0;

                while (sibling && count < 20) {
                    if (sibling.style) {
                        sibling.style.filter = '';
                        // Enforce White Background when blur is disabled
                        sibling.style.setProperty('background-color', 'var(--pb-white)', 'important');
                    }
                    sibling = sibling.nextElementSibling;
                    count++;
                }
            }
            return;
        }

        const handleScroll = () => {
            if (!sectionRef.current) return;

            // In Builder/Export, the component is likely wrapped in a div (componentWrapper or sticky wrapper).
            // So we need to check the parent's sibling to find the next section.
            const wrapper = sectionRef.current.parentElement;
            const nextElement = wrapper ? wrapper.nextElementSibling : sectionRef.current.nextElementSibling;

            if (!nextElement) return;

            const rect = nextElement.getBoundingClientRect();
            const winH = window.innerHeight;

            // Effect range:
            // Start: Top of next element is at bottom of screen (winH)
            // End: Top of next element is at 50% of screen (winH * 0.5)
            const startPoint = winH;
            const endPoint = winH * 0.5;
            const current = rect.top;

            let progress = 0;
            if (current < startPoint) {
                progress = (startPoint - current) / (startPoint - endPoint);
            }
            // Clamp 0 to 1
            progress = Math.max(0, Math.min(1, progress));

            // console.log('Scroll Group Debug:', { current, startPoint, endPoint, progress, nextElement });

            // Apply styles directly for performance
            if (whiteOverlayRef.current) {
                whiteOverlayRef.current.style.opacity = progress;
            }
            if (blurContainerRef.current) {
                // Blur from 0px to 10px
                blurContainerRef.current.style.filter = `blur(${progress * 10}px)`;
            }

            // Apply Blur Reveal to Next Component (starts blurred 10px, becomes clear 0px)
            if (nextElement && nextElement.style) {
                // Inverse progress: 1 (start) -> 0 (end)
                // Note: progress goes 0 (start/bottom) -> 1 (end/middle).
                // So at bottom (start), (1-0)*10 = 10px blur. 
                // At middle (end), (1-1)*10 = 0px blur.
                const inverseBlur = (1 - progress) * 10;
                nextElement.style.filter = `blur(${inverseBlur}px)`;
            }

            // 2. Background Transparency: For ALL subsequent siblings to ensure visual continuity
            // They should be transparent while overlapping (progress < 1) and turn white when "locked" (progress >= 1)
            let sibling = nextElement;
            const targetBg = progress >= 1 ? 'var(--pb-white)' : 'transparent';

            // Safety counter to prevent infinite loops in weird DOMs
            let count = 0;
            const MAX_SIBLINGS = 20;

            while (sibling && count < MAX_SIBLINGS) {
                if (sibling.style) {
                    // Use setProperty with 'important' to override inline styles set by React/StickyManager
                    sibling.style.setProperty('background-color', targetBg, 'important');
                    // Also ensure z-index allows seeing behind? StickyManager sets z-index: 1 for white bg.
                    // If we make it transparent, we might need to adjust z-index if it's blocking?
                    // But transparent bg should be enough.
                }
                sibling = sibling.nextElementSibling;
                count++;
            }
        };

        const scrollTarget = document.getElementById('canvas-scroll-container') || window;
        scrollTarget.addEventListener('scroll', handleScroll, { passive: true });

        // Also listen to window for resizing or if structure creates hybrid scrolling
        if (scrollTarget !== window) {
            window.addEventListener('scroll', handleScroll, { passive: true });
        }

        handleScroll(); // Initial check

        return () => {
            scrollTarget.removeEventListener('scroll', handleScroll);
            if (scrollTarget !== window) {
                window.removeEventListener('scroll', handleScroll);
            }

            // Cleanup next elements (blur + background)
            if (sectionRef.current) {
                const wrapper = sectionRef.current.parentElement;
                let sibling = wrapper ? wrapper.nextElementSibling : sectionRef.current.nextElementSibling;
                let count = 0;
                while (sibling && count < 20) {
                    if (sibling.style) {
                        sibling.style.filter = '';
                        sibling.style.backgroundColor = '';
                    }
                    sibling = sibling.nextElementSibling;
                    count++;
                }
            }
        };

    }, [isStacked, enableBlur, disableEffects]);

    const handleStyleSettingsClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isStyleOpen && sectionRef.current) {
            const rect = sectionRef.current.getBoundingClientRect();
            setPopoverPosition({ top: rect.top, left: rect.left + rect.width / 2 });
        }
        setActivePopoverId(prev => prev === `${myPopoverBase}-style` ? null : `${myPopoverBase}-style`);
    };

    const handleClick = (e) => {
        e.stopPropagation();
        setActiveElementId(elementId);
    };

    const overlayStyle = useActiveOverlayPosition(overlayRect);

    const renderOverlay = () => {
        if (!isActive || !overlayRect || typeof document === 'undefined') return null;

        return createPortal(
            <div
                className={styles.activeOverlay}
                style={overlayStyle}
            >
                <div className={styles.overlayLabel}>
                    <span className={styles.overlayIdText}>Group: #{elementId}</span>
                </div>
                <button
                    type="button"
                    className={`${styles.settingsButton} ${isStyleOpen ? styles.settingsButtonActive : ''}`}
                    onClick={handleStyleSettingsClick}
                >
                    <PaintBrushIcon className={styles.overlayIcon} />
                </button>
            </div>,
            document.body
        );
    };

    const renderChildren = () => (
        <div className={styles.parallaxContent}>
            {components.map((item) => {
                // Prioritize the component instance if passed (Export/UAT), otherwise lookup (Builder)
                const Component = item.component || Object.values(componentLibrary).flat().find(c => c.id === item.id)?.component;

                if (!Component) return null;

                // Staging Merge Logic:
                const effectiveId = item.uniqueId || item.id; // Fallback to id if uniqueId missing
                const lookupId = item.sectionId || item.uniqueId;
                const stagingOverride = localData ? (localData[lookupId] || localData[effectiveId]) : {};

                // Robustly determine base props: handle both nested props (Builder default) and flat props (legacy/staging edge cases)
                const baseProps = item.props ? item.props : item;

                // Filter out metadata from baseProps if falling back to item (to avoid passing 'component', 'uniqueId' etc as props)
                const cleanBaseProps = item.props ? baseProps : (() => {
                    const { component, uniqueId, sectionId, id, ...rest } = baseProps;
                    return rest;
                })();

                const mergedProps = { ...cleanBaseProps, ...stagingOverride };

                return (
                    <div key={item.uniqueId} className={styles.componentWrapper}>
                        <Component
                            {...mergedProps}
                            sectionId={item.sectionId}

                        />
                    </div>
                )
            })}
        </div>
    );

    const renderPopover = () => (
        isActive && (
            <BuilderControlsPopover
                isOpen={showSettings}
                onClose={() => setActivePopoverId(null)}
                position={popoverPosition}
                mode="style"

                // Scroll Settings
                showScrollEffect={!isStaging}
                scrollEffect={scrollEffect}
                onScrollEffectChange={(val) => onUpdate({ scrollEffect: val })}

                // Image Settings (Staging Only)
                showImageSrc={isStaging}
                imageSrc={image}
                onImageSrcChange={(val) => onUpdate({ image: val })}

                showMobileRatio={false}
                mobileRatio={imageMobileRatio}
                onMobileRatioChange={(val) => onUpdate({ imageMobileRatio: val })}

                showMobileImageSrc={isStaging}
                mobileImageSrc={mobileImage}
                onMobileImageSrcChange={(val) => onUpdate({ mobileImage: val })}

                showLinkType={false}
                showVariant={false}
                showUrl={false}

                // Blur Setting (Stacked Only)
                showBlurToggle={scrollEffect === 'stacked'}
                enableBlur={enableBlur}
                onEnableBlurChange={(val) => onUpdate({ enableBlur: val })}
            />
        )
    );

    // Mobile Image Logic
    const wrapperStart = isMobileSimulation ? '' : '@media (max-width: 768px) {';
    const wrapperEnd = isMobileSimulation ? '' : '}';

    // Debugging (Restored)
    useEffect(() => {
        if (mobileImage) {
            console.log(`[ScrollGroup Debug] ID: ${elementId} | MobileImage: ${mobileImage} | isStaging: ${isStaging}`);
        }
    }, [isStaging, mobileImage, elementId]);

    const mobileImageCss = mobileImage ? `
        ${wrapperStart}
            div[id="${elementId}"] {
                background-image: url("${mobileImage}") !important;
            }
        ${wrapperEnd}
    ` : '';

    const stickyMobileImageCss = mobileImage ? `
        ${wrapperStart}
            div[id="${elementId}-bg"] {
                background-image: url("${mobileImage}") !important;
            }
        ${wrapperEnd}
    ` : '';

    const MobileStyles = () => {
        if (!mobileImage) return null;
        const cssContent = isSticky ? stickyMobileImageCss : mobileImageCss;
        return <style dangerouslySetInnerHTML={{ __html: cssContent }} />;
    };

    if (isSticky) {
        return (
            <div
                ref={sectionRef}
                id={elementId}
                onClick={handleClick}
                className={`${styles.parallaxGroup} ${isActive ? styles.activeWrapper : ''}`}
                style={stickyContainerStyle}
            >
                <div id={`${elementId}-bg`} style={stickyBackgroundStyle} />
                <div style={contentStyle}>
                    {renderChildren()}
                </div>
                {renderOverlay()}
                {renderPopover()}
                <MobileStyles />
            </div>
        );
    }

    if (isStacked) {
        return (
            <div
                ref={sectionRef}
                id={elementId}
                onClick={handleClick}
                className={`${styles.parallaxGroup} ${isActive ? styles.activeWrapper : ''}`}
                style={stackedStyle}
            >
                {/* White Overlay for blending */}
                <div
                    ref={whiteOverlayRef}
                    className={styles.scrollGroupOverlay}
                    style={{ opacity: 0 }}
                />

                {/* Content Container to be Blurred */}
                <div
                    ref={blurContainerRef}
                    style={{
                        position: 'relative',
                        zIndex: 1,
                        width: '100%',
                        height: '100%',
                    }}
                >
                    {renderChildren()}
                </div>

                {renderOverlay()}
                {renderPopover()}
                <MobileStyles />
            </div>
        );
    }

    // Default Parallax
    return (
        <div
            ref={sectionRef}
            id={elementId}
            onClick={handleClick}
            className={`${styles.parallaxGroup} ${isActive ? styles.activeWrapper : ''}`}
            style={parallaxStyle}
        >
            {renderOverlay()}
            {renderChildren()}
            {renderPopover()}
            <MobileStyles />
        </div>
    );
}
