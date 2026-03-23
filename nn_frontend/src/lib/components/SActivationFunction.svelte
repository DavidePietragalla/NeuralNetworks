<script lang="ts">
  import { ActivationFunction, ENode } from "$lib/utils.svelte";
  import { Handle, Position, type NodeProps } from "@xyflow/svelte";

  let { id, data, selected }: NodeProps = $props();

  let l: ActivationFunction = $derived(
    ENode.fromId(data.enode as string),
  ) as ActivationFunction;

  function handleInternalClick() {
    console.log(`ActivationFunction ${id} was clicked!`);
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
>
  <Handle type="target" position={Position.Top} />

  <div class="node-label">
    {l.name}
  </div>

  <Handle type="source" position={Position.Bottom} />
</div>

<style>
  .custom-node {
    /* Dimensioni fisse per renderlo un quadrato */
    width: 60px;
    height: 60px;

    /* Colore rosso */
    background: #ef4444; /* Un rosso moderno tipo Tailwind */
    border: 2px solid #b91c1c;
    border-radius: 4px; /* Ridotto il raggio per un look più compatto */

    /* Centrare il contenuto */
    display: flex;
    align-items: center;
    justify-content: center;

    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    cursor: pointer;
    transition: all 0.2s ease;
    box-sizing: border-box;
  }

  .node-label {
    font-weight: bold;
    color: white; /* Testo bianco per contrasto col rosso */
    font-size: 0.7rem; /* Testo più piccolo per stare nel quadrato */
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    padding: 2px;
  }

  /* Stato selezionato */
  .custom-node.selected {
    border-color: white;
    outline: 2px solid #ef4444;
    transform: scale(1.05);
  }
</style>
