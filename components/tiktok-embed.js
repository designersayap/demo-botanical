"use client";
import Link from 'next/link';
import { useState, useRef, useEffect, useCallback, useContext, memo } from "react";
import styles from "./tiktok-embed.module.css";
import parentStyles from "./media.module.css";
import { componentDefaults } from "./data";
import { createUpdateHandler } from "./component-helpers";
import { useIdSync } from "./use-id-sync";
import { Cog6ToothIcon, VideoCameraIcon } from "@heroicons/react/24/solid";
import { createPortal } from "react-dom";
import { useActiveOverlayPosition } from "./use-active-overlay";
const builderStyles = {};;


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

// Shim for BuilderSection
const BuilderSection = ({ tagName = 'div', className, innerContainer, fullWidth, style, children, id, sectionId, isVisible = true }) => {
  if (!isVisible) return null;
  const Tag = tagName;
  const normalizedSectionId = (sectionId && typeof sectionId === 'string') ? sectionId.replace(/-+$/, '') : '';
  let finalId = id || normalizedSectionId;
  finalId = finalId ? finalId.replace(/-+/g, '-') : undefined;
  const containerClass = `container-grid ${fullWidth ? 'container-full' : ''}`;
  
  if (innerContainer) {
    return (
      <Tag id={finalId} className={className} style={style}>
        <div className={containerClass}>
          {children}
        </div>
      </Tag>
    );
  }

  return <Tag id={finalId} className={`${containerClass} ${className || ''}`} style={style}>{children}</Tag>;
};

// Shim for BuilderText
const BuilderText = ({ tagName = 'p', content, className, style, children, id, sectionId, suffix, isVisible = true }) => {
  if (!isVisible) return null;
  const Tag = tagName;
  const normalizedSectionId = (sectionId && typeof sectionId === 'string') ? sectionId.replace(/-+$/, '') : '';
  const effectiveSuffix = suffix || (className ? className.split(' ')[0] : tagName);
  let finalId = id || (normalizedSectionId ? normalizedSectionId + '-' + effectiveSuffix : undefined);
  finalId = finalId ? finalId.replace(/-+/g, '-') : undefined;

  // Append builder-text class
  const finalClassName = `builder-text ${className || ''}`.trim();

  if (content) {
    return <Tag id={finalId} className={finalClassName} style={style} dangerouslySetInnerHTML={{ __html: content }} />;
  }
  return <Tag id={finalId} className={finalClassName} style={style}>{children}</Tag>;
};

const BuilderImage = ({ src, mobileSrc, alt, className, style, mobileRatio, href, linkType, targetDialogId, id, sectionId, suffix, isPortrait, isVisible = true }) => {
  if (!isVisible) return null;
  const normalizedSectionId = (sectionId && typeof sectionId === 'string') ? sectionId.replace(/-+$/, '') : '';
  let finalId = id || (normalizedSectionId && suffix ? normalizedSectionId + '-' + suffix : undefined);
  finalId = finalId ? finalId.replace(/-+/g, '-') : undefined;
  const effectiveAlt = (!alt || alt === '#') && normalizedSectionId ? normalizedSectionId : (alt || '');
  let finalClassName = className || '';
  
  if (isPortrait === true || String(isPortrait) === 'true') {
    const portraitMap = {
        'imagePlaceholder-4-3': 'imagePlaceholder-3-4',
        'imagePlaceholder-16-9': 'imagePlaceholder-9-16',
        'imagePlaceholder-21-9': 'imagePlaceholder-9-21',
        'imagePlaceholder-5-4': 'imagePlaceholder-4-5'
    };
    Object.entries(portraitMap).forEach(([landscape, portrait]) => {
        finalClassName = finalClassName.replace(landscape, portrait);
    });
  }

  if (mobileRatio) {
     finalClassName += ` mobile-aspect-${mobileRatio}`;
  }
  
  const defaultStyle = {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
  };

  const isVideoFile = (url) => url && typeof url === 'string' && url.match(/\.(mp4|webm|ogg|mov)$/i);
  const isYoutube = (url) => url && typeof url === 'string' && url.match(/^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.*$/);
  const isVimeo = (url) => url && typeof url === 'string' && url.match(/^(https?:\/\/)?(www\.)?(vimeo\.com)\/.*$/);

  const getYoutubeEmbedUrl = (url) => {
      if (!url) return '';
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
      const match = url.match(regExp);
      const id = (match && match[2].length === 11) ? match[2] : null;
      return id ? `https://www.youtube.com/embed/${id}?autoplay=1&mute=1&loop=1&playlist=${id}&controls=0` : url;
  };

  const getVimeoEmbedUrl = (url) => {
      if (!url) return '';
      const regExp = /vimeo\.com\/(\d+)/;
      const match = url.match(regExp);
      const id = match ? match[1] : null;
      return id ? `https://player.vimeo.com/video/${id}?autoplay=1&loop=1&muted=1&background=1` : url;
  };

  // Safe Image handling
  const placeholderSrc = "https://space.lunaaar.site/assets-lunar/placeholder.svg";
  const imageSrc = (src && src !== "") ? src : placeholderSrc;

  let mediaContent;
  if (isYoutube(src)) {
      mediaContent = (
          <iframe
              id={finalId}
              src={getYoutubeEmbedUrl(src)}
              className={finalClassName}
              style={{ ...defaultStyle, ...style, height: '100%', border: 'none' }}
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
              title="YouTube video"
          />
      );
  } else if (isVimeo(src)) {
      mediaContent = (
          <iframe
              id={finalId}
              src={getVimeoEmbedUrl(src)}
              className={finalClassName}
              style={{ ...defaultStyle, ...style, height: '100%', border: 'none' }}
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
              title="Vimeo video"
          />
      );
  } else if (isVideoFile(src)) {
      mediaContent = (
          <video
              id={finalId}
              className={finalClassName}
              style={{ ...defaultStyle, ...style, height: '100%' }}
              autoPlay
              loop
              muted
              playsInline
          >
              {mobileSrc && <source src={mobileSrc} media="(max-width: 767px)" />}
              <source src={src} />
              Your browser does not support the video tag.
          </video>
      );
  } else {
      mediaContent = (
        <>
          {mobileSrc && <source media="(max-width: 767px)" srcSet={mobileSrc} />}
          <img 
            id={finalId}
            src={imageSrc} 
            alt={effectiveAlt} 
            className={finalClassName} 
            style={{ ...defaultStyle, ...style }} 
          />
        </>
      );
  }

  const content = (mobileSrc && !isVideoFile(src) && !isYoutube(src) && !isVimeo(src)) ? (
     <picture style={{ display: 'contents' }}>{mediaContent}</picture>
  ) : mediaContent;

  if (href || (linkType === 'dialog' && targetDialogId)) {
    const isDialog = linkType === 'dialog' && targetDialogId;
    
    if (isDialog) {
        return (
            <a
                id={finalId}
                href="#"
                className={finalClassName}
                style={{ ...style, display: 'block', width: '100%', height: '100%', cursor: 'pointer', textDecoration: 'none' }}
                onClick={(e) => {
                     e.preventDefault();
                     openDialog(targetDialogId);
                }}
            >
                {content}
            </a>
        );
    }

    return (
      <a
         id={finalId}
         href={href || '#'} 
         className={finalClassName} 
         style={{ display: 'block', width: '100%', height: '100%', textDecoration: 'none' }}
      >
        {content}
      </a>
    );
  }

  return content;
};

// Shim for BuilderElement
const BuilderElement = ({ tagName = 'div', className, style, children, id, sectionId, elementProps, isVisible = true }) => {
  if (!isVisible) return null;
  const Tag = tagName;
  const normalizedSectionId = (sectionId && typeof sectionId === 'string') ? sectionId.replace(/-+$/, '') : '';
  const suffix = elementProps || 'element';
  let finalId = id || (normalizedSectionId ? normalizedSectionId + '-' + suffix : undefined);
  finalId = finalId ? finalId.replace(/-+/g, '-') : undefined;
  return <Tag id={finalId} className={className} style={style}>{children}</Tag>;
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

// --- Helper Functions ---
const getTikTokVideoId = (url) => {
    if (!url) return null;
    const regex = /\/(?:video|v|embed(?:[^\/]*)\/v\d|player\/v1)\/(\d+)/i;
    const match = url.match(regex);
    if (match && match[1]) return match[1];
    if (/^\d+$/.test(url)) return url;
    return null;
};

const isShortUrl = (url) => url?.includes('tiktok.com/') && (url?.includes('vt.') || url?.includes('vm.') || url?.includes('/t/'));

// --- Sub-components ---
const TikTokCard = memo(({
    item,
    index, // Original index in videos array
    displayIndex, // Index in filtered display list
    sectionId,
    videos,
    onUpdate,
    updateVideo,
    playingIndex,
    handlePlay,
}) => {
    const { elementId } = useIdSync({
        id: item.cardId,
        sectionId: sectionId,
        suffix: `video-${index}`,
        onIdChange: (val) => undefined
    });

    const {
        activeElementId,
        setActiveElementId,
        activePopoverId,
        setActivePopoverId,
    } = {};

    const isSelfActive = activeElementId === elementId;
    const myPopoverBase = `popover-${elementId}`;
    const isLinkOpen = activePopoverId === `${myPopoverBase}-link`;
    const showSettings = activePopoverId && activePopoverId.startsWith(myPopoverBase);

    const cardRef = useRef(null);
    const [overlayRect, setOverlayRect] = useState(null);
    const [popoverPosition, setPopoverPosition] = useState(null);

    useEffect(() => {
        if (isSelfActive && cardRef.current) {
            const updatePosition = () => {
                if (cardRef.current) {
                    const rect = cardRef.current.getBoundingClientRect();
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
    }, [isSelfActive, showSettings]);

    const overlayStyle = useActiveOverlayPosition(overlayRect);

    const handleLinkSettingsClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isLinkOpen && cardRef.current) {
            const rect = cardRef.current.getBoundingClientRect();
            setPopoverPosition({
                top: rect.top,
                left: rect.left + rect.width / 2
            });
        }
        setActivePopoverId(prev => prev === `${myPopoverBase}-link` ? null : `${myPopoverBase}-link`);
    };

    const videoId = getTikTokVideoId(item.videoUrl);
    const isPlayed = playingIndex === displayIndex;
    const [hasLoaded, setHasLoaded] = useState(false);
    const iframeRef = useRef(null);

    // Keep-Alive Logic: Once played, stay loaded
    useEffect(() => {
        if (isPlayed && !hasLoaded) {
            setHasLoaded(true);
        }
    }, [isPlayed, hasLoaded]);

    // Zero-Reload Playback Control via postMessage
    useEffect(() => {
        if (!hasLoaded || !iframeRef.current) return;

        const message = {
            type: isPlayed ? "play" : "pause",
            "x-tiktok-player": true
        };

        // Small delay to ensure iframe internal player is ready
        const timer = setTimeout(() => {
            if (iframeRef.current && iframeRef.current.contentWindow) {
                iframeRef.current.contentWindow.postMessage(message, "*");
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [isPlayed, hasLoaded]);

    // Auto-fetch metadata
    useEffect(() => {
        if (!item.videoUrl || item.videoUrl === item.fetchedUrl) return;

        const needsThumbnail = !item.thumbnailUrl;

        // Fetch whenever URL changes to ensure metadata (title/desc/aria-label) is in sync
        const vId = getTikTokVideoId(item.videoUrl);
        if (vId) {
            fetch(`/api/oembed?url=${encodeURIComponent(item.videoUrl)}`)
                .then(res => res.json())
                .then(data => {
                    // Update values and mark as fetched regardless of success
                    const updates = { fetchedUrl: item.videoUrl };

                    if (data) {
                        if (data.title) updates.name = data.title;

                        const author = data.author_name || 'TikTok Creator';
                        updates.description = data.description || `Video by ${author}`;

                        if (data.thumbnail_url) updates.thumbnailUrl = data.thumbnail_url;
                    }

                    // Batch update the video item
                    const newVideos = [...videos];
                    newVideos[index] = { ...newVideos[index], ...updates };
                    onUpdate({ videos: newVideos });
                })
                .catch(err => {
                    console.warn("TikTok metadata fetch failed.", err);
                    // Still mark as attempted to prevent looping
                    undefined;
                });
        }
    }, [item.videoUrl, item.fetchedUrl, index, videos, onUpdate, updateVideo]);

    return (
        <>
            <BuilderElement
                tagName="div"
                className={`${styles.itemWrapper} ${isPlayed ? styles.active : ""}`}
                id={elementId}
                sectionId={sectionId}
                onIdChange={(val) => undefined}
                elementProps={`video-${index}`}
                isVisible={item.visible !== false}
            >
                <div className={styles.card} ref={cardRef} onClick={() => setActiveElementId(elementId)}>
                    <div className={styles.videoContainer}>
                        {!item.videoUrl ? (
                            <div className={styles.emptyState}>
                                <VideoCameraIcon className={styles.emptyIcon} />
                                <p>Add TikTok URL</p>
                            </div>
                        ) : videoId ? (
                            <>
                                {/* Render Iframe if it is active OR if it has been loaded before (Keep-Alive) */}
                                {(isPlayed || hasLoaded) && videoId && (
                                    <iframe
                                        ref={iframeRef}
                                        src={`https://www.tiktok.com/player/v1/${videoId}?autoplay=1&muted=1&loop=1`}
                                        className={styles.iframe}
                                        style={{ display: isPlayed ? 'block' : 'none' }}
                                        allow="autoplay; encrypted-media; picture-in-picture"
                                        allowFullScreen
                                        title={item.name || "TikTok Video"}
                                        aria-label={item.description || item.name || "TikTok Video"}
                                    />
                                )}

                                {/* Only show facade if NOT currently playing */}
                                {!isPlayed && (
                                    <div
                                        className={styles.facade}
                                        onClick={(e) => { e.stopPropagation(); handlePlay(displayIndex); }}
                                        style={item.thumbnailUrl ? {
                                            backgroundImage: `linear-gradient(rgba(0,0,0,0.1), rgba(0,0,0,0.3)), url(${item.thumbnailUrl})`,
                                            backgroundSize: 'cover',
                                            backgroundPosition: 'center'
                                        } : {}}
                                    >
                                        <div className={styles.overlay} />
                                        <div className={styles.playButton} onClick={(e) => { e.stopPropagation(); handlePlay(displayIndex); }}>
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={styles.playIcon}>
                                                <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                    </div>
                                )}
                                {/* Indexable Semantic Content for Search Engines */}
                                <div className={styles.visuallyHidden}>
                                    <h3>{item.name || "TikTok Video"}</h3>
                                    <p>{item.description || "Watch this video on TikTok"}</p>
                                    <a href={item.videoUrl}>View original post</a>
                                </div>
                            </>
                        ) : (
                            <div className={styles.errorState}>
                                <p>Invalid TikTok URL</p>
                            </div>
                        )}
                    </div>
                </div>
            </BuilderElement>

            {isSelfActive && overlayRect && createPortal(
                <div className={builderStyles.activeOverlay} style={overlayStyle}>
                    <div className={builderStyles.overlayLabel}>
                        <span className={builderStyles.overlayIdText}>#{elementId}</span>
                    </div>
                    <button
                        type="button"
                        className={`${builderStyles.settingsButton} ${isLinkOpen ? builderStyles.settingsButtonActive : ''}`}
                        onClick={handleLinkSettingsClick}
                        data-tooltip="Video Settings"
                    >
                        <Cog6ToothIcon className={builderStyles.overlayIcon} />
                    </button>
                </div>,
                document.body
            )}

            {isSelfActive && (
                <BuilderControlsPopover
                    isOpen={showSettings}
                    onClose={() => setActivePopoverId(null)}
                    mode="style"
                    imageSrc={item.videoUrl}
                    onImageSrcChange={(val) => undefined}
                    showImageSrc={true}
                    title={item.name}
                    onTitleChange={(val) => undefined}
                    showTitle={true}
                    subtitle={item.description}
                    onSubtitleChange={(val) => undefined}
                    showSubtitle={true}
                    showUrl={false}
                    showLinkType={false}
                    showVariant={false}
                    showFullWidthToggle={false}
                    position={popoverPosition}
                />
            )}
        </>
    );
});

// --- Main Component ---
export default function TikTokEmbed({
    videos = componentDefaults["social-bridge-tiktok"].videos,
    onUpdate,
    sectionId,
    fullWidth,
    allowAutoplay = true,
    removePaddingLeft,
    removePaddingRight,
}) {
    const scrollContainerRef = useRef(null);
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [playingIndex, setPlayingIndex] = useState(allowAutoplay ? 0 : null);
    const [isInView, setIsInView] = useState(false);
    const containerRef = useRef(null);

    // Intersection Observer to detect visibility
    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => setIsInView(entry.isIntersecting),
            { threshold: 0.1 }
        );
        if (containerRef.current) observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, []);

    const update = createUpdateHandler(onUpdate);

    // Latest state ref for stable callbacks
    const latestStateRef = useRef({ videos, onUpdate });
    latestStateRef.current = { videos, onUpdate };

    const updateVideo = useCallback((index, key, value) => {
        const { videos: currentVideos, onUpdate: currentOnUpdate } = latestStateRef.current;
        if (!currentOnUpdate) return;

        const newVideos = [...currentVideos];
        newVideos[index] = { ...newVideos[index], [key]: value };
        currentOnUpdate({ videos: newVideos });
    }, []);

    const updateVideoId = (index, newId) => {
        undefined;
    };

    const visibleCount = videos.filter(v => v.visible !== false).length;
    const filteredVideos = videos
        .map((v, i) => ({ ...v, originalIndex: i }))
        .filter(v => v.visible !== false);

    let displayVideos = filteredVideos;
    if (filteredVideos.length === 0 && videos.length > 0) {
        displayVideos = [{ ...videos[0], originalIndex: 0 }];
    }

    // Ensure playingIndex is valid for displayVideos
    useEffect(() => {
        if (playingIndex !== null && playingIndex >= displayVideos.length) {
            setPlayingIndex(displayVideos.length > 0 ? 0 : null);
        }
    }, [displayVideos.length, playingIndex]);

    // Carousel Logic
    const visibleVideosString = filteredVideos.map(v => v.visible).join(',');

    useEffect(() => {
        const calculatePages = () => {
            if (!scrollContainerRef.current) return;
            const container = scrollContainerRef.current;
            const containerWidth = container.scrollWidth;
            const viewportWidth = container.clientWidth;
            if (containerWidth && viewportWidth > 0) {
                const pages = Math.ceil(containerWidth / viewportWidth);
                setTotalPages(Number.isFinite(pages) ? Math.max(1, pages) : 1);
            } else {
                setTotalPages(1);
            }
        };

        const timer = setTimeout(calculatePages, 100);
        window.addEventListener('resize', calculatePages);
        return () => {
            window.removeEventListener('resize', calculatePages);
            clearTimeout(timer);
        };
    }, [displayVideos.length, visibleVideosString]);

    useEffect(() => {
        const container = scrollContainerRef.current;
        if (!container) return;
        const handleScroll = () => {
            const scrollLeft = container.scrollLeft;
            const viewportWidth = container.clientWidth;
            const page = Math.round(scrollLeft / viewportWidth);
            setCurrentPage(page);
        };
        container.addEventListener('scroll', handleScroll);
        return () => container.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToPage = (pageIndex) => {
        if (!scrollContainerRef.current) return;
        const container = scrollContainerRef.current;
        const viewportWidth = container.clientWidth;
        container.scrollTo({
            left: pageIndex * viewportWidth,
            behavior: 'smooth'
        });
    };

    const scrollToCard = useCallback((index) => {
        if (!scrollContainerRef.current) return;
        const container = scrollContainerRef.current;
        const card = container.children[index];
        if (card) {
            const containerWidth = container.clientWidth;
            const cardWidth = card.clientWidth;
            // Calculate scroll position to center the card
            const scrollLeft = card.offsetLeft - (containerWidth / 2) + (cardWidth / 2);
            container.scrollTo({
                left: scrollLeft,
                behavior: 'smooth'
            });
        }
    }, []);

    const PLAY_INTERVAL = 30000; // Time in milliseconds between videos

    // Sequential Auto-Play Timer
    useEffect(() => {
        if (!allowAutoplay || !isInView || playingIndex === null || displayVideos.length <= 1) return;

        const interval = setInterval(() => {
            const nextIndex = (playingIndex + 1) % displayVideos.length;
            setPlayingIndex(nextIndex);
            scrollToCard(nextIndex);
        }, PLAY_INTERVAL);

        return () => clearInterval(interval);
    }, [playingIndex, filteredVideos.length, scrollToCard, allowAutoplay, isInView]);

    const handlePlay = (index) => {
        setPlayingIndex(index);
        scrollToCard(index);
    };

    // JSON-LD Generation
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "ItemList",
        "itemListElement": displayVideos.map((video, idx) => {
            const vId = getTikTokVideoId(video.videoUrl);
            return {
                "@type": "ListItem",
                "position": idx + 1,
                "item": {
                    "@type": "VideoObject",
                    "name": video.name || `TikTok Video ${idx + 1}`,
                    "description": video.description || "TikTok video content",
                    "thumbnailUrl": vId ? `https://www.tiktok.com/api/v1/thumbnail?video_id=${vId}` : "",
                    "contentUrl": video.videoUrl,
                    "embedUrl": vId ? `https://www.tiktok.com/player/v1/${vId}` : "",
                    "uploadDate": "2024-01-01T00:00:00Z" // Stable fallback
                }
            };
        })
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <BuilderSection
                tagName="section"
                className={styles.container}
                innerContainer={!fullWidth}
                sectionId={sectionId}
                fullWidth={fullWidth}
                removePaddingLeft={removePaddingLeft}
                removePaddingRight={removePaddingRight}

            >
                <div className="grid" ref={containerRef}>
                    <div className="col-mobile-4 col-tablet-8 col-desktop-12">
                        <div
                            ref={scrollContainerRef}
                            className={styles.cardsWrapper}
                            style={{ justifyContent: totalPages === 1 ? 'center' : 'start' }}
                        >
                            {displayVideos.map((item, index) => (
                                <TikTokCard
                                    key={item.originalIndex}
                                    item={item}
                                    index={item.originalIndex}
                                    displayIndex={index}
                                    sectionId={sectionId}
                                    videos={videos}

                                    updateVideo={updateVideo}
                                    playingIndex={playingIndex}
                                    handlePlay={handlePlay}
                                />
                            ))}
                        </div>

                        {totalPages > 1 && (
                            <div className="scroll-indicator-pills">
                                {Array.from({ length: totalPages }).map((_, index) => (
                                    <div
                                        key={index}
                                        className={currentPage === index ? "indicator-pill-active" : "indicator-pill"}
                                        onClick={() => scrollToPage(index)}
                                        role="button"
                                        tabIndex={0}
                                        aria-label={`Go to page ${index + 1}`}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </BuilderSection >
        </>
    );
}
