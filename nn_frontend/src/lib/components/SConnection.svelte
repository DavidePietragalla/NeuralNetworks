<script lang="ts">
  import { BaseEdge, getBezierPath } from "@xyflow/svelte";

  // Svelte 5 usa $props with any type to make all props optional
  let props = $props();

  // Deriviamo il path in modo reattivo
  let path = $derived.by(() => {
    const [p] = getBezierPath({
      sourceX: props.sourceX,
      sourceY: props.sourceY,
      sourcePosition: props.sourcePosition,
      targetPosition: props.targetPosition,
      targetX: props.targetX,
      targetY: props.targetY,
    });
    return p;
  });
</script>

<BaseEdge id={props.id} {path} markerEnd={props.markerEnd} style={props.style} />
