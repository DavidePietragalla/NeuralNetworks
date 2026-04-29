<script lang="ts">
  import {
    Handle,
    Position,
    NodeResizer,
    useStore,
    type NodeProps
  } from "@xyflow/svelte";
  import { ENode } from "$lib/model/node";
  import { SubGraph } from "$lib/model/subgraph";

  let { id, data, selected, width, height }: NodeProps = $props();

  let subGraph = $derived(ENode.fromId(data.enode as string) as SubGraph);
  
  // Get the store to access the current node dimensions
  let store = useStore();
  
  // Use the store's node dimensions (updated by NodeResizer)
  let currentNode = $derived(store.nodes.find(n => n.id === id));
  
  let subGraphWidth = $derived.by(() => {
    const nodeWidth = currentNode?.width;
    if (nodeWidth !== undefined && nodeWidth !== null) {
      return `${nodeWidth}px`;
    }
    return data.width || "400px";
  });
  
  let subGraphHeight = $derived.by(() => {
    const nodeHeight = currentNode?.height;
    if (nodeHeight !== undefined && nodeHeight !== null) {
      return `${nodeHeight}px`;
    }
    return data.height || "300px";
  });
  
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

