<script lang="ts">
	import type { PageServerData } from './$types';
	import { invalidateAll } from '$app/navigation';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { Button } from '$lib/components/ui/button';
	import * as Collapsible from '$lib/components/ui/collapsible/index.js';
	import { toast } from 'svelte-sonner';
	import { buttonVariants } from '$lib/components/ui/button/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	// import * as Tooltip from '$lib/components/ui/tooltip';
	import * as AlertDialog from '$lib/components/ui/alert-dialog/index.js';
	import Icon from '@iconify/svelte';
	import { SectionForm, DragAndDropFunctionality, Sidebar } from '$lib/index';
	import { Template } from '$lib/index';
	import { dropzone } from '$lib/components/common/dnd';
	import { measurements, cards } from '$lib/components/common/questionTypes';
	import { formComponents } from '$lib/components/common/questionTypes';
	import {
		deleteSectionById,
		findSectionById,
		findSectionByTitle,
		updateSectionWithSubsection,
		type Section
	} from './localFunctions';
	import {
		createNewQuestion,
		createNewSection,
		deleteQuestion,
		deleteSection,
		fetchSectionData
	} from './apiFunctions';
	import * as Breadcrumb from '$lib/components/ui/breadcrumb/index.js';

	////////////////////////////////////////////////////////////////////////////////////

	let data: PageServerData=$props();
	let sections = $state(data.assessmentTemplate.Sections);
	let questions = $state(data.assessmentTemplate.Questions);
	let templateInfo = $state(data.assessmentTemplate.Template); //data.assessmentTemplate.Template;
	const parentFormTemplateId = $page.params.assessmentId;
	let result = findSectionByTitle(data.assessmentTemplate.Sections, 'Assessment Root Section');
	const rootSectionId: string = result.id;
	let showSheet = $state(false); // false;
	let responseType = $state();
	let questionId = $state();
	let questionCard = $state();
	let typeOfQuestion: 'Basic' | 'Advanced' = 'Basic';
	let sectionNameCounter = 1;
	let highlightedSection: number | null = null;
	let highlightedSubSection: number | null = null;
	let deleteButtonClicked = false;
	let deleteSubButtonClicked = false;
	let cardToDelete: any = null;
	// let deleteButtonClickedSubCard = false;
	let sectionForm = false;
	let subSectionForm = false;
	let sectionDataFromDatabase = $state();
	let subSectionDataFromDatabase = $state();
	let parentSection = $state();
	const userId = $page.params.userId;
	let uiSections: Section[] = $state([]);

	uiSections = mapSectionsAndQuestions(
		data.assessmentTemplate.Sections,
		[],
		rootSectionId,
		data.assessmentTemplate.Questions
	);

	function mapSectionsAndQuestions(
		sections: any[],
		uiSections: Section[],
		rootSectionId: string,
		questions: any[]
	) {
		if (!sections || !Array.isArray(sections)) {
			console.error('mapSections: sections is undefined or not an array', sections);
			return;
		}

		let cardLocalIdCounter = 1;

		// 1) Exclude the root section
		const nonRootSections = sections.filter((section) => section.ParentSectionId !== rootSectionId);

		// 2) Separate out parent sections (sections with ParentSectionId as rootSectionId)
		const parentSections = sections.filter((section) => section.ParentSectionId === rootSectionId);

		// 3) Separate the remaining sections as subsections
		const subsections = nonRootSections.filter(
			(section) => section.ParentSectionId !== rootSectionId
		);

		// 4) Sort parent sections by Sequence
		parentSections.sort((a, b) => a.Sequence.localeCompare(b.Sequence));

		// 5) Map subsections to their corresponding parent sections
		const mappedParentSections = parentSections.map((parentSection, index) => {
			// Assign subsections to the parent section and sort them by Sequence
			const childSubsections = subsections
				.filter((subsection) => subsection.ParentSectionId === parentSection.id)
				.sort((a, b) => a.Sequence.localeCompare(b.Sequence));

			let sectionNameCounter = 1;
			let sectionIdCounter = 1;

			// Map each child subsection to the parent section
			const mappedSubsections = childSubsections.map((subsection) => {
				// Assign questions to subsections and sort them by Sequence
				const subsectionQuestions = questions
					.filter((question) => question.ParentFormSection.id === subsection.id)
					.sort((a, b) => a.Sequence.localeCompare(b.Sequence));

				// Create card objects for questions with localIds
				const mappedCards = subsectionQuestions.map((question) => ({
					id: question.id,
					name: question.ResponseType,
					type: question.ResponseType,
					Title: question.Title,
					Description: question.Description,
					Options: question.Options,
					value: null,
					icon: null,
					localId: cardLocalIdCounter++
				}));

				return {
					...subsection,
					cards: mappedCards,
					subsections: [],
					subsectionCount: 0,
					name: `SubSection ${sectionNameCounter++}`,
					localId: sectionIdCounter++
				};
			});

			// Assign questions to parent sections and sort them by Sequence
			const parentSectionQuestions = questions
				.filter((question) => question.ParentFormSection.id === parentSection.id)
				.sort((a, b) => a.Sequence.localeCompare(b.Sequence));

			// Create card objects for questions with localIds
			const parentSectionCards = parentSectionQuestions.map((question) => ({
				id: question.id,
				name: question.ResponseType,
				type: question.ResponseType,
				Title: question.Title,
				Description: question.Description,
				Options: question.Options,
				value: null,
				icon: null,
				localId: cardLocalIdCounter++
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

		// Append the sorted and mapped sections to uiSections
		uiSections.push(...mappedParentSections);
		return uiSections;
	}

	// async function handleDragAndDrop(
	// 	dropData,
	// 	event: { preventDefault: () => void; stopPropagation: () => void },
	// 	sectionId: number = null,
	// 	subsectionId: number = null
	// ) {
	// 	event.preventDefault();
	// 	event.stopPropagation();

	// 	console.log(dropData, 'this is drop data');
	// 	let dropSectionData;

	// 	if (dropData.type === 'section') {
	// 		if (sectionId === null) {
	// 			// Handling main section addition
	// 			dropSectionData = await getSectionData(parentFormTemplateId, rootSectionId);
	// 			console.log(dropSectionData, 'this is drop section data');
	// 			const newSection = {
	// 				...dropData,
	// 				databaseId: dropSectionData.id,
	// 				localId: nextSectionId++,
	// 				name: `Section ${sectionNameCounter++}`,
	// 				cards: [],
	// 				subsections: [],
	// 				subsectionCount: 0,
	// 				Title: dropSectionData.Title,
	// 				Description: dropSectionData.Description,
	// 				Sequence: dropSectionData.Sequence,
	// 				ParentSectionId: dropSectionData.ParentSectionId,
	// 				ParentFormTemplateId: dropSectionData.ParentFormTemplate.id
	// 			};
	// 			console.log(newSection, 'this is new section');
	// 			uiSections = [...uiSections, newSection]; // Explicit reassignment
	// 			console.log(uiSections, 'this is uiSections');
	// 			toast.success('Section added successfully! Please add section details.');
	// 		} else {
	// 			// Handling subsection addition
	// 			const parentSection = findSectionById(uiSections, sectionId);
	// 			if (parentSection) {
	// 				const newSubsectionId = await getSectionData(
	// 					parentFormTemplateId,
	// 					parentSection.databaseId
	// 				);
	// 				const newSubsection = {
	// 					...dropData,
	// 					id: newSubsectionId.id,
	// 					localId: nextSectionId++,
	// 					name: `Subsection ${parentSection.subsectionCount + 1}`,
	// 					cards: [],
	// 					subsections: [],
	// 					subsectionCount: 0
	// 				};
	// 				updateSectionWithSubsection(uiSections, sectionId, newSubsection);
	// 				parentSection.subsectionCount++;
	// 				uiSections = [...uiSections]; // Trigger reactivity
	// 				toast.success('Subsection added successfully! Please add subsection details.');
	// 			}
	// 		}
	// 	} else if (dropData.type === 'card') {
	// 		if (subsectionId !== null) {
	// 			const parentSection = findSectionById(uiSections, sectionId);
	// 			// const subsection = findSectionById(
	// 			// 	parentSection.subsections,
	// 			// 	subsectionId,
	// 			// 	parentSection.localId
	// 			// );
	// 			let subsection;
	// 			for (let sub of parentSection.subsections) {
	// 				if (sub.localId === subsectionId) {
	// 					console.log('local id', sub.localId);
	// 					console.log('section id', subsectionId);
	// 					subsection = sub;
	// 				}
	// 				console.log(subsection, 'subsection ');
	// 			}

	// 			if (subsection && !subsection.cards.some((card) => card.localId === dropData.localId)) {
	// 				const questionId = await getQuestionData(
	// 					parentFormTemplateId,
	// 					subsection.id,
	// 					dropData.value
	// 				);
	// 				subsection.cards = [
	// 					...subsection.cards,
	// 					{ ...dropData, localId: nextCardId++, id: questionId.id, Title: questionId.Title }
	// 				];
	// 				uiSections = [...uiSections]; // Reassign to trigger UI update
	// 				toast.success('Card added successfully! Please add card details.');
	// 			}
	// 		} else if (sectionId !== null) {
	// 			console.log(sectionId, 'this is section id');
	// 			console.log(uiSections, 'this is section id');
	// 			const section = findSectionById(uiSections, sectionId);
	// 			if (section && !section.cards.some((card) => card.localId === dropData.localId)) {
	// 				const questionId = await getQuestionData(
	// 					parentFormTemplateId,
	// 					section.databaseId,
	// 					dropData.value
	// 				);
	// 				section.cards = [
	// 					...section.cards,
	// 					{ ...dropData, localId: nextCardId++, id: questionId.id, Title: questionId.Title }
	// 				];
	// 				uiSections = [...uiSections]; // Reassign to ensure reactivity
	// 				toast.success('Card added successfully! Please add card details.');
	// 			}
	// 		}
	// 	}

	// 	invalidateAll();
	// 	highlightedSection = null;
	// 	highlightedSubSection = null;
	// }

	async function handleDragAndDrop(
		dropData,
		event: { preventDefault: () => void; stopPropagation: () => void },
		sectionId: number = null,
		subsectionId: number = null
	) {
		event.preventDefault();
		event.stopPropagation();

		console.log(dropData, 'this is drop data');

		// Dynamically calculate the next IDs based on existing sections and cards
		const getNextSectionId = () =>
			Math.max(
				0,
				...uiSections.map((s) => s.localId),
				...uiSections.flatMap((s) => s.subsections.map((sub) => sub.localId))
			) + 1;

		const getNextCardId = () => {
			const nextId =
				Math.max(
					0,
					...uiSections.flatMap((s) => s.cards.map((card) => Number(card.localId))),
					...uiSections.flatMap((s) =>
						s.subsections.flatMap((sub) => sub.cards.map((card) => Number(card.localId)))
					)
				) + 1;

			return nextId;
		};

		let dropSectionData;

		if (dropData.type === 'section') {
			if (sectionId === null) {
				dropSectionData = await getSectionData(parentFormTemplateId, rootSectionId);
				const newSection = {
					...dropData,
					databaseId: dropSectionData.id,
					localId: getNextSectionId(),
					name: `Section ${sectionNameCounter++}`,
					cards: [],
					subsections: [],
					subsectionCount: 0,
					Title: dropSectionData.Title,
					Description: dropSectionData.Description,
					Sequence: dropSectionData.Sequence,
					ParentSectionId: dropSectionData.ParentSectionId,
					ParentFormTemplateId: dropSectionData.ParentFormTemplate.id
				};
				uiSections = [...uiSections, newSection];
				toast.success('Section added successfully! Please add section details.');
			} else {
				// Handling subsection addition
				const parentSection = findSectionById(uiSections, sectionId);
				if (parentSection) {
					const newSubsectionId = await getSectionData(
						parentFormTemplateId,
						parentSection.databaseId
					);
					const newSubsection = {
						...dropData,
						id: newSubsectionId.id,
						localId: getNextSectionId(),
						name: `Subsection ${parentSection.subsectionCount + 1}`,
						cards: [],
						subsections: [],
						subsectionCount: 0
					};
					updateSectionWithSubsection(uiSections, sectionId, newSubsection);
					parentSection.subsectionCount++;
					uiSections = [...uiSections];
					toast.success('Subsection added successfully! Please add subsection details.');
				}
			}
		} else if (dropData.type === 'card') {
			if (subsectionId !== null) {
				const parentSection = findSectionById(uiSections, sectionId);
				let subsection = parentSection?.subsections.find((sub) => sub.localId === subsectionId);

				if (subsection && !subsection.cards.some((card) => card.localId === dropData.localId)) {
					const questionId = await getQuestionData(
						parentFormTemplateId,
						subsection.id,
						dropData.value
					);

					subsection.cards.push({
						...dropData,
						localId: Number(getNextCardId()),
						tempId: String(getNextCardId()).padStart(4, '0'),
						id: questionId.id,
						Title: questionId.Title
					});

					subsection.cards.sort((a, b) => a.localId - b.localId);
					subsection.cards = [...subsection.cards];
					uiSections = [...uiSections];

					console.log('Sorted subsection cards:', subsection.cards);
					toast.success('Card added successfully! Please add card details.');
				}
			} else if (sectionId !== null) {
				const section = findSectionById(uiSections, sectionId);
				if (section && !section.cards.some((card) => card.localId === dropData.localId)) {
					const questionId = await getQuestionData(
						parentFormTemplateId,
						section.databaseId,
						dropData.value
					);

					// Append the new card to the end of the cards array
					section.cards.push({
						...dropData,
						localId: Number(getNextCardId()),
						tempId: String(getNextCardId()).padStart(4, '0'),
						id: questionId.data.Data.id,
						Title: questionId.data.Data.Title
					});

					// var sortableCards = section.cards.map((x) => {
					// 	return {
					// 		...x,
					// 		tempId: String(x.localId).padStart(4, '0')
					// 	};
					// });
					section.cards.sort((x, y) => {
						if (x.tempId < y.tempId) return -1;
						if (x.tempId > y.tempId) return 1;
						return 0;
					});
					// section.cards = sortableCards;

					console.log(section.cards, 'This is sorted card');
					section.cards = [...section.cards];
					console.log('Sorted section cards:', section.cards);

					console.log(uiSections, 'this is uiSections');
					toast.success('Card added successfully! Please add card details.');
				}
			}
		}

		invalidateAll();
		highlightedSection = null;
		highlightedSubSection = null;
	}

	function openSheet(e: { detail: { responseType: any; id: any; card: any } }) {
		showSheet = true;
		responseType = e.detail.responseType;
		questionId = e.detail.id;
		questionCard = e.detail.card;
	}

	function closeSheet(event?: any) {
		showSheet = false;
		invalidateAll();
	}

	function handleSubmit(event: { preventDefault: () => void }) {
		event.preventDefault();
		closeSheet(event);
	}

	function changeTypes(event: Event) {
		const target = event.target as HTMLInputElement;
		if (target.value === 'Basic' || target.value === 'Advanced') {
			typeOfQuestion = target.value;
		}
	}

	async function getSectionData(parentFormTemplateId: string, parentSectionId: string) {
		const sectionData = await createNewSection({ parentFormTemplateId, parentSectionId });
		console.log(sectionData, 'sectionData');
		return sectionData;
	}

	async function getQuestionData(
		parentFormTemplateId: string,
		parentSectionId: string,
		responseType: string
	) {
		const questionData = await createNewQuestion({
			parentFormTemplateId,
			parentSectionId,
			responseType
		});
		return questionData;
	}

	function handleDragEnter(sectionId: number) {
		highlightedSection = sectionId;
	}

	function handleDragLeave(sectionId: number) {
		if (highlightedSection === sectionId) {
			highlightedSection = null;
		}
	}

	function handleDragOver(sectionId: number, event: DragEvent) {
		event.preventDefault();
		highlightedSection = sectionId;
	}

	function handleDragEnterSubsection(subSectionId: number) {
		highlightedSubSection = subSectionId;
	}

	function handleDragLeaveSubsection(subSectionId: number) {
		if (highlightedSubSection === subSectionId) {
			highlightedSubSection = null;
		}
	}

	function handleDragOverSubsection(subSectionId: number, event: DragEvent) {
		event.preventDefault();
		highlightedSubSection = subSectionId;
	}

	function openDeleteModal(card) {
		deleteButtonClicked = true;
		cardToDelete = card;
	}

	function closeDeleteModal() {
		deleteButtonClicked = false;
		cardToDelete = null;
	}

	function confirmDeleteCard(sectionLocalId: number, cardLocalId: number, cardId: string) {
		handleDeleteCard(sectionLocalId, cardLocalId, cardId);
		closeDeleteModal();
	}

	function handleDeleteCard(sectionId: number, cardId: number, questionId: string) {
		console.log(sectionId, cardId, questionId);
		const section = findSectionById(uiSections, sectionId);
		if (section) {
			section.cards = section.cards.filter((card) => card.localId !== cardId);
			uiSections = [...uiSections];
		} else {
			toast.error('Cannot find section. Try Again');
		}
		handleQuestionDelete(questionId);
		deleteButtonClicked = !deleteButtonClicked;
		// toast.success('Question deleted successful');
	}

	const handleQuestionDelete = async (questionId: string) => {
		try {
			await deleteQuestion({ questionId: questionId });
			toast.success('Question deleted successfully');
		} catch (error) {
			console.error('Error deleting question:', error);
			toast.error('Failed to delete question. Please try again.');
		}
	};

	function openDeleteSubModal({
		sectionLocalId,
		subsectionLocalId,
		cardLocalId,
		cardId,
		isSubsection
	}) {
		deleteSubButtonClicked = true;
		console.log('Deleting:', sectionLocalId, subsectionLocalId, cardLocalId, cardId, isSubsection);
		cardToDelete = { sectionLocalId, subsectionLocalId, cardLocalId, cardId, isSubsection };
	}

	function closeDeleteSubModal() {
		deleteSubButtonClicked = false;
		cardToDelete = null;
	}

	function confirmDeleteSubcard(
		sectionLocalId: number,
		subsectionLocalId: number,
		cardLocalId: number,
		cardId: string
	) {
		console.log(sectionLocalId, subsectionLocalId, cardLocalId, cardId);
		handleDeleteSubcard(sectionLocalId, subsectionLocalId, cardLocalId, cardId);
		closeDeleteModal();
	}

	function handleDeleteSubcard(
		sectionId: number,
		subsectionId: number,
		subcardId: number,
		subcardDatabaseId: string
	) {
		console.log('Deleting subcard:', sectionId, subsectionId, subcardId, subcardDatabaseId);

		const section = findSectionById(uiSections, sectionId);
		if (section) {
			const subsection = section.subsections.find((sub) => sub.localId === subsectionId);
			if (subsection) {
				subsection.cards = subsection.cards.filter((card) => card.localId !== subcardId); // Delete subcard from subsection
				uiSections = [...uiSections]; // Update the UI
			} else {
				toast.error('Subsection not found.');
			}
		} else {
			toast.error('Section not found.');
		}

		// Deleting the actual question related to the subcard (if applicable)
		handleQuestionDelete(subcardDatabaseId);
		deleteSubButtonClicked = !deleteSubButtonClicked;
		// toast.success('Subcard deleted successfully');
	}

	const handleDeleteSectionById = async (localId: string) => {
		try {
			const res = await deleteSection({ sectionId: localId });
			console.log('Delete successful:', res);
		} catch (error) {
			console.error('Error in handleDeleteSectionById:', error);
		}
	};

	function handleDeleteSection(sectionId: number, databaseId: string) {
		uiSections = deleteSectionById(uiSections, sectionId);
		handleDeleteSectionById(databaseId);
		toast.success('Section deleted successful');
	}

	function handleDeleteSubsection(subsectionId: number, sectionId: number, databaseId: string) {
		uiSections = deleteSectionById(uiSections, subsectionId, true);
		handleDeleteSectionById(databaseId);
		toast.success('Subsection deleted successfully');
	}

	async function openSectionForm(id: string) {
		sectionDataFromDatabase = await fetchSectionData(id);
		sectionForm = true;
	}

	function closeSectionForm() {
		sectionForm = false;
	}

	async function openSubSectionForm(id: string, parentsectionId: string) {
		subSectionDataFromDatabase = await fetchSectionData(id);
		parentSection = parentsectionId;
		subSectionForm = true;
	}

	function closeSubSectionForm() {
		subSectionForm = false;
	}

	function handleCardDragStart(sectionId: number, cardId: number, event: DragEvent) {
		event.dataTransfer.setData('text/plain', JSON.stringify({ sectionId, cardId }));
	}

	function handleCardDrop(sectionId: number, cardIndex: number, event: DragEvent) {
		event.preventDefault();

		const data = JSON.parse(event.dataTransfer.getData('text/plain'));
		const { sectionId: fromSectionId, cardId: fromCardId } = data;

		// Find the source section and ensure we have a card to move
		const fromSection = findSectionById(uiSections, fromSectionId);
		if (fromSection) {
			const fromIndex = fromSection.cards.findIndex((c) => c.localId === fromCardId);

			// Find the target section and ensure it exists
			const targetSection = findSectionById(uiSections, sectionId);
			if (targetSection && fromIndex !== -1 && cardIndex !== -1) {
				const [movedCard] = fromSection.cards.splice(fromIndex, 1);

				// Insert the card into the target position in the same section
				targetSection.cards.splice(cardIndex, 0, movedCard);

				// Trigger UI update
				uiSections = [...uiSections];
			}
		}
	}
	// import { state } from '$app/state';
	// Get all component names from formComponents
	const componentKeys = Object.keys(formComponents);

	// Initialize selected component (default to first component in the list)
	let selected = $state(componentKeys[0]);
</script>

{#if showSheet}
	<DragAndDropFunctionality
		{data}
		{responseType}
		id={questionId}
		on:closeSheet={closeSheet}
		on:handleSubmitForm={handleSubmit}
		{questionCard}
	/>
{/if}

{#if sectionForm}
	<div
		class="fixed inset-0 z-40 flex items-center justify-center bg-gray-800 bg-opacity-50 backdrop-blur-md"
	>
		<SectionForm
			sectionRecordsFromDatabase={sectionDataFromDatabase}
			data={data.sectionForm}
			parentSection={rootSectionId}
			on:close={closeSectionForm}
		/>
	</div>
{/if}

{#if subSectionForm}
	<div
		class="fixed inset-0 z-40 flex items-center justify-center bg-gray-800 bg-opacity-50 backdrop-blur-md"
	>
		<SectionForm
			sectionRecordsFromDatabase={subSectionDataFromDatabase}
			data={data.sectionForm}
			{parentSection}
			on:close={closeSubSectionForm}
		/>
	</div>
{/if}

<div class="bg-green-5 flex min-h-screen flex-row">
	<div class="flex flex-1 overflow-hidden">
		<Sidebar {typeOfQuestion} {changeTypes} {measurements} {cards} />
		<div class="mx-10 my-1 w-8/12 space-y-2 p-2">
			<div class="flex w-full flex-row items-center">
				<Breadcrumb.Root>
					<Breadcrumb.List class="flex">
						<Breadcrumb.Item>
							<Breadcrumb.Link href="/users/{userId}/assessments">Assessment</Breadcrumb.Link>
						</Breadcrumb.Item>
						<Breadcrumb.Separator />
						<Breadcrumb.Item>
							<Breadcrumb.Page>Question</Breadcrumb.Page>
						</Breadcrumb.Item>
					</Breadcrumb.List>
				</Breadcrumb.Root>
				<div class="ml-auto flex items-center">
					<Dialog.Root>
						<Dialog.Trigger class="{buttonVariants({ variant: 'outline' })} flex">
							<!-- <Tooltip.Root>
								<Tooltip.Trigger>
									<Icon
										icon="icon-park-outline:preview-open"
										width="16"
										height="16"
										class="text-primary"
									/>
								</Tooltip.Trigger>
								<Tooltip.Content>
									<p>Preview</p>
								</Tooltip.Content>
							</Tooltip.Root> -->
						</Dialog.Trigger>
						<Dialog.Content class="dialog-content h-[90vh] overflow-y-auto sm:max-w-[150vh]">
							<Template {templateInfo} {sections} />
						</Dialog.Content>
					</Dialog.Root>
				</div>
			</div>

			<div class="h-full w-full overflow-hidden">
				{#if uiSections.length === 0}
					<p class="text-center text-sm text-slate-500">
						Drag and drop sections, subsections, and question response type cards here
					</p>
				{/if}

				<div
					class="flex h-full w-full flex-col"
					on:dragover|preventDefault
					use:dropzone={{ on_dropzone: handleDragAndDrop }}
					role="region"
					aria-label="Drop Area"
				>
					{#each uiSections as section (section.localId)}
						<div
							class="my-4 border p-3 {highlightedSection === section.localId ? 'highlight' : ''}"
							on:dragenter={() => handleDragEnter(section.localId)}
							on:dragleave={() => handleDragLeave(section.localId)}
							on:dragover={(event) => handleDragOver(section.localId, event)}
							use:dropzone={{
								on_dropzone: (data, e) => handleDragAndDrop(data, e, section.localId)
							}}
							role="region"
							aria-label={`Section ${section.name}`}
						>
							<Collapsible.Root class=" space-y-2">
								<div class="flex flex-row">
									<div class="flex items-center justify-between space-x-4 px-4">
										<Collapsible.Trigger
											class={buttonVariants({ variant: 'ghost', size: 'sm', class: 'w-9 p-0' })}
										>
											<Button variant="ghost" size="sm" class="w-9 p-0">
												<Icon icon="fluent:chevron-up-down-24-regular" width="16" height="16" />
												<span class="sr-only">Toggle</span>
											</Button>
										</Collapsible.Trigger>
									</div>

									<div class="flex h-fit w-full flex-row">
										<Button
											variant="outline"
											class="h-full w-full p-2"
											onclick={() => openSectionForm(section.databaseId)}
										>
											<div class="flex-col">
												{section.Title || section.name}
												<p class="text-sm text-gray-300 dark:text-gray-500">
													Drop the Subsection and response type cards here
												</p>
											</div>
										</Button>

										<AlertDialog.Root>
											<AlertDialog.Trigger class={buttonVariants({ variant: 'outline' })}>
												<Button variant="ghost" class="ml-1 h-full py-5"
													><Icon
														icon="weui:delete-outlined"
														width="20"
														height="20"
														style="color:red"
													/>
												</Button>
											</AlertDialog.Trigger>
											<AlertDialog.Content>
												<AlertDialog.Header>
													<AlertDialog.Title>Are you absolutely sure?</AlertDialog.Title>
													<AlertDialog.Description>
														This action cannot be undone. This will permanently delete your Section
														and remove your data from our servers. please be certain.
													</AlertDialog.Description>
												</AlertDialog.Header>
												<AlertDialog.Footer>
													<AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
													<AlertDialog.Action
														class="bg-destructive hover:bg-destructive dark:text-white"
														onclick={() => handleDeleteSection(section.localId, section.databaseId)}
														>Delete</AlertDialog.Action
													>
												</AlertDialog.Footer>
											</AlertDialog.Content>
										</AlertDialog.Root>
									</div>
								</div>
								<Collapsible.Content class="space-y-2">
									<div
										class="h-fit w-full p-1"
										role="list"
										aria-label={`Cards in section: ${section.name}`}
									>
										{#if section.cards.length === 0}
											<p class="text-center text-sm text-slate-500">
												Drop response type cards here
											</p>
										{/if}

										<!-- {#each [...section.cards].sort((a, b) => a.localId - b.localId) as card, index (card.localId)} -->
										{#each section.cards as card, index (card.localId)}
											<div
												class="hover-container items-center justify-between"
												draggable="true"
												on:dragstart={(event) =>
													handleCardDragStart(section.localId, card.localId, event)}
												on:drop={(event) => handleCardDrop(section.localId, index, event)}
												on:dragover|preventDefault
												role="listitem"
												aria-label={`Card: ${card.name}`}
											>
												<div class="relative mt-1 flex w-[95%]">
													{#if card.name !== 'None'}
														<!-- <svelte:component
															this={formComponents[card.name]}
															on:openSheet={openSheet}
															on:closeSheet={closeSheet}
															on:handleSubmitForm={handleSubmit}
															responseType={card.name}
															id={card.id}
															{card}
														/> -->
														<select bind:value={selected}>
															{#each componentKeys as key}
																<option value={key}>{key}</option>
															{/each}
														</select>

														{#if selected}
															{@const SelectedComponent = formComponents[selected]}
															<SelectedComponent
																on:openSheet={openSheet}
																on:closeSheet={closeSheet}
																on:handleSubmitForm={handleSubmit}
																responseType={selected}
															/>
														{/if}
													{/if}
													<button
														class="delete-button"
														on:click={() =>
															openDeleteModal({
																sectionLocalId: section.localId,
																cardLocalId: card.localId,
																cardId: card.id
															})}
														aria-label="Delete card"
													>
														<Icon
															icon="weui:delete-outlined"
															width="18"
															height="18"
															style="color: red"
														/>
													</button>
												</div>
											</div>
										{/each}

										{#if deleteButtonClicked}
											<div class="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"></div>

											<div class="fixed inset-0 z-50 flex items-center justify-center">
												<div
													class="relative z-50 w-full max-w-lg border bg-background p-6 shadow-lg sm:rounded-lg md:w-full"
												>
													<div class="flex flex-col space-y-2 text-center sm:text-left">
														<h1 class="text-lg font-semibold">Are you absolutely sure?</h1>
														<p class="text-sm text-muted-foreground">
															This action cannot be undone. This will permanently delete your
															question and remove your data from our servers.
														</p>
													</div>

													<div
														class="mt-4 flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2"
													>
														<Button variant="outline" onclick={closeDeleteModal}>Cancel</Button>
														<Button
															class="bg-destructive hover:bg-destructive dark:text-white"
															onclick={() =>
																confirmDeleteCard(
																	cardToDelete.sectionLocalId,
																	cardToDelete.cardLocalId,
																	cardToDelete.cardId
																)}
														>
															Delete
														</Button>
													</div>
												</div>
											</div>
										{/if}
									</div>

									{#if section.subsections.length > 0}
										{#each section.subsections as subsection (subsection.localId)}
											<div
												class="my-2 h-fit w-full p-1 {highlightedSubSection === subsection.localId
													? 'highlight'
													: ''} "
												on:dragenter={() => handleDragEnterSubsection(subsection.localId)}
												on:dragleave={() => handleDragLeaveSubsection(subsection.localId)}
												on:dragover={(event) => handleDragOverSubsection(subsection.localId, event)}
												use:dropzone={{
													on_dropzone: (data, e) =>
														handleDragAndDrop(data, e, section.localId, subsection.localId)
												}}
												role="region"
												aria-label={`Subsection ${subsection.name}`}
											>
												<Collapsible.Root class=" space-y-2">
													<div class="flex flex-row">
														<div class="flex items-center justify-between space-x-4 px-4">
															<Collapsible.Trigger
																class={buttonVariants({
																	variant: 'ghost',
																	size: 'sm',
																	class: 'w-9 p-0'
																})}
															>
																<!-- <Tooltip.Root>
																	<Tooltip.Trigger>
																		<Button variant="ghost" size="sm" class="w-9 p-0">
																			<Icon
																				icon="fluent:chevron-up-down-24-regular"
																				width="16"
																				height="16"
																			/>

																			<span class="sr-only">Toggle</span>
																		</Button>
																	</Tooltip.Trigger>
																	<Tooltip.Content>
																		<p>Collaps to see</p>
																	</Tooltip.Content>
																</Tooltip.Root> -->
															</Collapsible.Trigger>
														</div>
														<div class="flex h-fit w-full flex-row">
															<Button
																variant="outline"
																class="h-full w-full p-2"
																onclick={() =>
																	openSubSectionForm(subsection.id, section.databaseId)}
															>
																<div class="flex-col">
																	{subsection.Title || subsection.name}
																	<p class=" text-gray-300">Drag cards into this section</p>
																</div>
															</Button>

															<AlertDialog.Root>
																<AlertDialog.Trigger class={buttonVariants({ variant: 'outline' })}>
																	<Button variant="ghost" class="ml-1 h-full py-5">
																		<Icon
																			icon="weui:delete-outlined"
																			width="20"
																			height="20"
																			style="color:red"
																		/></Button
																	>
																</AlertDialog.Trigger>
																<AlertDialog.Content>
																	<AlertDialog.Header>
																		<AlertDialog.Title>Are you absolutely sure?</AlertDialog.Title>
																		<AlertDialog.Description>
																			This action cannot be undone. This will permanently delete
																			your Sub Section and remove your data from our servers.
																		</AlertDialog.Description>
																	</AlertDialog.Header>
																	<AlertDialog.Footer>
																		<AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
																		<AlertDialog.Action
																			class="bg-destructive hover:bg-destructive dark:text-white"
																			onclick={() =>
																				handleDeleteSubsection(
																					subsection.localId,
																					section.localId,
																					subsection.id
																				)}>Delete</AlertDialog.Action
																		>
																	</AlertDialog.Footer>
																</AlertDialog.Content>
															</AlertDialog.Root>
														</div>
													</div>
													<Collapsible.Content class="space-y-2">
														<div
															class="h-fit w-full"
															role="list"
															aria-label={`Cards in Subsection: ${subsection.name}`}
														>
															{#each subsection.cards as subcard, index (subcard.localId)}
																<div
																	class="hover-container my-1 items-center justify-between"
																	on:dragstart={(event) =>
																		handleCardDragStart(subsection.localId, subcard.localId, event)}
																	on:dragover|preventDefault
																	on:drop={(event) =>
																		handleCardDrop(subsection.localId, index, event)}
																	role="listitem"
																	aria-label={`Draggable subcard: ${subcard.name}`}
																>
																	<div class="relative flex w-[95%]">
																		{#if subcard.name !== 'None'}
																			<!-- <svelte:component
																				this={formComponents[subcard.name]}
																				on:openSheet={openSheet}
																				on:closeSheet={closeSheet}
																				on:handleSubmitForm={handleSubmit}
																				responseType={subcard.name}
																				id={subcard.id}
																				card={subcard}
																			/> -->
																			<select bind:value={selected}>
																				{#each componentKeys as key}
																					<option value={key}>{key}</option>
																				{/each}
																			</select>

																			{#if selected}
																				{@const SelectedComponent = formComponents[selected]}
																				<SelectedComponent
																					on:openSheet={openSheet}
																					on:closeSheet={closeSheet}
																					on:handleSubmitForm={handleSubmit}
																					responseType={selected}
																				/>
																			{/if}
																		{:else}
																			<div class="relative"></div>
																		{/if}

																		<button
																			class="delete-button"
																			on:click={() =>
																				openDeleteSubModal({
																					sectionLocalId: section.localId,
																					subsectionLocalId: subsection.localId,
																					cardLocalId: subcard.localId,
																					cardId: subcard.id,
																					isSubsection: true // Indicating this is a subcard
																				})}
																			aria-label="Delete subcard"
																		>
																			<Icon
																				icon="weui:delete-outlined"
																				width="18"
																				height="18"
																				style="color: red"
																			/>
																		</button>
																	</div>
																</div>
															{/each}

															{#if deleteSubButtonClicked}
																<div class="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"></div>

																<div
																	class="fixed inset-0 z-50 flex items-center justify-center border"
																>
																	<div
																		class="relative z-50 w-full max-w-lg border bg-background p-6 shadow-lg sm:rounded-lg md:w-full"
																	>
																		<div class="flex flex-col space-y-2 text-center sm:text-left">
																			<h1 class="text-lg font-semibold">
																				Are you absolutely sure?
																			</h1>
																			<p class="text-sm text-muted-foreground">
																				This action cannot be undone. This will permanently delete
																				your subcard.
																			</p>
																		</div>

																		<div
																			class="mt-4 flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2"
																		>
																			<Button variant="outline" on:click={closeDeleteSubModal}
																				>Cancel</Button
																			>
																			<Button
																				class="bg-destructive hover:bg-destructive dark:text-white"
																				on:click={() =>
																					confirmDeleteSubcard(
																						cardToDelete.sectionLocalId,
																						cardToDelete.subsectionLocalId,
																						cardToDelete.cardLocalId,
																						cardToDelete.cardId
																					)}
																			>
																				Delete
																			</Button>
																		</div>
																	</div>
																</div>
															{/if}
														</div>
													</Collapsible.Content>
												</Collapsible.Root>
											</div>
										{/each}
									{/if}
									<!-- </div> -->
								</Collapsible.Content>
							</Collapsible.Root>
						</div>
					{/each}
				</div>
			</div>
		</div>
	</div>
</div>

<style>
	.delete-button {
		@apply absolute -right-7 top-[40%] hidden border p-1 text-white;
	}

	.hover-container:hover .delete-button {
		@apply block;
	}

	.highlight {
		border: 2px solid blue; /* You can change the border style and color */
	}

	:global(.dialog-content.dialog-content) {
		scrollbar-width: none;
		-ms-overflow-style: none;
		overflow-y: scroll;
	}

	:global(.dialog-content.dialog-content::-webkit-scrollbar) {
		width: 0;
		height: 0;
		display: none;
	}
</style>
