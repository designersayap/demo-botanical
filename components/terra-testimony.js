"use client";
import Link from 'next/link';
import { useRef, useState, useEffect, useCallback } from "react";
import styles from "./terra-testimony.module.css";
const DEFAULT_PLACEHOLDER_IMAGE = "https://space.lunaaar.site/assets-lunar/placeholder.svg";
import { componentDefaults } from "./data";


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

export default function TestimonialTerra({
    testimonies = componentDefaults["testimonial-terra"].testimonies,
    sectionId,
    onUpdate,
    fullWidth,
    removePaddingLeft,
    removePaddingRight
}) {
    const scrollContainerRef = useRef(null);
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(1);

    // Fix: Use a ref to hold the latest state so the callback can be stable
    // (BuilderText ignores prop changes to onChange for performance, so we must provide a stable function)
    const latestStateRef = useRef({ testimonies, onUpdate });
    latestStateRef.current = { testimonies, onUpdate };

    const updateTestimony = useCallback((index, key, value) => {
        const { testimonies: currentTestimonies, onUpdate: currentOnUpdate } = latestStateRef.current;
        if (!currentOnUpdate) return;

        const newTestimonies = [...currentTestimonies];
        newTestimonies[index] = { ...newTestimonies[index], [key]: value };
        currentOnUpdate({ testimonies: newTestimonies });
    }, []);

    const updateCardId = (index, newId) => {
        undefined;
    };

    const visibleCardsString = testimonies.map(t => t.visible).join(',');

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

        // Delay calculation slightly to ensure DOM has updated
        const timer = setTimeout(calculatePages, 100);

        window.addEventListener('resize', calculatePages);
        return () => {
            window.removeEventListener('resize', calculatePages);
            clearTimeout(timer);
        };
    }, [testimonies.length, visibleCardsString]);

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
        const scrollPosition = pageIndex * viewportWidth;

        container.scrollTo({
            left: scrollPosition,
            behavior: 'smooth'
        });
    };

    const [isPaused, setIsPaused] = useState(false);

    useEffect(() => {
        const autoScrollInterval = setInterval(() => {
            if (!scrollContainerRef.current || isPaused || totalPages <= 1) return;

            const nextPage = (currentPage + 1) % totalPages;
            scrollToPage(nextPage);
        }, 5000); // 5 seconds

        return () => clearInterval(autoScrollInterval);
    }, [currentPage, totalPages, isPaused]);

    const visibleCount = testimonies.filter(t => t.visible !== false).length;
    let filteredTestimonies = testimonies;
    if (visibleCount === 0 && testimonies.length > 0) {
        // If no visible testimonies, show the first one as a fallback (minimum 1 card)
        filteredTestimonies = [testimonies[0]];
    }

    return (
        <BuilderSection
            tagName="section"
            className={styles.container}
            innerContainer={!fullWidth}
            sectionId={sectionId}
            fullWidth={fullWidth}
            removePaddingLeft={removePaddingLeft}
            removePaddingRight={removePaddingRight}

        >
            <div className="grid">
                <div className="col-mobile-4 col-tablet-8 col-desktop-12">
                    <div
                        ref={scrollContainerRef}
                        className={styles.cardsWrapper}
                        style={{ justifyContent: totalPages === 1 ? 'center' : 'start' }}
                        onMouseEnter={() => setIsPaused(true)}
                        onMouseLeave={() => setIsPaused(false)}
                    >
                        {filteredTestimonies.map((item, index) => (
                            <BuilderElement
                                key={index}
                                tagName="div"
                                className={styles.itemWrapper}
                                id={item.cardId}
                                sectionId={sectionId}
                                onIdChange={(val) => undefined}
                                elementProps={`testimony-${index}`}
                                isVisible={item.visible !== false}
                            >
                                <div className={styles.card}>
                                    <BuilderImage
                                        src={item.image}
                                        onSrcChange={(val) => undefined}
                                        className={styles.terraTestimoniImage}
                                        id={item.imageId}
                                        sectionId={sectionId}
                                        isVisible={item.imageVisible}
                                        onIdChange={(val) => undefined}
                                        onVisibilityChange={(val) => undefined}
                                        suffix={`background-${index}`}
                                        href={item.imageUrl}
                                        onHrefChange={(val) => undefined}
                                        linkType={item.imageLinkType}
                                        onLinkTypeChange={(val) => undefined}
                                        targetDialogId={item.imageTargetDialogId}
                                        onTargetDialogIdChange={(val) => undefined}
                                    />

                                    <div className={styles.terraTestimoniDescriptionCard}>
                                        <div className={styles.avatarImg}>
                                            <BuilderImage
                                                src={item.avatar}
                                                onSrcChange={(val) => undefined}
                                                className={'imagePlaceholder-1-1 object-cover'}
                                                id={item.avatarId}
                                                style={{ borderRadius: "var(--border-radius-round)" }}
                                                sectionId={sectionId}
                                                isVisible={item.avatarVisible}
                                                onIdChange={(val) => undefined}
                                                onVisibilityChange={(val) => undefined}
                                                suffix={`avatar-${index}`}
                                                href={item.avatarUrl}
                                                onHrefChange={(val) => undefined}
                                                linkType={item.avatarLinkType}
                                                onLinkTypeChange={(val) => undefined}
                                                targetDialogId={item.avatarTargetDialogId}
                                                onTargetDialogIdChange={(val) => undefined}
                                            />
                                        </div>
                                        <BuilderText
                                            tagName="div"
                                            className={`h5 truncate-1-line ${styles.name}`}
                                            content={item.name}
                                            onChange={(val) => undefined}
                                            sectionId={sectionId}
                                            tooltipIfTruncated={true}
                                        />

                                        <BuilderText
                                            tagName="div"
                                            className={`caption-regular ${styles.role}`}
                                            content={item.role}
                                            onChange={(val) => undefined}
                                            sectionId={sectionId}
                                        />

                                        <BuilderText
                                            tagName="div"
                                            className={`caption-regular truncate-3-lines ${styles.description}`}
                                            content={`“${item.description}”`}
                                            onChange={(val) => undefined}
                                            sectionId={sectionId}
                                            tooltipIfTruncated={true}
                                        />
                                    </div>
                                </div>
                            </BuilderElement>
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
    );
}
