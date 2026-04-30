<script lang="ts">
  import {
    NodeResizer,
    useSvelteFlow,
    type NodeProps
  } from "@xyflow/svelte";
  import { ENode } from "$lib/model/node";
  import { SubGraph } from "$lib/model/subgraph";

  let { id, data, selected, width, height }: NodeProps = $props();

  const { updateNode } = useSvelteFlow();
  
  let subGraph = $derived(ENode.fromId(data.enode as string) as SubGraph);

  let displayWidth = $derived(`${width || 400}px`);
  let displayHeight = $derived(`${height || 300}px`);
  let nodeName = $derived((data._tick, subGraph?.name || "SubGraph"));

  // --- HANDLERS PER ACCESSIBILITÀ ---
  function handleInternalClick() {
    console.log(`SubGraph ${id} selezionato`);
  }

  function handleKeyDown(event: KeyboardEvent) {
    // Permette di "cliccare" usando Invio o Spazio quando il nodo è focalizzato
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleInternalClick();
    }
  }
</script>

<div
  class="subgraph-wrapper"
  class:selected
  style="width: {displayWidth}; height: {displayHeight};"
  onclick={handleInternalClick}
  onkeydown={handleKeyDown}
  role="button"
  tabindex="0"
>
  <div class="subgraph-header">
    {nodeName}
  </div>

  <div class="subgraph-body"></div>

  <NodeResizer color="#ff0072" minWidth={400} minHeight={300} />
</div>

<style>
  .subgraph-wrapper {
    position: relative;
    border-radius: 8px;
    display: flex;
    flex-direction: column;
    background-color: rgba(71, 121, 196, 0.1);
    border: 2px dashed #4779c4;
    box-sizing: border-box;
    cursor: pointer;
    transition: width 0.1s ease, height 0.1s ease;
  }
  
  .subgraph-wrapper:focus-visible {
    outline: 2px solid #ff0072;
    outline-offset: 2px;
  }

  .subgraph-wrapper.selected {
    border-color: #ff0072;
    border-style: solid;
  }

  .subgraph-header {
    background: #4779c4;
    color: white;
    padding: 4px 10px;
    font-size: 12px;
    font-weight: bold;
    border-top-left-radius: 6px;
    border-top-right-radius: 6px;
    user-select: none;
  }

  .subgraph-body {
    flex-grow: 1;
  }
</style>