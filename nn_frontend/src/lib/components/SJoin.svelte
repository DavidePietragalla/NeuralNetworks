<script lang="ts">
  import { Handle, Position, type NodeProps } from "@xyflow/svelte";
  import { ENode } from "$lib/model/node";
  import type { Join } from "$lib/model/join"; // Assuming a Join model exists

  let { id, data, selected }: NodeProps = $props();
  // Casting to Join model
  let j: Join = $derived(ENode.fromId(data.enode as string) as Join);

  let inputsCount = $state(2);

  $effect(() => {
    if (j) {
      inputsCount = j.numberOfInputs;
    }
  });

  function increase(e: Event) {
    e.stopPropagation();
    if (j) {
      j.numberOfInputs++;
      inputsCount = j.numberOfInputs;
    }
  }

  function decrease(e: Event) {
    e.stopPropagation();
    if (j && j.numberOfInputs > 2) {
      j.numberOfInputs--;
      inputsCount = j.numberOfInputs;
    }
  }

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
  <button class="btn-branch" onclick={decrease} disabled={inputsCount <= 2}>
    -
  </button>

  <div class="join-center">
    {#each Array(inputsCount) as _, i}
      <Handle
        type="target"
        position={Position.Top}
        id={`in-${i}`}
        style={`left: ${((i + 1) * 100) / (inputsCount + 1)}%;`}
      />
    {/each}

    <div class="join-line" style={`width: ${inputsCount * 30}px;`}></div>

    <Handle type="source" position={Position.Bottom} id="out" />
  </div>

  <button class="btn-branch" onclick={increase}> + </button>
</div>

<style>
  .node-wrapper {
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 8px;
    padding: 10px;
    cursor: pointer;
  }

  .join-center {
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 10px 0;
  }

  .join-line {
    height: 6px;
    background-color: #333;
    border-radius: 3px;
    transition: width 0.3s ease;
  }

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
    transition:
      background 0.2s,
      color 0.2s;
  }

  .btn-branch:disabled {
    opacity: 0.2;
    cursor: not-allowed;
  }
</style>

