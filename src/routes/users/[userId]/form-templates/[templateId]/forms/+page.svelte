<script lang="ts">
	import type { PageServerData } from './$types';
	import { invalidateAll } from '$app/navigation';
	import { page } from '$app/state';
	import { buttonVariants } from '$lib/components/ui/button/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Sidebar } from '$lib/index';
	import { Template } from '$lib/index';

	import { measurements, cards } from '$lib/components/common/questionTypes';
	import { findSectionByTitle } from './components/localFunctions';
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';
	import * as Breadcrumb from '$lib/components/ui/breadcrumb/index.js';
	import Icon from '@iconify/svelte';
	import Sections from './components/Sections.svelte';
	import DropZone from './components/try/DropZone.svelte';
	import Section from './components/try/Section.svelte';
	import Subsection from './components/try/Subsection.svelte';
	import Card from './components/try/Card.svelte';

	////////////////////////////////////////////////////////////////////////////////////

	let data: PageServerData = $props();
// console.log("data sections============",data.data.assessmentTemplate)
	// let templateInfo = $state(data.data.assessmentTemplate.Template);
	// const parentFormTemplateId = $derived(page.params.templateId);
	// let result = findSectionByTitle(data.data.assessmentTemplate.Sections, 'Assessment Root Section');

	let typeOfQuestion: 'Basic' | 'Advanced' = $state('Basic');

	const userId = $derived(page.params.userId);

	function changeTypes(event: Event) {
		const target = event.target as HTMLInputElement;
		if (target.value === 'Basic' || target.value === 'Advanced') {
			typeOfQuestion = target.value;
		}
	}

</script>

<div class="bg-green-5 flex min-h-screen flex-row">
	<div class="flex flex-1 overflow-hidden">
		<Sidebar {typeOfQuestion} {changeTypes} {measurements} {cards} />
		<div class="mx-10 my-1 w-8/12 space-y-2 p-2">
			<div class="flex w-full flex-row items-center">
				<Breadcrumb.Root>
					<Breadcrumb.List class="flex">
						<Breadcrumb.Item>
							<Breadcrumb.Link href="/users/{userId}/form-templates">Templates</Breadcrumb.Link>
						</Breadcrumb.Item>
						<Breadcrumb.Separator />
						<Breadcrumb.Item>
							<Breadcrumb.Page>Question</Breadcrumb.Page>
						</Breadcrumb.Item>
					</Breadcrumb.List>
				</Breadcrumb.Root>
				<div class="ml-auto flex items-center">
					<!-- <Dialog.Root>
						<Dialog.Trigger class="{buttonVariants({ variant: 'outline' })} flex">
							<Tooltip.Provider>
								<Tooltip.Root>
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
								</Tooltip.Root>
							</Tooltip.Provider>
						</Dialog.Trigger>
						<Dialog.Content class="dialog-content h-[90vh] overflow-y-auto sm:max-w-[150vh]">
							<Template {templateInfo}/>
						</Dialog.Content>
					</Dialog.Root> -->
				</div>
			</div>

			<div class="size-full overflow-hidden">
				<Sections pageDataForSections={data}/>

				<!-- <DropZone onDrop={handleDragAndDrop}>
					{#each sections as section}
						<Section {section} onDrop={handleDragAndDrop}>
							{#each section.subsections as subsection}
								<Subsection {subsection} onDrop={handleDragAndDrop}>
									{#each subsection.cards as card}
										<Card {card} />
									{/each}
								</Subsection>
							{/each}
						</Section>
					{/each}
				</DropZone> -->
			</div>
		</div>
	</div>
</div>

<style>
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
