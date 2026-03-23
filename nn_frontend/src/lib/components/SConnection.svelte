<script lang="ts">
  import { BaseEdge, getBezierPath } from "@xyflow/svelte";

  // Svelte 5 usa $props
  let {
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    markerEnd,
    style,
  } = $props();

  // Deriviamo il path in modo reattivo
  let path = $derived.by(() => {
    const [p] = getBezierPath({
      sourceX,
      sourceY,
      sourcePosition,
      targetPosition,
      targetX,
      targetY,
    });
    return p;
  });
</script>

<BaseEdge {id} {path} {markerEnd} {style} />
