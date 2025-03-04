

<script lang="ts">
  export let subsection;
  export let onDrop;
</script>

<div class="border p-2" on:drop={onDrop}>
  <h3>{subsection.name}</h3>
  <slot></slot>
</div>