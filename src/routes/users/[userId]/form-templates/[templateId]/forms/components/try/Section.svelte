
<script lang="ts">
  export let section;
  export let onDrop;
</script>

<div class="border p-3" on:drop={onDrop}>
  <h2>{section.name}</h2>
  <slot></slot>
</div>
