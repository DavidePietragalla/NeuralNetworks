<script lang="ts">
  import { Handle, Position, type NodeProps } from "@xyflow/svelte";
  import { ENode } from "$lib/model/node";
  import { SubGraph } from "$lib/model/subgraph";

  let { id, data, selected }: NodeProps = $props();
  
  let subGraph = $derived(ENode.fromId(data.enode as string) as SubGraph);
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
  onclick={handleInternalClick}
  role="button"
  tabindex="0"
  onkeydown={handleKeyDown}
>
  <Handle type="target" position={Position.Top} />

  <div class="subgraph-header">
    {nodeName}
  </div>

  <div class="subgraph-body"></div>

  <Handle type="source" position={Position.Bottom} />
</div>

<style>
  .subgraph-wrapper {
    position: relative;
    width: 100%;
    height: 100%;
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