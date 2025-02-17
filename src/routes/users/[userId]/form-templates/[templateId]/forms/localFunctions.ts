export type Card = {
    localId: number;
    id: string;
    name: string;
    type: string;
    value: string;
    icon: string;
    sectionId: string;
    Description: string,
    Options: [];
    tempId:string;
};

export type Section = {
    id: string;
    SectionIdentifier: string | null;
    Title: string | null;
    Description: string | null;
    DisplayCode: string;
    Sequence: string | null;
    ParentSectionId: string;
    CreatedAt: string;
    UpdatedAt: string | null;
    localId: number;
    title: string;
    databaseId: string;
    name: string;
    type: string;
    cards: Card[];
    subsections: Section[];
    subsectionCount: number;
    ParentFormTemplateId: string;
};

export type newSectionTemplate = {
    id: string
    localId: number,
    name: string,
    type: 'section',
    cards: Card[],
    subsections: [],
    subsectionCount: 0
};

export function findSectionById(
    sections: Section[],
    sectionId: number | string,
    parentSectionId: string | number = null
): Section | null {
    for (const section of sections) {
        // Check if the current section matches the ID and optional parent ID
        if (section.localId === sectionId && (parentSectionId === null || section.ParentSectionId === parentSectionId)) {
            // console.log("Found section:", section);
            return section;
        }
        if (section.subsections) {
            for (const subsection of section.subsections) {
                console.log()
                // Check if the subsection matches the ID and parent ID
                if (subsection.localId === sectionId) {
                    console.log("Found subsection:", subsection);
                    return subsection;
                }
            }
        }
    }
    return null;
}

export function updateSectionWithSubsection(
    sections: Section[],
    sectionId: number,
    subsection: Section
): Section[] {
    // Iterate through each section in the array.
    return sections.map((section) => {
        if (section.localId === sectionId) {
            // Add the subsection to the matched section.
            return {
                ...section,
                subsections: [...section.subsections, subsection]
            };
        }
        // Recursively call the function if subsections exist.
        if (section.subsections.length > 0) {
            return {
                ...section,
                subsections: updateSectionWithSubsection(
                    section.subsections,
                    sectionId,
                    subsection
                )
            };
        }
        return section;
    });
}

export function deleteSectionById(sections: Section[], sectionId: number, isSubsection = false): Section[] {
    return sections.filter((section) => {
        if (isSubsection) {
            // If deleting a subsection, filter it out from the section's subsections
            section.subsections = section.subsections.filter((subsection) => subsection.localId !== sectionId);
        } else if (section.localId === sectionId) {
            // If deleting a main section, remove it completely
            return false;
        }

        // Recursively check subsections if not a direct match
        section.subsections = deleteSectionById(section.subsections, sectionId, true);
        return true;
    });
}


export const findSectionByTitle = (sections: Section[], title: string): Section | undefined => {
    return sections.find(section => section.Title === title);
};

export function mapSectionsAndQuestions(
    sections: any[],
    uiSections: Section[],
    rootSectionId: string,
    questions: any[]
) {
    if (!sections || !Array.isArray(sections)) {
        console.error('mapSections: sections is undefined or not an array', sections);
        return;
    }

    let cardLocalIdCounter = 1; // Initialize the counter for card localIds

    // 1) Exclude the root section
    const nonRootSections = sections.filter((section) => section.ParentSectionId !== rootSectionId);

    // 2) Separate out parent sections (sections with ParentSectionId as rootSectionId)
    const parentSections = sections.filter((section) => section.ParentSectionId === rootSectionId);

    // 3) Separate the remaining sections as subsections
    const subsections = nonRootSections.filter(
        (section) => section.ParentSectionId !== rootSectionId
    );

    // 4) Map subsections to their corresponding parent sections
    const mappedParentSections = parentSections.map((parentSection, index) => {
        // Assign subsections to the parent section
        const childSubsections = subsections.filter(
            (subsection) => subsection.ParentSectionId === parentSection.id
        );

        let sectionNameCounter = 1;
        let sectionIdCounter = 1;

        // Map each child subsection to the parent section
        const mappedSubsections = childSubsections.map((subsection) => {
            // Assign questions to subsections
            const subsectionQuestions = questions.filter(
                (question) => question.ParentFormSection.id === subsection.id
            );

            // Create card objects for questions with localIds
            const mappedCards = subsectionQuestions.map((question) => ({
                id: question.id,
                name: question.ResponseType,
                type: question.ResponseType,
                Title: question.Title,
                Description: question.Description,
                Options: question.Options,
                value: null, // You can define how to handle this based on your requirements
                icon: null, // Set this based on your needs
                localId: cardLocalIdCounter++ // Assign and increment localId
            }));

            return {
                ...subsection,
                cards: mappedCards,
                subsections: [], // Further subsections can be handled similarly
                subsectionCount: 0,
                name: `SubSection ${sectionNameCounter++}`,
                localId: sectionIdCounter++
            };
        });

        // Assign questions to parent sections
        const parentSectionQuestions = questions.filter(
            (question) => question.ParentFormSection.id === parentSection.id
        );

        // Create card objects for questions with localIds
        const parentSectionCards = parentSectionQuestions.map((question) => ({
            id: question.id,
            name: question.ResponseType,
            type: question.ResponseType,
            Title: question.Title,
            Description: question.Description,
            Options: question.Options,
            value: null, // You can define how to handle this based on your requirements
            icon: null, // Set this based on your needs
            localId: cardLocalIdCounter++ // Assign and increment localId
        }));

        return {
            ...parentSection,
            localId: index + 1,
            title: `Section ${index + 1}`,
            databaseId: parentSection.id,
            id: (index + 1).toString(),
            name: `Section ${index + 1}`,
            type: 'section',
            cards: parentSectionCards,
            subsections: mappedSubsections,
            subsectionCount: mappedSubsections.length,
            SectionIdentifier: parentSection.SectionIdentifier,
            Title: parentSection.Title,
            Description: parentSection.Description,
            DisplayCode: parentSection.DisplayCode,
            Sequence: parentSection.Sequence,
            ParentSectionId: parentSection.ParentSectionId,
            ParentFormTemplateId: parentSection.ParentFormTemplate.id,
            CreatedAt: parentSection.CreatedAt,
            UpdatedAt: parentSection.UpdatedAt
        };
    });

    uiSections.push(...mappedParentSections);
    return uiSections;
}