"use client";
import Link from 'next/link';
import { useRef, useState, useEffect, useCallback } from "react";
import styles from "./terra-product-carousel.module.css";
import { ArrowUpRightIcon } from "@heroicons/react/24/outline";
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

// Shim for BuilderLink
const BuilderLink = ({ label, href, className, style, children, linkType, targetDialogId, id, sectionId, suffix, iconLeft, iconRight, justify, hideLabel, isVisible = true }) => {
  if (!isVisible) return null;
  const normalizedSectionId = (sectionId && typeof sectionId === 'string') ? sectionId.replace(/-+$/, '') : '';
  let finalId = id || (normalizedSectionId && suffix ? normalizedSectionId + '-' + suffix : undefined);
  finalId = finalId ? finalId.replace(/-+/g, '-') : undefined;
  
  const content = (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: justify || 'center', width: '100%', height: '100%', gap: 'inherit' }}>
         {iconLeft && <span style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>{iconLeft}</span>}
         {!hideLabel && (
             <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', justifyContent: justify || 'center' }}>
                {label || children}
             </div>
         )}
         {iconRight && <span style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>{iconRight}</span>}
      </div>
  );

  if (linkType === 'dialog' && targetDialogId) {
    return (
      <a
        id={finalId}
        href="#"
        className={className}
        style={style}
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
      className={className} 
      style={style}
    >
      {content}
    </a>
  );
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

export default function TerraProductCarousel({
    categories = componentDefaults["product-carousel-terra"].categories,
    products = componentDefaults["product-carousel-terra"].products,
    sectionId,
    onUpdate,
    fullWidth,
    removePaddingLeft,
    removePaddingRight
}) {
    const scrollContainerRef = useRef(null);
    const [activeCategoryId, setActiveCategoryId] = useState(categories[0]?.id || null);
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(1);

    // Calculate which products to show based on active category
    let filteredProducts = products.filter(p => (p.categoryId === activeCategoryId || !activeCategoryId));

    if (!filteredProducts.some(p => p.visible !== false) && products.length > 0) {
        // If no visible products in this category, show the first visible product from any category
        const fallbackProduct = products.find(p => p.visible !== false) || products[0];
        filteredProducts = [fallbackProduct];
    }

    // Fix: Use a ref to hold the latest state so the callback can be stable
    const latestStateRef = useRef({ categories, products, onUpdate });
    latestStateRef.current = { categories, products, onUpdate };

    const visibleCardsString = products.map(p => p.visible).join(',');
    const visibleFilteredCardsString = filteredProducts.map(p => p.visible).join(',');

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
    }, [products.length, visibleCardsString, activeCategoryId, visibleFilteredCardsString]);

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

    const updateProduct = useCallback((index, key, value) => {
        const { products: currentProducts, onUpdate: currentOnUpdate } = latestStateRef.current;
        if (!currentOnUpdate) return;

        const newProducts = [...currentProducts];
        let updatedProduct = { ...newProducts[index], [key]: value };

        // Auto-sync image and button link properties
        if (key === 'imageUrl') updatedProduct.buttonUrl = value;
        if (key === 'buttonUrl') updatedProduct.imageUrl = value;
        if (key === 'imageLinkType') updatedProduct.buttonLinkType = value;
        if (key === 'buttonLinkType') updatedProduct.imageLinkType = value;
        if (key === 'imageTargetDialogId') updatedProduct.buttonTargetDialogId = value;
        if (key === 'buttonTargetDialogId') updatedProduct.imageTargetDialogId = value;

        newProducts[index] = updatedProduct;
        currentOnUpdate({ products: newProducts });
    }, []);

    const updateCategory = useCallback((index, key, value) => {
        const { categories: currentCategories, onUpdate: currentOnUpdate } = latestStateRef.current;
        if (!currentOnUpdate) return;

        const newCategories = [...currentCategories];
        newCategories[index] = { ...newCategories[index], [key]: value };
        currentOnUpdate({ categories: newCategories });
    }, []);

    const scrollLeft = () => {
        if (scrollContainerRef.current) {
            const container = scrollContainerRef.current;
            container.scrollBy({ left: -container.clientWidth / 2, behavior: 'smooth' });
        }
    };

    const scrollRight = () => {
        if (scrollContainerRef.current) {
            const container = scrollContainerRef.current;
            container.scrollBy({ left: container.clientWidth / 2, behavior: 'smooth' });
        }
    };

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

                    {/* Category Tabs */}
                    <div className={styles.tabsContainer}>
                        <div className={styles.scrollableTabs}>
                            <div className="tabs">
                                {categories.map((cat, index) => (
                                    <BuilderElement
                                        key={index}
                                        tagName="div"
                                        className={`tabs-button ${activeCategoryId === cat.id ? 'tabs-button-active' : ''}`}
                                        id={cat.id}
                                        sectionId={sectionId}
                                        onIdChange={(val) => undefined}
                                        elementProps={`category-${index}`}
                                        isVisible={cat.visible !== false}
                                    >
                                        <span onClick={() => setActiveCategoryId(cat.id)}>
                                            <BuilderText
                                                tagName="span"
                                                content={cat.label}
                                                onChange={(val) => undefined}
                                                sectionId={sectionId}
                                            />
                                        </span>
                                    </BuilderElement>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Carousel */}
                    <div className={`${styles.carouselContainer} ${fullWidth ? styles.fullWidthContainer : ''}`}>
                        {/* Navigation Buttons (Desktop mostly) */}
                        {totalPages > 1 && (
                            <button className={`btn btn-outline btn-icon btn-md ${styles.navButtonWrapper} ${styles.navLeft}`} onClick={scrollLeft}>
                                <ArrowUpRightIcon className="icon" style={{ transform: 'rotate(-135deg)' }} />
                            </button>
                        )}

                        <div
                            ref={scrollContainerRef}
                            className={styles.cardsWrapper}
                            style={{ justifyContent: totalPages === 1 ? 'center' : 'start' }}
                        >
                            {categories.map((cat, catIndex) => {
                                const productsInCategory = products.filter(p => p.categoryId === cat.id || (!cat.id && !p.categoryId));
                                return (
                                    <BuilderElement
                                        key={catIndex}
                                        tagName="div"
                                        className={styles.categoryGroup}
                                        id={cat.id}
                                        sectionId={sectionId}
                                        elementProps={`category-group-${catIndex}`}
                                        isVisible={activeCategoryId === cat.id || !activeCategoryId}
                                    >
                                        {productsInCategory.map((item) => {
                                            const originalIndex = products.findIndex(p => p === item);
                                            return (
                                                <BuilderElement
                                                    key={originalIndex}
                                                    tagName="div"
                                                    className={styles.itemWrapper}
                                                    id={item.cardId}
                                                    sectionId={sectionId}
                                                    onIdChange={(val) => undefined}
                                                    elementProps={`product-${originalIndex}`}
                                                    isVisible={item.visible !== false}
                                                >
                                                    <div className={styles.card}>
                                                        <div className={styles.imageContainer}>
                                                            <BuilderImage
                                                                src={item.image}
                                                                onSrcChange={(val) => undefined}
                                                                className={`${styles.productImage} imagePlaceholder-1-1 object-cover`}
                                                                id={item.imageId}
                                                                sectionId={sectionId}
                                                                isVisible={item.imageVisible !== false}
                                                                onIdChange={(val) => undefined}
                                                                onVisibilityChange={(val) => undefined}
                                                                suffix={`image-${originalIndex}`}
                                                                href={item.imageUrl || item.buttonUrl}
                                                                onHrefChange={(val) => undefined}
                                                                linkType={item.imageLinkType}
                                                                onLinkTypeChange={(val) => undefined}
                                                                targetDialogId={item.imageTargetDialogId}
                                                                onTargetDialogIdChange={(val) => undefined}
                                                            />

                                                            {/* The Action Button (Arrow) */}
                                                            {item.buttonVisible !== false && (
                                                                <div className={styles.actionButtonWrapper} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px' }}>
                                                                    <BuilderLink
                                                                        className={`btn btn-neutral btn-icon btn-sm ${styles.actionButton}`}
                                                                        href={item.buttonUrl}
                                                                        onHrefChange={(val) => undefined}
                                                                        linkType={item.buttonLinkType}
                                                                        onLinkTypeChange={(val) => undefined}
                                                                        targetDialogId={item.buttonTargetDialogId}
                                                                        onTargetDialogIdChange={(val) => undefined}
                                                                        hideLabel={true}
                                                                        iconLeft={<ArrowUpRightIcon className="icon" />}
                                                                        style={{ padding: 0, width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                                    />
                                                                </div>
                                                            )}
                                                        </div>

                                                        <div className={styles.textContent}>
                                                            <BuilderText
                                                                tagName="div"
                                                                className={`body-bold truncate-1-line ${styles.productName}`}
                                                                content={item.name}
                                                                onChange={(val) => undefined}
                                                                sectionId={sectionId}
                                                                tooltipIfTruncated={true}
                                                            />

                                                            <BuilderText
                                                                tagName="div"
                                                                className={`caption-regular truncate-2-lines ${styles.productDescription}`}
                                                                content={item.description}
                                                                onChange={(val) => undefined}
                                                                sectionId={sectionId}
                                                                tooltipIfTruncated={true}
                                                            />
                                                        </div>
                                                    </div>
                                                </BuilderElement>
                                            )
                                        })}
                                    </BuilderElement>
                                )
                            })}
                        </div>

                        {totalPages > 1 && (
                            <button className={`btn btn-outline btn-icon btn-md ${styles.navButtonWrapper} ${styles.navRight}`} onClick={scrollRight}>
                                <ArrowUpRightIcon className="icon" style={{ transform: 'rotate(45deg)' }} />
                            </button>
                        )}
                    </div>

                    {/* Simple Scroll Indicator underneath */}
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
