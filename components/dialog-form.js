"use client";

import DialogSection from "./dialog-section";
import { createUpdateHandler } from "./component-helpers";
import FormPersonalData from "./form-personal-data";

export default function DialogForm(props) {
    const {
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
        titleVisible,
        descriptionVisible
    } = props;

    const update = createUpdateHandler(onUpdate);

    return (
        <DialogSection
            title={title}
            titleVisible={titleVisible !== false}
            onTitleVisibleChange={undefined}
            description={description}
            descriptionVisible={descriptionVisible !== false}
            onDescriptionVisibleChange={undefined}
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
            <FormPersonalData
                {...props}
                update={update}
                className="px-md pb-md"
            />
        </DialogSection>
    );
}
