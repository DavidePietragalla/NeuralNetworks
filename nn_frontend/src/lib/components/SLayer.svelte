<script module>
</script>

<script lang="ts">
  import type { Module } from "$lib/model/module";

  import { ENode } from "$lib/model/node";

  import { Handle, Position, type NodeProps } from "@xyflow/svelte";
  let { id, data, selected }: NodeProps = $props();
  // Use $derived so 'l' updates if 'data.enode' changes
  // TODO: Capire se e' possibile passare solo dati specifici dentro data invece che l'intera istanza
  let l: Module = $derived(ENode.fromId(data.enode as string)) as Module;

  function handleInternalClick() {
    console.log(`Layer ${id} was clicked!`);
  }

  // Add a keyboard handler for accessibility
  function handleKeyDown(event: KeyboardEvent) {
    // Trigger the click action if the user presses Enter or Space
    if (event.key === "Enter" || event.key === " ") {
      // Prevent default scrolling when hitting Space
      event.preventDefault();
      handleInternalClick();
    }
  }
</script>

<div
  class="custom-node"
  class:selected
  onclick={handleInternalClick}
  onkeydown={handleKeyDown}
  role="button"
  tabindex="0"
>
  <Handle type="target" position={Position.Top} />

  <!-- <div> -->
  <!--   [{l.in_channels}] -->
  <!-- </div> -->

  <div class="node-label">
    {l.name}
  </div>
  <!-- <div> -->
  <!--   [{l.out_channels}] -->
  <!-- </div> -->
  <Handle type="source" position={Position.Bottom} />
</div>

<style>
  @import "../styles/layer.css";
</style>
