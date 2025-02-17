<script lang="ts">
	import * as Form from '$lib/components/ui/form';
	import { Input } from '$lib/components/ui/input';
	import { questionSchema, type QuestionSchema } from './question-schema';
	import { type SuperValidated, type Infer, superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import { Button } from '$lib/components/ui/button';
	import { createEventDispatcher } from 'svelte';
	import * as Accordion from '$lib/components/ui/accordion/index.js';

	import Option from './IndividualTypes/Option.svelte';
	import RangeRating from './IndividualTypes/RangeRating.svelte';
	import { enhance } from '$app/forms';
	import Icon from '@iconify/svelte';
	import { toast } from 'svelte-sonner';
	import * as Card from '$lib/components/ui/card/index.js';
	import { InfoIcon } from '..';
	//////////////////////////////////////////////////////////////////////////////

	export let data: SuperValidated<Infer<QuestionSchema>>;
	const form = superForm(data, {
		validators: zodClient(questionSchema),
		applyAction: true,
		dataType: 'json'
	});

	const { form: formData } = form;

	export let responseType: string;
	export let id: string;
	export let questionCard;

	$: $formData.description = questionCard.Description;
	$: $formData.title = questionCard.Title;
	$: $formData.score = questionCard.Score;
	$: $formData.correctAnswer = questionCard.CorrectAnswer;
	$: $formData.hint = questionCard.Hint;
	$: $formData.questionImageUrl = questionCard.QuestionImageUrl;
	$: $formData.rangeMin = questionCard.RangeMin;
	$: $formData.rangeMax = questionCard.RangeMax;

	const dispatch = createEventDispatcher();

	let options = questionCard.Options ? [...questionCard.Options] : [];

	const hardcodedImageUrl = 'https://example.com/default';

	function addOption() {
		if (responseType === 'Boolean' && options.length >= 2) {
			return; // Prevent adding more than 2 options for Boolean type
		}

		options = [
			...options,
			{ Sequence: (options.length + 1).toString(), Data: '', ImageUrl: hardcodedImageUrl }
		];
	}

	function updateOption(index: number, key: string, value: string) {
		options[index] = { ...options[index], [key]: value };
		options = [...options];
	}

	function removeOption(index: number) {
		options = options.filter((_, i) => i !== index);
	}

	function handleSubmit(event: Event) {
		event.preventDefault();
		$formData.options = options;

		dispatch('handleSubmit', { formData: $formData });
		toast.info('Question updated successfully!');
	}

	const fields = {
		Range: RangeRating,
		Rating: RangeRating,
		SingleChoiceSelection: Option,
		MultiChoiceSelection: Option,
		Boolean: Option
	};
</script>

<Card.Root class="rounded-lg border p-4">
	<form
		action="?/createQuestion"
		method="post"
		use:enhance
		on:submit|preventDefault={handleSubmit}
		class="custom-scrollbar h-[calc(screen-2rem)] min-h-screen w-full overflow-y-hidden px-5 py-4"
	>
		<Form.Field {form} name="id" class="hidden">
			<Form.Control let:attrs>
				<Form.Label>Id</Form.Label>
				<Input {...attrs} bind:value={id} />
			</Form.Control>
			<Form.Description>This is id of section.</Form.Description>
			<Form.FieldErrors />
		</Form.Field>

		<Form.Field {form} name="title">
			<Form.Control let:attrs>
				<div class="relative mt-5 flex flex-row gap-3">
					<Form.Label>Title <span class="text-red-600">*</span></Form.Label>
					<div class="relative">
						<InfoIcon title={'This is your question title.'} cls={'w-40'} />
					</div>
				</div>

				<Input {...attrs} bind:value={$formData.title} class="w-full" />
			</Form.Control>
			<!-- <Form.Description>This is your question title.</Form.Description> -->
			<Form.FieldErrors />
		</Form.Field>

		<Form.Field {form} name="responseType" class="hidden">
			<Form.Control let:attrs>
				<Form.Label>Type</Form.Label>
				<Input {...attrs} bind:value={responseType} class="w-full" />
			</Form.Control>
			<!-- <Form.Description>This is your question title.</Form.Description> -->
			<Form.FieldErrors />
		</Form.Field>

		<Form.Field {form} name="description">
			<Form.Control let:attrs>
				<div class="relative mt-5 flex flex-row gap-3">
					<Form.Label class=" ">Description</Form.Label>
					<div class="relative">
						<InfoIcon title={'This is your question description.'} cls={'w-40'} />
					</div>
				</div>
				<Input {...attrs} bind:value={$formData.description} class="w-full" />
				<!-- <input type="text" class="w-full" bind:value={desc} name="description"> -->
			</Form.Control>
			<!-- <Form.Description></Form.Description> -->
			<Form.FieldErrors />
		</Form.Field>

		<!-- {#if responseType === 'Range' || responseType === 'Rating'}
			<svelte:component this={fields[responseType]} {data} />
		{:else if responseType === 'SingleChoiceSelection' || responseType === 'MultiChoiceSelection' || responseType === 'Boolean'}
			<svelte:component this={fields[responseType]} option={questionCard.Options} />
		{:else if !responseType}
			<div class="text-center text-red-500">No type selected.</div>
		{/if} -->

		{#if responseType === 'Range' || responseType === 'Rating'}
			<svelte:component this={fields[responseType]} {data} />
		{:else if responseType === 'Boolean'}
			<!-- Options Section -->
			<div class="mt-4">
				<Button
					type="button"
					on:click={addOption}
					class="btn btn-primary mb-4"
					disabled={responseType === 'Boolean' && options.length >= 2}
				>
					Add Option
				</Button>

				{#each options as option, index}
					<div class="mb-2 flex items-center">
						<Input
							type="text"
							name={`options[${index}].Sequence`}
							bind:value={option.Sequence}
							on:input={(e) => updateOption(index, 'Sequence', e.target.value)}
							placeholder={`Sequence of ${index + 1} Option`}
							class="mr-2 w-1/4"
						/>
						<Input
							type="text"
							name={`options[${index}].Data`}
							bind:value={option.Text}
							on:input={(e) => updateOption(index, 'Data', e.target.value)}
							placeholder={`Data for Option ${index + 1}`}
							class="mr-2 w-full"
						/>
						<Input
							type="hidden"
							name={`options[${index}].ImageUrl`}
							bind:value={option.ImageUrl}
							on:input={(e) => updateOption(index, 'ImageUrl', e.target.value)}
							placeholder={`Image URL (optional)`}
							class="w-1/4"
						/>
						<Button type="button" on:click={() => removeOption(index)} class="ml-2">
							<Icon icon="mingcute:delete-2-line" width="25" height="25" />
						</Button>
					</div>
				{/each}

				<!-- Hidden input field to store the options array -->
				<input type="hidden" name="options" value={JSON.stringify(options)} />
			</div>
		{:else if responseType === 'SingleChoiceSelection' || responseType === 'MultiChoiceSelection'}
			<!-- Options Section -->
			<div class="mt-4">
				<Button type="button" on:click={addOption} class="btn btn-primary mb-4">Add Option</Button>

				{#each options as option, index}
					<div class="mb-2 flex items-center">
						<Input
							type="text"
							name={`options[${index}].Sequence`}
							bind:value={option.Sequence}
							on:input={(e) => updateOption(index, 'Sequence', e.target.value)}
							placeholder={`Sequence of ${index + 1} Option`}
							class="mr-2 w-1/4"
						/>
						<Input
							type="text"
							name={`options[${index}].Data`}
							bind:value={option.Text}
							on:input={(e) => updateOption(index, 'Data', e.target.value)}
							placeholder={`Data for Option ${index + 1}`}
							class="mr-2 w-full"
						/>
						<Input
							type="hidden"
							name={`options[${index}].ImageUrl`}
							bind:value={option.ImageUrl}
							on:input={(e) => updateOption(index, 'ImageUrl', e.target.value)}
							placeholder={`Image URL (optional)`}
							class="w-1/4"
						/>
						<Button type="button" on:click={() => removeOption(index)} class="ml-2">
							<Icon icon="mingcute:delete-2-line" width="25" height="25" />
						</Button>
					</div>
				{/each}

				<!-- Hidden input field to store the options array -->
				<input type="hidden" name="options" value={JSON.stringify(options)} />
			</div>
		{/if}

		<Accordion.Root class="w-full ">
			<Accordion.Item value="item-1">
				<Accordion.Trigger>Score</Accordion.Trigger>
				<Accordion.Content
					><Form.Field {form} name="score">
						<Form.Control let:attrs>
							<!-- <Form.Label>Score</Form.Label> -->
							<Input {...attrs} bind:value={$formData.score} class="w-full" />
						</Form.Control>
						<Form.Description>This is the score for this question.</Form.Description>
						<Form.FieldErrors />
					</Form.Field></Accordion.Content
				>
			</Accordion.Item>

			<Accordion.Item value="item-2">
				<Accordion.Trigger>Correct Answer</Accordion.Trigger>
				<Accordion.Content>
					<Form.Field {form} name="correctAnswer">
						<Form.Control let:attrs>
							<!-- <Form.Label>Correct Answer</Form.Label> -->
							<Input {...attrs} bind:value={$formData.correctAnswer} class="w-full" />
						</Form.Control>
						<Form.Description>Correct answer for the question.</Form.Description>
						<Form.FieldErrors />
					</Form.Field>
				</Accordion.Content>
			</Accordion.Item>

			<Accordion.Item value="item-3">
				<Accordion.Trigger>Hint</Accordion.Trigger>
				<Accordion.Content>
					<Form.Field {form} name="hint">
						<Form.Control let:attrs>
							<!-- <Form.Label>Hint</Form.Label> -->
							<Input {...attrs} bind:value={$formData.hint} class="w-full" />
						</Form.Control>
						<Form.Description>Hint for this question.</Form.Description>
						<Form.FieldErrors />
					</Form.Field>
				</Accordion.Content>
			</Accordion.Item>

			<Accordion.Item value="item-4">
				<Accordion.Trigger>Image</Accordion.Trigger>
				<Accordion.Content>
					<Form.Field {form} name="questionImageUrl">
						<Form.Control let:attrs>
							<!-- <Form.Label>Question Image URL</Form.Label> -->
							<Input
								{...attrs}
								bind:value={$formData.questionImageUrl}
								class="w-full"
								type="file"
							/>
						</Form.Control>
						<Form.Description>This is the image URL for the question.</Form.Description>
						<Form.FieldErrors />
					</Form.Field>
				</Accordion.Content>
			</Accordion.Item>
		</Accordion.Root>
		<Button type="submit" class="mx-auto mt-5 w-full">Add Question</Button>
	</form>
</Card.Root>

<style>
	.custom-scrollbar::-webkit-scrollbar {
		width: 2px;
		height: 10px;
	}

	.custom-scrollbar::-webkit-scrollbar-track {
		background: #d70c0c;
	}

	.custom-scrollbar::-webkit-scrollbar-thumb {
		background: #888;
	}

	.custom-scrollbar::-webkit-scrollbar-thumb:hover {
		background: #555;
	}
</style>
