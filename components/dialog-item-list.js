import Link from 'next/link';
import { ArrowRightIcon } from '@heroicons/react/24/outline';

import { componentDefaults } from "./data";
import styles from "./dialog-section.module.css";
import DialogSection from "./dialog-section";
import { createUpdateHandler } from "./component-helpers";


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

export default function DialogItemList({
    title = "Title",
    description = "Description",
    isOpen,
    onUpdate,
    sectionId,
    className = "",
    image,
    imageId,
    imageVisible,
    imageUrl,
    imageLinkType,
    imageTargetDialogId,
    items = componentDefaults["dialog-item-list"].items
}) {
    const update = createUpdateHandler(onUpdate);
    const updateItem = (index, field, value) => {
        if (!onUpdate) return;
        const newItems = [...items];
        newItems[index] = { ...newItems[index], [field]: value };
        onUpdate({ items: newItems });
    };

    const updateItemId = (index, newId) => {
        undefined;
    };

    return (
        <DialogSection
            title={title}
            description={description}
            isOpen={isOpen}

            sectionId={sectionId}
            className={className}
            image={image}
            imageId={imageId}
            imageVisible={imageVisible !== false}
            onImageVisibleChange={undefined}
            imageUrl={imageUrl}
            imageLinkType={imageLinkType}
            imageTargetDialogId={imageTargetDialogId}
        >
            <div className={styles.listContainer}>
                {items.map((item, i) => (
                    <BuilderLink
                        key={i}
                        label={item.label}
                        href={item.url}
                        className={`${styles.listItem} body-regular ${i === items.length - 1 ? styles.lastItem : ''}`}
                        sectionId={sectionId}
                        suffix={`item-${i}`}
                        id={item.itemId}
                        isVisible={item.visible !== false}
                        onVisibilityChange={(val) => undefined}
                        onIdChange={(val) => undefined}
                        justify="flex-start"
                        fullWidth={true}
                        onLabelChange={(val) => undefined}
                        onHrefChange={(val) => undefined}
                        tooltipIfTruncated={true}
                        showLinkType={false}
                        iconLeft={
                            <div className={styles.itemIcon}>
                                <BuilderImage
                                    className="imagePlaceholder-1-1"
                                    src={item.image}
                                    onSrcChange={(val) => undefined}
                                    showLinkControls={false}
                                    isVisible={item.visible !== false}
                                    sectionId={sectionId}
                                    suffix={`item-image-${i}`} />
                            </div>
                        }
                        iconRight={<ArrowRightIcon className={styles.itemArrow} />}
                    />
                ))}
            </div>
        </DialogSection>
    );
}

