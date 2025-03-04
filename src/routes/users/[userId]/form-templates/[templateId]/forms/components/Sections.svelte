<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { dropzone } from '$lib/components/common/dnd';
	import * as Collapsible from '$lib/components/ui/collapsible/index.js';
	import { buttonVariants } from '$lib/components/ui/button/index.js';
	import * as AlertDialog from '$lib/components/ui/alert-dialog/index.js';
	import { Button } from '$lib/components/ui/button';
	import Icon from '@iconify/svelte';
	import {
		deleteSectionById,
		findSectionByTitle,
		getSectionData,
		handleDeleteSectionById,
		type Section
	} from './localFunctions';
	import { page } from '$app/state';

	///////////////////////////////////////////////////////////////////////////

	let { pageDataForSections } = $props();

	let displaySections: Section[] = $state([]);
	let highlightedSection: number | null = $state();
	let sectionNameCounter = 1;
	const parentFormTemplateId = page.params.templateId;
	// console.log("data sections============",pageDataForSections.data.assessmentTemplate.Sections)
	let result = findSectionByTitle(
		pageDataForSections.data.assessmentTemplate.Sections,
		'Assessment Root Section'
	);
	const rootSectionId: string = result.id;

	async function handleDragAndDrop(
		dropData,
		event: { preventDefault: () => void; stopPropagation: () => void }
	) {
		event.preventDefault();
		event.stopPropagation();

		console.log(dropData, 'This is drop data');
		let dropSectionData;
		if (dropData.type === 'section') {
			dropSectionData = await getSectionData(parentFormTemplateId, rootSectionId);
			const temp = {
				...dropData,
				id_: sectionNameCounter++,
				Name_: `Section ${sectionNameCounter++}`,
				Type_: dropData.type,
				Cards_: [],
				SubSections_: [],
				SubSectionCount_: 0,
				id: dropSectionData.id,
				Title: dropSectionData.Title,
				Description: dropSectionData.Description,
				DisplayCode: dropSectionData.DisplayCode,
				Sequence: dropSectionData.Sequence,
				ParentSectionId: dropSectionData.ParentSectionId,
				ParentFormTemplateId: dropSectionData.ParentFormTemplate.id
			};
			console.log(temp);
			displaySections = [...displaySections, temp];
		}
		invalidateAll();
	}

	function handleDeleteSection(sectionId: number, databaseId: string) {
		displaySections = deleteSectionById(displaySections, sectionId);
		handleDeleteSectionById(databaseId);
	}
</script>

<div
	ondragover={(event) => {
		event.preventDefault();
	}}
	class="flex size-full flex-col md:ml-5 md:w-10/12 lg:ml-5 lg:w-11/12"
	use:dropzone={{ on_dropzone: handleDragAndDrop }}
	role="region"
	aria-label="Drop Area"
>
	{#if displaySections.length > 0}
		{#each displaySections as section (section.id)}
			<div>
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

						<div class="flex size-full flex-row">
							<Button variant="outline" class="size-full p-2">
								<!-- onclick={() => openSectionForm(section.databaseId)} -->
								<div class="flex-col">
									<p>Section 1</p>
									<p class="text-sm text-gray-300 dark:text-gray-500">
										Drop the Subsection and response type cards here
									</p>
								</div>
							</Button>

							<AlertDialog.Root>
								<AlertDialog.Trigger class={buttonVariants({ variant: 'outline' })}>
									<Button variant="ghost" class="ml-1 size-full "
										><Icon icon="weui:delete-outlined" width="20" height="20" style="color:red" />
									</Button>
								</AlertDialog.Trigger>
								<AlertDialog.Content>
									<AlertDialog.Header>
										<AlertDialog.Title>Are you absolutely sure?</AlertDialog.Title>
										<AlertDialog.Description>
											This action cannot be undone. This will permanently delete your Section and
											remove your data from our servers. please be certain.
										</AlertDialog.Description>
									</AlertDialog.Header>
									<AlertDialog.Footer>
										<AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
										<AlertDialog.Action
											class="bg-destructive hover:bg-destructive dark:text-white"
											onclick={() => handleDeleteSection(section.id_, section.id)}
											>Delete</AlertDialog.Action
										>
									</AlertDialog.Footer>
								</AlertDialog.Content>
							</AlertDialog.Root>
						</div>
					</div>
				</Collapsible.Root>
			</div>
		{/each}
	{/if}
</div>

<style>
	/* .delete-button {
		@apply absolute -right-7 top-[40%] hidden border p-1 text-white;
	}

	.hover-container:hover .delete-button {
		@apply block;
	} */

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
