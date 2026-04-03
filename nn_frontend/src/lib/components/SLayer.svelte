<script lang="ts">
  import type { Module } from "$lib/model/module";
  import { ENode } from "$lib/model/node";
  import { Handle, Position, type NodeProps } from "@xyflow/svelte";

  let { id, data, selected }: NodeProps = $props();

  let l: Module = $derived(ENode.fromId(data.enode as string)) as Module;

  let nodeColor = $derived(data.color || "#4779c4");
  let nodeWidth = $derived(data.width || "100px");
  let nodeHeight = $derived(data.height || "60px");

  let isInput = $derived(l?.stereotype.category.toLowerCase() === "input");
  let isLoss = $derived("loss" in l?.stereotype.category.toLowerCase());

  let inFeatures = $derived(
    l?.params.find(
      (p) =>
        p.name === "in_features" ||
        p.name === "in_channels" ||
        p.name === "num_features",
    )?.value,
  );
  let outFeatures = $derived(
    l?.params.find(
      (p) => p.name === "out_features" || p.name === "out_channels",
    )?.value,
  );

  function handleInternalClick() {
    console.log(`Layer ${id} was clicked!`);
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleInternalClick();
    }
  }
</script>

<div
  class="node-wrapper"
  class:selected
  onclick={handleInternalClick}
  onkeydown={handleKeyDown}
  role="button"
  tabindex="0"
>
  {#if isInput}
    <div class="uml-input-container">
      <div class="uml-circle"></div>

      <div class="external-labels">
        <span class="node-label">{l.name}</span>
        {#if outFeatures !== undefined}
          <span class="features-label">[{outFeatures}]</span>
        {/if}
      </div>

      <Handle type="source" position={Position.Bottom} />
    </div>
  {:else}
    <div
      class="custom-node"
      style="--node-bg-color: {nodeColor}; --node-min-width: {nodeWidth}; --node-min-height: {nodeHeight};"
    >
      <Handle type="target" position={Position.Top} />

      {#if inFeatures !== undefined}
        <div class="features-label">[{inFeatures}]</div>
      {/if}

      <div class="node-label">{l.name}</div>

      {#if outFeatures !== undefined}
        <div class="features-label">[{outFeatures}]</div>
      {/if}

      {#if !isLoss}
        <Handle type="source" position={Position.Bottom} />
      {/if}
    </div>
  {/if}
</div>

<style>
  @import "../styles/layer.css";

  .node-wrapper {
    position: relative;
    /* Rimuove i bordi default di xyflow se presenti */
  }

  /* Stili specifici per l'Input UML */
  .uml-input-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
  }

  .uml-circle {
    width: 30px;
    height: 30px;
    background-color: #333; /* Cerchietto nero stile UML */
    border-radius: 50%;
    border: 3px solid #222;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }

  .external-labels {
    display: flex;
    flex-direction: column;
    align-items: center;
    pointer-events: none;
  }

  .features-label {
    font-size: 0.7rem;
    opacity: 0.85;
    font-family: monospace;
  }

  .node-label {
    font-weight: bold;
    font-size: 0.9rem;
  }
</style>
