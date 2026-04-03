<script lang="ts">
  import type { Module } from "$lib/model/module";
  import { ENode } from "$lib/model/node";
  import { Handle, Position, type NodeProps } from "@xyflow/svelte";

  let { id, data, selected }: NodeProps = $props();

  let l: Module = $derived(ENode.fromId(data.enode as string)) as Module;

  let nodeColor = $derived(data.color || "#4779c4");
  let nodeWidth = $derived(data.width || "100px");
  let nodeHeight = $derived(data.height || "60px");

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
  class="custom-node"
  class:selected
  onclick={handleInternalClick}
  onkeydown={handleKeyDown}
  role="button"
  tabindex="0"
  style="--node-bg-color: {nodeColor}; --node-min-width: {nodeWidth}; --node-min-height: {nodeHeight};"
>
  <Handle type="target" position={Position.Top} />

  {#if inFeatures !== undefined}
    <div class="features-label">
      [{inFeatures}]
    </div>
  {/if}

  <div class="node-label">
    {l.name}
  </div>

  {#if outFeatures !== undefined}
    <div class="features-label">
      [{outFeatures}]
    </div>
  {/if}

  <Handle type="source" position={Position.Bottom} />
</div>

<style>
  @import "../styles/layer.css";
</style>
