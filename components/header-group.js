import * as HeroIcons from '@heroicons/react/24/solid';
import Link from 'next/link';

import { componentDefaults } from "./data";
import { createUpdateHandler } from "./component-helpers";
import styles from "./header-section.module.css";
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

export default function HeaderGroup({
    title = componentDefaults["header-group"].title,
    subtitle = componentDefaults["header-group"].subtitle,
    sectionId,
    // Button props...
    buttonText = componentDefaults["header-group"].buttonText,
    buttonUrl = componentDefaults["header-group"].buttonUrl,
    buttonVisible = componentDefaults["header-group"].buttonVisible,
    buttonLinkType = componentDefaults["header-group"].buttonLinkType || "url",
    buttonTargetDialogId = componentDefaults["header-group"].buttonTargetDialogId,
    buttonIconLeft = componentDefaults["header-group"].buttonIconLeft,
    buttonIconRight = componentDefaults["header-group"].buttonIconRight,
    secondaryButtonText = componentDefaults["header-group"].secondaryButtonText,
    secondaryButtonUrl = componentDefaults["header-group"].secondaryButtonUrl,
    secondaryButtonVisible = componentDefaults["header-group"].secondaryButtonVisible,
    secondaryButtonLinkType = componentDefaults["header-group"].secondaryButtonLinkType || "url",
    secondaryButtonTargetDialogId = componentDefaults["header-group"].secondaryButtonTargetDialogId,
    secondaryButtonIconLeft = componentDefaults["header-group"].secondaryButtonIconLeft,
    secondaryButtonIconRight = componentDefaults["header-group"].secondaryButtonIconRight,
    buttonId,
    secondaryButtonId,
    buttonStyle = "primary",
    secondaryButtonStyle = "ghost",
    onUpdate,
    titleVisible = true,
    subtitleVisible = true,
    titleId,
    subtitleId
}) {
    const update = createUpdateHandler(onUpdate);

    return (
        <section className={`${styles.section}`} id={sectionId}>
            <div className={getContainerClasses({})}>
                <div className="grid">
                    <div className={`col-mobile-4 col-tablet-8 col-desktop-8 offset-desktop-2 ${styles.content}`}>
                        {subtitleVisible && (
                            <BuilderText
                                tagName="div"
                                className={`subheader-h2 ${styles.category}`}
                                style={{ marginBottom: "var(--gap-md)" }}
                                content={subtitle}
                                onChange={undefined}
                                sectionId={sectionId}
                                id={subtitleId}
                                suffix="subtitle"
                                onIdChange={undefined}
                            />
                        )}
                        {titleVisible && (
                            <BuilderText
                                tagName="h2"
                                className={`h3 ${styles.title}`}
                                style={{ marginBottom: "var(--gap-lg)" }}
                                content={title}
                                onChange={undefined}
                                sectionId={sectionId}
                                id={titleId}
                                suffix="title"
                                onIdChange={undefined}
                            />
                        )}
                        <div className="buttonWrapperCenter">
                            {buttonVisible && (
                                <BuilderButton
                                    label={buttonText}
                                    href={buttonUrl}
                                    isVisible={buttonVisible}
                                    sectionId={sectionId}
                                    className={`btn btn-${buttonStyle} btn-lg`}
                                    iconLeft={buttonIconLeft}
                                    iconRight={buttonIconRight}
                                    onLabelChange={undefined}
                                    onHrefChange={undefined}
                                    onVisibilityChange={undefined}
                                    onVariantChange={undefined}
                                    linkType={buttonLinkType}
                                    onLinkTypeChange={undefined}
                                    targetDialogId={buttonTargetDialogId}
                                    onTargetDialogIdChange={undefined}
                                    onIconLeftChange={undefined}
                                    onIconRightChange={undefined}
                                    id={buttonId}
                                    onIdChange={undefined}
                                    suffix="button"
                                />
                            )}
                            {secondaryButtonVisible && (
                                <BuilderButton
                                    label={secondaryButtonText}
                                    href={secondaryButtonUrl}
                                    isVisible={secondaryButtonVisible}
                                    sectionId={sectionId}
                                    className={`btn btn-${secondaryButtonStyle} btn-lg`}
                                    onLabelChange={undefined}
                                    onHrefChange={undefined}
                                    onVisibilityChange={undefined}
                                    onVariantChange={undefined}
                                    linkType={secondaryButtonLinkType}
                                    onLinkTypeChange={undefined}
                                    targetDialogId={secondaryButtonTargetDialogId}
                                    onTargetDialogIdChange={undefined}
                                    iconLeft={secondaryButtonIconLeft}
                                    iconRight={secondaryButtonIconRight}
                                    onIconLeftChange={undefined}
                                    onIconRightChange={undefined}
                                    id={secondaryButtonId}
                                    onIdChange={undefined}
                                    suffix="secondary-button"
                                />
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
