<script lang="ts">
  import type { Module } from "$lib/model/module";
  import { ENode } from "$lib/model/node";
  import {
    Handle,
    Position,
    NodeResizer,
    type NodeProps
  } from "@xyflow/svelte";

  let { id, data, selected, width, height }: NodeProps = $props();

  let moduleNode = $derived(ENode.fromId(data.enode as string) as Module | undefined);
  let nodeColor = $derived(data.color || "#4779c4");
  // Use node's width/height if provided, otherwise fall back to data
  let nodeWidth = $derived((width && `${width}px`) || data.width || "100px");
  let nodeHeight = $derived((height && `${height}px`) || data.height || "60px");

  let nodeName = $derived((data._tick, moduleNode?.name));
  // let isSubgraph = $derived((data._tick, l.getType() === "SubGraph"));

  let isInput = $derived(
    (data._tick,
    moduleNode?.getType() === "Module" &&
      moduleNode.stereotype.category.toLowerCase() === "input"),
  );

  let isLoss = $derived(
    (data._tick,
    moduleNode?.getType() === "Module" &&
      moduleNode.stereotype.category.toLowerCase().includes("loss")),
  );

  let inFeatures = $derived(
    (data._tick,
    moduleNode?.getType() === "Module" &&
      moduleNode.params.find(
        (p: { name: string }) =>
          p.name === "in_features" ||
          p.name === "in_channels" ||
          p.name === "num_features",
      )?.value),
  );
  let outFeatures = $derived(
    (data._tick,
    moduleNode?.getType() === "Module" &&
      moduleNode.params.find(
        (p: { name: string }) => p.name === "out_features" || p.name === "out_channels",
      )?.value),
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
        <span class="node-label">{nodeName}</span>
        {#if outFeatures !== undefined}
          <span class="features-label">[{outFeatures}]</span>
        {/if}
      </div>

      <Handle type="source" position={Position.Bottom} />
    </div>
  {:else}
    <div
      class="custom-node"
      style="--node-bg-color: {nodeColor}; --node-width: {nodeWidth}; --node-height: {nodeHeight};"
    >
      <Handle type="target" position={Position.Top} />

      {#if inFeatures !== undefined}
        <div class="features-label">[{inFeatures}]</div>
      {/if}

      <div class="node-label">{nodeName}</div>

      {#if outFeatures !== undefined}
        <div class="features-label">[{outFeatures}]</div>
      {/if}

      {#if !isLoss}
        <Handle type="source" position={Position.Bottom} />
      {/if}

      <NodeResizer
        color="#ff0072"
        onResize={(event: any) => {
          // Update data dimensions during resize (not just at end)
          data.width = `${event.width}px`;
          data.height = `${event.height}px`;
        }}
        onResizeEnd={(event: any) => {
          // Trigger reactivity after resize ends
          data._tick = Date.now();
        }}
      />
    </div>
  {/if}
</div>

<style>
  @import "../styles/layer.css";

  .node-wrapper {
    position: relative;
  }

  .uml-input-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
  }

  .uml-circle {
    width: 30px;
    height: 30px;
    background-color: #333;
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
