import Link from 'next/link';
import styles from "./terra-footer.module.css";
const DEFAULT_PLACEHOLDER_IMAGE = "https://space.lunaaar.site/assets-lunar/placeholder.svg";
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

const SocialIcons = {
    facebook: (
        <div className={`${styles.socialIcon} icon-social-mask icon-social-facebook`} />
    ),
    twitter: (
        <div className={`${styles.socialIcon} icon-social-mask icon-social-x`} />
    ),
    instagram: (
        <div className={`${styles.socialIcon} icon-social-mask icon-social-instagram`} />
    ),
    tiktok: (
        <div className={`${styles.socialIcon} icon-social-mask icon-social-tiktok`} />
    ),
    youtube: (
        <div className={`${styles.socialIcon} icon-social-mask icon-social-youtube`} />
    ),
};

export default function FooterTerra({
    image = componentDefaults["footer-terra"].image,
    imageId,
    imageVisible,
    copyrightText = componentDefaults["footer-terra"].copyrightText,
    socialLinks = componentDefaults["footer-terra"].socialLinks,
    availableAtTitle = componentDefaults["footer-terra"].availableAtTitle,
    availableAtLinks = componentDefaults["footer-terra"].availableAtLinks,
    resourcesTitle = componentDefaults["footer-terra"].resourcesTitle,
    resourceLinks = componentDefaults["footer-terra"].resourceLinks,
    onUpdate,
    sectionId,
    fullWidth,
    removePaddingLeft,
    removePaddingRight
}) {
    const update = createUpdateHandler(onUpdate);
    const defaults = componentDefaults["footer-terra"];

    return (
        <footer className={styles.footer} id={sectionId}>
            <div className={getContainerClasses({ fullWidth, removePaddingLeft, removePaddingRight })}>
                <div className={`grid`}>
                    {/* Left Column */}
                    <div className={`col-mobile-4 col-tablet-8 col-desktop-7`}>
                        <div className={styles.leftColumn}>
                            {/* Logo */}
                            <div className={styles.logoWrapper}>
                                <BuilderImage
                                    src={image}
                                    onSrcChange={undefined}
                                    className={`${styles.image} object-contain`}
                                    id={imageId}
                                    sectionId={sectionId}
                                    isVisible={imageVisible}
                                    onIdChange={undefined}
                                    suffix="logo"
                                />
                            </div>

                            {/* Copyright */}
                            <BuilderText
                                tagName="p"
                                className={`caption-regular ${styles.copyright}`}
                                content={copyrightText || defaults.copyrightText}
                                onChange={undefined}
                                sectionId={sectionId}
                                suffix="copyright"
                            />

                            {/* Social Icons */}
                            <div className={styles.socialWrapper}>
                                {socialLinks.map((link, index) => (
                                    link.visible && (
                                        <BuilderLink
                                            key={link.id || index}
                                            id={link.id}
                                            href={link.url}
                                            isVisible={link.visible}
                                            sectionId={sectionId}
                                            onHrefChange={(val) => {
                                                const newLinks = [...socialLinks];
                                                newLinks[index].url = val;
                                                undefined(newLinks);
                                            }}
                                            onIdChange={(val) => {
                                                const newLinks = [...socialLinks];
                                                newLinks[index].id = val;
                                                undefined(newLinks);
                                            }}
                                            onVisibilityChange={(val) => {
                                                const newLinks = [...socialLinks];
                                                newLinks[index].visible = val;
                                                undefined(newLinks);
                                            }}
                                            linkType={link.linkType}
                                            targetDialogId={link.targetDialogId}
                                            onLinkTypeChange={(val) => {
                                                const newLinks = [...socialLinks];
                                                newLinks[index].linkType = val;
                                                undefined(newLinks);
                                            }}
                                            onTargetDialogIdChange={(val) => {
                                                const newLinks = [...socialLinks];
                                                newLinks[index].targetDialogId = val;
                                                undefined(newLinks);
                                            }}
                                            hideLabel={true}
                                            iconLeft={SocialIcons[link.platform] || null}
                                            className={styles.socialLink}
                                            tooltipIfTruncated={true}
                                            style={{ width: '16px', height: '16px' }}
                                            suffix={`social-${index + 1}`}
                                        />
                                    )
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Available at */}
                    <div className={`col-mobile-4 col-tablet-8 col-desktop-3`}>
                        <div className={styles.column}>
                            <BuilderText
                                tagName="p"
                                className={"body-bold truncate-1-line"}
                                content={availableAtTitle || defaults.availableAtTitle}
                                onChange={undefined}
                                sectionId={sectionId}
                                suffix="available-at-title"
                            />
                            <div className={styles.linkList}>
                                {availableAtLinks.map((link, index) => (
                                    <div key={link.id || index} className={styles.linkWrapper}>
                                        <BuilderLink
                                            id={link.id}
                                            label={link.label}
                                            href={link.url}
                                            isVisible={link.visible}
                                            showLinkType={false}
                                            sectionId={sectionId}
                                            onLabelChange={(val) => {
                                                const newLinks = [...availableAtLinks];
                                                newLinks[index].label = val;
                                                undefined(newLinks);
                                            }}
                                            onHrefChange={(val) => {
                                                const newLinks = [...availableAtLinks];
                                                newLinks[index].url = val;
                                                undefined(newLinks);
                                            }}
                                            onIdChange={(val) => {
                                                const newLinks = [...availableAtLinks];
                                                newLinks[index].id = val;
                                                undefined(newLinks);
                                            }}

                                            onVisibilityChange={(val) => {
                                                const newLinks = [...availableAtLinks];
                                                newLinks[index].visible = val;
                                                undefined(newLinks);
                                            }}
                                            justify="flex-start"
                                            iconLeft={
                                                <div className="icon-social" style={{ position: 'relative' }}>
                                                    <BuilderImage
                                                        src={link.image}
                                                        onSrcChange={(val) => {
                                                            const newLinks = [...availableAtLinks];
                                                            newLinks[index].image = val;
                                                            undefined(newLinks);
                                                        }}
                                                        id={link.imageId}
                                                        onIdChange={(val) => {
                                                            const newLinks = [...availableAtLinks];
                                                            newLinks[index].imageId = val;
                                                            undefined(newLinks);
                                                        }}
                                                        sectionId={sectionId}
                                                        suffix={`available-at-icon-${index}`}
                                                        className="object-cover"
                                                        style={{ width: '100%', height: '100%', borderRadius: 2 }}
                                                        showLinkControls={false}
                                                    />
                                                </div>
                                            }
                                            className={`${styles.linkFooter} body-regular`}
                                            suffix={`link-${index + 1}`}
                                            fullWidth={true}
                                            tooltipIfTruncated={true}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Resources */}
                    <div className={`col-mobile-4 col-tablet-8 col-desktop-2`}>
                        <div className={styles.column}>
                            <BuilderText
                                tagName="p"
                                className={"body-bold truncate-1-line"}
                                content={resourcesTitle || defaults.resourcesTitle}
                                onChange={undefined}
                                sectionId={sectionId}
                                suffix="resources-title"
                            />
                            <div className={styles.linkList}>
                                {resourceLinks.map((link, index) => (
                                    <div key={link.id || index} className={styles.linkWrapper}>
                                        <BuilderLink
                                            id={link.id}
                                            label={link.label}
                                            href={link.url}
                                            isVisible={link.visible}
                                            showLinkType={false}
                                            sectionId={sectionId}
                                            onLabelChange={(val) => {
                                                const newLinks = [...resourceLinks];
                                                newLinks[index].label = val;
                                                undefined(newLinks);
                                            }}
                                            onHrefChange={(val) => {
                                                const newLinks = [...resourceLinks];
                                                newLinks[index].url = val;
                                                undefined(newLinks);
                                            }}
                                            onIdChange={(val) => {
                                                const newLinks = [...resourceLinks];
                                                newLinks[index].id = val;
                                                undefined(newLinks);
                                            }}

                                            onVisibilityChange={(val) => {
                                                const newLinks = [...resourceLinks];
                                                newLinks[index].visible = val;
                                                undefined(newLinks);
                                            }}
                                            justify="flex-start"
                                            className={`${styles.linkFooter} body-regular`}
                                            suffix={`res-${index + 1}`}
                                            fullWidth={true}
                                            tooltipIfTruncated={true}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
