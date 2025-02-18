<script lang="ts">
	import { Input } from '$lib/components/ui/input';
	import { createEventDispatcher } from 'svelte';
	const dispatch = createEventDispatcher();
	import { Button } from '$lib/components/ui/button';
	import { getQuestionById } from '../../../../../routes/users/[userId]/form-templates/[templateId]/forms/apiFunctions';

	export let responseType: string;
	export let id: string;
	export let card;

	async function openSheetFunction() {
		const card = await getQuestionById(id);
		dispatch('openSheet', { responseType: responseType, id: id, card: card });
	}

	function closeSheetFunction() {
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
		<h1 class="text-md font-bold text-slate-400">
			{card.Title || 'Enter your Sleep time'}
		</h1>
	</div>
	<Input
		disabled
		type="text"
		placeholder="Enter the Sleep time in hours here..."
		class="w-full p-2"
	/>

	<div>
		<p class="text-sm text-slate-400">{card.Description || ''}</p>
	</div>
</Button>
