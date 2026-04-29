<script lang="ts">
  import {
    Handle,
    Position,
    NodeResizer,
    type NodeProps
  } from "@xyflow/svelte";
  import { ENode } from "$lib/model/node";
  import { SubGraph } from "$lib/model/subgraph";

  let { id, data, selected, width, height }: NodeProps = $props();

  let subGraph = $derived(ENode.fromId(data.enode as string) as SubGraph);
  // Use node's width/height if provided, otherwise fall back to data
  let subGraphWidth = $derived((typeof width === 'number' && `${width}px`) || data.width || "400px");
  let subGraphHeight = $derived((typeof height === 'number' && `${height}px`) || data.height || "300px");
  let nodeName = $derived((data._tick, subGraph?.name || "SubGraph"));

  function handleInternalClick() {
    console.log(`SubGraph ${id} was clicked!`);
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleInternalClick();
    }
  }
</script>

<div
  class="subgraph-wrapper"
  class:selected
  style="width: {subGraphWidth}; height: {subGraphHeight};"
  onclick={handleInternalClick}
  role="button"
  tabindex="0"
  onkeydown={handleKeyDown}
>
  <div class="subgraph-header">
    {nodeName}
  </div>

  <div class="subgraph-body"></div>

  <NodeResizer
    color="#ff0072"
    onResize={(event: any) => {
      // Update data dimensions during resize (not just at end)
      // SvelteFlow updates node.width/height directly in store
      // We also update data to keep CSS synced
      data.width = `${event.width}px`;
      data.height = `${event.height}px`;
    }}
    onResizeEnd={(event: any) => {
      // Trigger reactivity after resize ends
      data._tick = Date.now();
    }}
  />
</div>

<style>
  .subgraph-wrapper {
    position: relative;
    border-radius: 8px;
    display: flex;
    flex-direction: column;
  }
  .subgraph-wrapper.selected {
    border-color: #ff0072 !important;
  }
  .subgraph-header {
    background: #4779c4;
    color: white;
    padding: 4px 8px;
    font-size: 12px;
    font-weight: bold;
    border-top-left-radius: 6px;
    border-top-right-radius: 6px;
  }
  .subgraph-body {
    flex-grow: 1;
  }
</style>

