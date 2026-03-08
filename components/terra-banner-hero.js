import * as HeroIcons from '@heroicons/react/24/solid';
import Link from 'next/link';

import styles from "./terra-banner-hero.module.css";

import { componentDefaults } from "./data";
import { createUpdateHandler } from "./component-helpers";
import { getContainerClasses } from "./section-utils";


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

// Shim for BuilderButton
const BuilderButton = ({ label, href, className, style, children, linkType, targetDialogId, id, sectionId, suffix, iconLeft, iconRight, hideLabel, isVisible = true }) => {
  if (!isVisible) return null;
  const normalizedSectionId = (sectionId && typeof sectionId === 'string') ? sectionId.replace(/-+$/, '') : '';
  let finalId = id || (normalizedSectionId && suffix ? normalizedSectionId + '-' + suffix : undefined);
  finalId = finalId ? finalId.replace(/-+/g, '-') : undefined;

  // Resolve Icons
  const renderIcon = (icon) => {
      if (!icon) return null;
      if (typeof icon === 'string' && HeroIcons[icon]) {
          const IconComponent = HeroIcons[icon];
          return <IconComponent className="w-5 h-5" />;
      }
      return icon;
  };

  const content = (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', gap: 'inherit' }}>
         {renderIcon(iconLeft) && <span style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>{renderIcon(iconLeft)}</span>}
         {!hideLabel && (
             <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {label || children}
             </div>
         )}
         {renderIcon(iconRight) && <span style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>{renderIcon(iconRight)}</span>}
      </div>
  );

  if (linkType === 'dialog' && targetDialogId) {
    return (
      <a
        id={finalId}
        href="#"
        className={className}
        style={{ ...style, cursor: 'pointer', textDecoration: 'none' }}
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

export default function HeroTerraBanner({
    title = componentDefaults["hero-terra-banner"].title,
    subtitle = componentDefaults["hero-terra-banner"].subtitle,
    buttonText = componentDefaults["hero-terra-banner"].buttonText,
    buttonUrl = componentDefaults["hero-terra-banner"].buttonUrl,
    buttonVisible = componentDefaults["hero-terra-banner"].buttonVisible,
    buttonLinkType = "url",
    buttonTargetDialogId = componentDefaults["hero-terra-banner"].buttonTargetDialogId,
    secondaryButtonText = componentDefaults["hero-terra-banner"].secondaryButtonText,
    secondaryButtonUrl = componentDefaults["hero-terra-banner"].secondaryButtonUrl,
    secondaryButtonVisible = componentDefaults["hero-terra-banner"].secondaryButtonVisible,
    secondaryButtonLinkType = "url",
    secondaryButtonTargetDialogId = componentDefaults["hero-terra-banner"].secondaryButtonTargetDialogId,
    buttonIconLeft = componentDefaults["hero-terra-banner"].buttonIconLeft,
    buttonIconRight = componentDefaults["hero-terra-banner"].buttonIconRight,
    secondaryButtonIconLeft = componentDefaults["hero-terra-banner"].secondaryButtonIconLeft,
    secondaryButtonIconRight = componentDefaults["hero-terra-banner"].secondaryButtonIconRight,
    image = componentDefaults["hero-terra-banner"].image,
    imageId,
    imageVisible,
    imageUrl,
    imageLinkType,
    imageTargetDialogId,
    buttonStyle = "primary",
    secondaryButtonStyle = "ghost",
    buttonId,
    secondaryButtonId,
    onUpdate,
    sectionId,
    fullWidth,
    removePaddingLeft,
    removePaddingRight,
    titleVisible = true,
    subtitleVisible = true,
    titleId,
    subtitleId
}) {
    const update = createUpdateHandler(onUpdate);

    // Helper to resolve icon string to component
    // Helper to resolve icon string to component
    // Removed: BuilderButton now handles icon resolution

    const defaults = componentDefaults["hero-terra-banner"];

    const primaryButton = {
        text: buttonText || defaults.buttonText,
        url: buttonUrl || defaults.buttonUrl,
        visible: buttonVisible !== undefined ? buttonVisible : defaults.buttonVisible,
        style: buttonStyle,
        linkType: buttonLinkType,
        targetDialogId: buttonTargetDialogId,
        id: buttonId
    };

    const secondaryButton = {
        text: secondaryButtonText || defaults.secondaryButtonText,
        url: secondaryButtonUrl || defaults.secondaryButtonUrl,
        visible: secondaryButtonVisible !== undefined ? secondaryButtonVisible : defaults.secondaryButtonVisible,
        style: secondaryButtonStyle,
        linkType: secondaryButtonLinkType,
        targetDialogId: secondaryButtonTargetDialogId,
        id: secondaryButtonId
    };

    return (
        <main className={`${styles.hero} imagePlaceholder-5-4`} id={sectionId}>
            <div className={styles.backgroundImage}>
                <BuilderImage
                    src={image || defaults.image}
                    onSrcChange={undefined}
                    className={`${styles.image} object-cover`}
                    id={imageId}
                    sectionId={sectionId}
                    isVisible={imageVisible}
                    onIdChange={undefined}
                    suffix="image"
                    href={imageUrl}
                    onHrefChange={undefined}
                    linkType={imageLinkType}
                    onLinkTypeChange={undefined}
                    targetDialogId={imageTargetDialogId}
                    onTargetDialogIdChange={undefined}
                />
            </div>
            <div className={styles.overlay}>
                <div className={`${getContainerClasses({ fullWidth, removePaddingLeft, removePaddingRight })} ${styles.fullHeight}`}>
                    <div className={`grid ${styles.fullHeight}`}>
                        <div className={`col-mobile-4 col-tablet-8 col-desktop-12 ${styles.content}`}>
                            {titleVisible && (
                                <BuilderText
                                    tagName="h1"
                                    className={`h1 ${styles.heroTitle}`}
                                    content={title || defaults.title}
                                    onChange={undefined}
                                    sectionId={sectionId}
                                    id={titleId}
                                    suffix="title"
                                    onIdChange={undefined}
                                />
                            )}
                            {subtitleVisible && (
                                <BuilderText
                                    tagName="p"
                                    className={`subheader-h1 ${styles.heroSubtitle}`}
                                    content={subtitle || defaults.subtitle}
                                    onChange={undefined}
                                    sectionId={sectionId}
                                    id={subtitleId}
                                    suffix="subtitle"
                                    onIdChange={undefined}
                                />
                            )}
                            <div className="buttonWrapperCenter">
                                {primaryButton.visible && (
                                    <BuilderButton
                                        label={primaryButton.text}
                                        href={primaryButton.url}
                                        isVisible={primaryButton.visible}
                                        sectionId={sectionId}
                                        className={`btn btn-${primaryButton.style} btn-lg`}
                                        iconLeft={buttonIconLeft}
                                        iconRight={buttonIconRight}
                                        onLabelChange={undefined}
                                        onHrefChange={undefined}
                                        onVisibilityChange={undefined}
                                        onVariantChange={undefined}
                                        linkType={primaryButton.linkType}
                                        onLinkTypeChange={undefined}
                                        targetDialogId={primaryButton.targetDialogId}
                                        onTargetDialogIdChange={undefined}
                                        onIconLeftChange={undefined}
                                        onIconRightChange={undefined}
                                        id={primaryButton.id}
                                        onIdChange={undefined}
                                        suffix="button"
                                    />
                                )}
                                {secondaryButton.visible && (
                                    <BuilderButton
                                        label={secondaryButton.text}
                                        href={secondaryButton.url}
                                        isVisible={secondaryButton.visible}
                                        sectionId={sectionId}
                                        className={`btn btn-${secondaryButton.style} btn-lg`}
                                        onLabelChange={undefined}
                                        onHrefChange={undefined}
                                        onVisibilityChange={undefined}
                                        onVariantChange={undefined}
                                        linkType={secondaryButton.linkType}
                                        onLinkTypeChange={undefined}
                                        targetDialogId={secondaryButton.targetDialogId}
                                        onTargetDialogIdChange={undefined}
                                        iconLeft={secondaryButtonIconLeft}
                                        iconRight={secondaryButtonIconRight}
                                        onIconLeftChange={undefined}
                                        onIconRightChange={undefined}
                                        id={secondaryButton.id}
                                        onIdChange={undefined}
                                        suffix="secondary-button"
                                    />
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
