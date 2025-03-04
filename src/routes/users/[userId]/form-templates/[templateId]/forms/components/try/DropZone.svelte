
<script lang="ts">
  export let onDrop;
</script>

<div class="border-dashed border-2 p-4" on:drop={onDrop}>
  <slot></slot>
</div>