<script lang="ts">
  import {
    Handle,
    Position,
    NodeResizer,
    useStore,
    useSvelteFlow,
    type NodeProps
  } from "@xyflow/svelte";
  import { ENode } from "$lib/model/node";
  import { SubGraph } from "$lib/model/subgraph";

  let { id, data, selected }: NodeProps = $props();

  const { updateNode } = useSvelteFlow();
  let store = useStore();
  
  let subGraph = $derived(ENode.fromId(data.enode as string) as SubGraph);
  let currentNode = $derived(store.nodes.find(n => n.id === id));
  let currentChildren = $derived(store.nodes.filter(n => n.parentId === id));

  // --- LOGICA DI AUTORESIZE ---
  $effect(() => {
    if (!currentNode) return;

    const padding = 40; 
    let minW = 400;
    let minH = 300;

    for (const child of currentChildren) {
      const cw = child.measured?.width ?? (typeof child.width === 'number' ? child.width : parseFloat(String(child.width || 100)));
      const ch = child.measured?.height ?? (typeof child.height === 'number' ? child.height : parseFloat(String(child.height || 60)));
      
      const rightEdge = child.position.x + cw + padding;
      const bottomEdge = child.position.y + ch + padding;

      if (rightEdge > minW) minW = rightEdge;
      if (bottomEdge > minH) minH = bottomEdge;
    }

    const currentW = typeof currentNode.width === 'number' ? currentNode.width : parseFloat(String(currentNode.width || 400));
    const currentH = typeof currentNode.height === 'number' ? currentNode.height : parseFloat(String(currentNode.height || 300));

    if (minW > currentW || minH > currentH) {
      updateNode(id, { 
        width: minW, 
        height: minH,
        style: currentNode.style?.replace(/width:\s*[^;]+/, `width: ${minW}px`).replace(/height:\s*[^;]+/, `height: ${minH}px`)
      });
    }
  });

  let displayWidth = $derived(`${currentNode?.width || 400}px`);
  let displayHeight = $derived(`${currentNode?.height || 300}px`);
  let nodeName = $derived((data._tick, subGraph?.name || "SubGraph"));

  // --- HANDLERS PER ACCESSIBILITÀ ---
  function handleInternalClick() {
    console.log(`SubGraph ${id} selezionato`);
  }

  function handleKeyDown(event: KeyboardEvent) {
    // Permette di "cliccare" usando Invio o Spazio quando il nodo è focalizzato
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleInternalClick();
    }
  }
</script>

<div
  class="subgraph-wrapper"
  class:selected
  style="width: {displayWidth}; height: {displayHeight};"
  onclick={handleInternalClick}
  onkeydown={handleKeyDown}
  role="button"
  tabindex="0"
>
  <div class="subgraph-header">
    {nodeName}
  </div>

  <div class="subgraph-body"></div>

  <NodeResizer color="#ff0072" minWidth={400} minHeight={300} />
</div>

<style>
  .subgraph-wrapper {
    position: relative;
    border-radius: 8px;
    display: flex;
    flex-direction: column;
    background-color: rgba(71, 121, 196, 0.1);
    border: 2px dashed #4779c4;
    box-sizing: border-box;
    cursor: pointer;
    transition: width 0.1s ease, height 0.1s ease;
  }
  
  .subgraph-wrapper:focus-visible {
    outline: 2px solid #ff0072;
    outline-offset: 2px;
  }

  .subgraph-wrapper.selected {
    border-color: #ff0072;
    border-style: solid;
  }

  .subgraph-header {
    background: #4779c4;
    color: white;
    padding: 4px 10px;
    font-size: 12px;
    font-weight: bold;
    border-top-left-radius: 6px;
    border-top-right-radius: 6px;
    user-select: none;
  }

  .subgraph-body {
    flex-grow: 1;
  }
</style>