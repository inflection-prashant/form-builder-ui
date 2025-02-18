<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	const dispatch = createEventDispatcher();
	import { Button } from '$lib/components/ui/button';
	import Input from '$lib/components/ui/input/input.svelte';
	import { getQuestionById } from '../../../../../routes/users/[userId]/form-templates/[templateId]/forms/apiFunctions';

	export let responseType: string;
	export let id: string;
	export let card;

	async function openSheetFunction() {
		// console.log(id, 'this is id');
		const card = await getQuestionById(id);
		dispatch('openSheet', { responseType: responseType, id: id, card: card });
	}

	function closeSheetFunction() {
		console.log('this is from text component');
		dispatch('closeSheet');
	}
	function handleSubmitFunction(event: any) {
		dispatch('handleSubmitForm', event);
	}
</script>

<Button
	class="flex h-fit w-full flex-col space-y-2 p-4 hover:border hover:border-dashed hover:border-gray-500"
	onclick={openSheetFunction}
	variant="ghost"
>
	<div class="flex w-full items-center justify-between">
		<h1 class="text-md font-bold text-slate-400">{card.Title || 'Define a range'}</h1>
	</div>
	<div class="h-fit w-full rounded">
		<div class="flex items-start justify-start py-2 pl-2 font-serif text-sm text-slate-500">
			<Input type="range" id="option1" name="options" disabled />
		</div>
	</div>
	<div>
		<p class="text-sm text-slate-400">{card.Description || ''}</p>
	</div>
</Button>
