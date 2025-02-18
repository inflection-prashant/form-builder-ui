export declare function getQuestionById(questionId: string): Promise<any>;
export declare function createNewSection(model: {
    parentFormTemplateId: string;
    parentSectionId: string;
}): Promise<any>;
export declare function createNewQuestion(model: {
    parentFormTemplateId: string;
    parentSectionId: string;
    responseType: string;
}): Promise<any>;
export declare function fetchSectionData(sectionId: string): Promise<any>;
export declare function deleteSection(model: {
    sectionId: string;
}): Promise<any>;
export declare function deleteQuestion(model: {
    questionId: string;
}): Promise<any>;
