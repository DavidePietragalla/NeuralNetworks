<script lang="ts">
  import type { Join } from "$lib/model/join"; 
  import { ENode } from "$lib/model/node";
  import { Handle, Position, type NodeProps } from "@xyflow/svelte";

  let { id, data, selected }: NodeProps = $props();

  // Recuperiamo l'istanza dal modello
  let j: Join = $derived(ENode.fromId(data.enode as string)) as Join;

  function handleInternalClick() {
    console.log(`Join ${id} was clicked!`);
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
  <div class="join-container">
    <Handle type="target" position={Position.Top} />

    <div class="rhombus"></div>

    <Handle type="source" position={Position.Bottom} />
  </div>
</div>

<style>
  .node-wrapper {
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 4px; 
    border-radius: 8px;
    cursor: pointer;
    transition: filter 0.2s ease;
  }

  .join-container {
    position: relative;
    width: 40px;
    height: 40px;
  }

  .rhombus {
    width: 100%;
    height: 100%;
    background-color: #000000;
    clip-path: polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%);
  }  
</style>