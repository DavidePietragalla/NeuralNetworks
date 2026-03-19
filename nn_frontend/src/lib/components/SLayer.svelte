<script module>
</script>

<script lang="ts">
  import { Layer } from "$lib/utils.svelte";
  import { Handle, Position, type NodeProps } from "@xyflow/svelte";
  let { id, data }: NodeProps = $props();
  // Use $derived so 'l' updates if 'data.enode' changes
  let l = $derived(data.enode); // Questo è il modello di Layer.
</script>

<div class="custom-node">
  <Handle type="target" position={Position.Top} />

  <div class="node-label">
    {data.label}
  </div>

  <Handle type="source" position={Position.Bottom} />
</div>

<style>
  /* Give the node a shape, background, and border so it's visible! */
  .custom-node {
    padding: 15px 20px;
    background: white;
    border: 2px solid #2563eb;
    border-radius: 8px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    min-width: 100px;
    text-align: center;
  }

  .node-label {
    font-weight: bold;
    color: #333;
  }
</style>
