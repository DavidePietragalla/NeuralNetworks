<script lang="ts">
  import { Handle, Position, type NodeProps } from "@xyflow/svelte";
  import { ENode } from "$lib/model/node";
  import type { Fork } from "$lib/model/fork";

  let { id, data, selected }: NodeProps = $props();
  let f: Fork = $derived(ENode.fromId(data.enode as string) as Fork);

  let outputsCount = $state(2);
  $effect(() => {
    if (f) {
      outputsCount = f.numberOfBranches;
    }
  });

  function increase(e: Event) {
    e.stopPropagation();
    if (f) {
      f.numberOfBranches++;
      outputsCount = f.numberOfBranches;
    }
  }

  function decrease(e: Event) {
    e.stopPropagation();
    // Limite minimo impostato a 2
    if (f && f.numberOfBranches > 2) {
      f.numberOfBranches--;
      outputsCount = f.numberOfBranches;
    }
  }

  function handleInternalClick() {
    console.log(`Fork ${id} was clicked!`);
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
  <button class="btn-branch" onclick={decrease} disabled={outputsCount <= 2}>
    -
  </button>

  <div class="fork-center">
    <Handle type="target" position={Position.Top} id="in" />

    <div 
      class="fork-line" 
      style={`width: ${Math.max(120, outputsCount * 30)}px;`}
    ></div>

    {#each Array(outputsCount) as _, i}
      <Handle
        type="source"
        position={Position.Bottom}
        id={`out-${i}`}
        style={`left: ${((i + 1) * 100) / (outputsCount + 1)}%;`}
      />
    {/each}
  </div>

  <button class="btn-branch" onclick={increase}>
    +
  </button>
</div>

<style>
  .node-wrapper {
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 8px; /* Spazio tra bottoni e linea */
    padding: 10px;
    cursor: pointer;
  }

  .fork-center {
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
    /* Spazio verticale per gli Handle */
    padding: 10px 0; 
  }

  .fork-line {
    height: 6px;
    background-color: #000000;
    border-radius: 3px;
    /* Aggiunge un'animazione fluida quando la linea si allarga/restringe */
    transition: width 0.3s ease, box-shadow 0.2s ease, background-color 0.2s ease;
  }

  /* --- Stile dei bottoni +/- --- */
  .btn-branch {
    background: transparent;
    border: none;
    font-size: 1.5rem;
    font-weight: bold;
    color: #666;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    transition: background 0.2s, color 0.2s;
  }

  .btn-branch:disabled {
    opacity: 0.2;
    cursor: not-allowed;
  }
</style>