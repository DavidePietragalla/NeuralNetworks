<script module>
</script>

<script lang="ts">
  import { Layer, ENode } from "$lib/utils.svelte";
  import { Handle, Position, type NodeProps } from "@xyflow/svelte";
  let { id, data, selected }: NodeProps = $props();
  // Use $derived so 'l' updates if 'data.enode' changes
  // TODO: Capire se e' possibile passare solo dati specifici dentro data invece che l'intera istanza
  let l: Layer = $derived(ENode.fromId(data.enode as string)) as Layer;

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

  <div class="node-label">
    {l.name}
  </div>

  <Handle type="source" position={Position.Bottom} />
</div>

<style>
  /* Give the node a shape, background, and border so it's visible! */
  .custom-node {
    padding: 15px 20px;
    background: white;
    border: 2px solid #2563eb;
    border-radius: 8px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    min-width: 100px;
    text-align: center;
  }

  .node-label {
    font-weight: bold;
    color: #333;
  }

  /* Style for when the node is selected */
  .custom-node.selected {
    border-color: #22c55e;
  }
</style>
