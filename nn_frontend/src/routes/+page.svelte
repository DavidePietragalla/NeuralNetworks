<script lang="ts">
  import {
    SvelteFlow,
    useSvelteFlow,
    Controls,
    Background,
    BackgroundVariant,
  } from "@xyflow/svelte";

  import "@xyflow/svelte/dist/style.css";

  import SLayer from "../lib/components/SLayer.svelte";
  import SJoin from "../lib/components/SJoin.svelte";
  import SConnection from "$lib/components/SConnection.svelte";
  import SSubGraph from "../lib/components/SSubGraph.svelte";
  import { Diagram } from "$lib/diagram.svelte";

  import SIstantiator from "$lib/components/SIstantiator.svelte";

  import {
    convert,
    exportToJson,
    importFromJson,
    loadFromFile,
  } from "$lib/utils";

  import { ENode } from "$lib/model/node";
  import { VNode } from "$lib/view/node";
  import { type Node as FlowNode } from "@xyflow/svelte";
  import type { NodeTargetEventWithPointer } from "@xyflow/svelte";

  let selectedId = $state<string | null>(null);
  let selectedType = $state<"node" | "edge" | null>(null);

  let istantiate: boolean = $state(false);
  let istantiateJoin: boolean = $state(false);
  let instantiateImport: boolean = $state(false);

  let editTargetId = $state<string | null>(null);

  let d = new Diagram();

  const {
    screenToFlowPosition,
    getViewport,
    getIntersectingNodes,
    updateNode,
  } = useSvelteFlow();

  function getCenterCoordinates() {
    const wrapper = document.querySelector(".flow-wrapper");
    if (!wrapper) return { x: 100, y: 100 };

    const rect = wrapper.getBoundingClientRect();

    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const rawPos = screenToFlowPosition({ x: centerX, y: centerY });
    return {
      x: rawPos.x - 50,
      y: rawPos.y - 30,
    };
  }

  function deleteSelectedElement() {
    if (!selectedId || !selectedType) return;

    if (selectedType === "node") {
      d.deleteNode(selectedId);
    } else if (selectedType === "edge") {
      d.deleteEdge(selectedId);
    }

    selectedId = null;
    selectedType = null;
  }

  function onconnect(connection: any) {
    d.addConnection(connection);
  }

  function handleNodeClick({ event, node }: any) {
    selectedId = node.id;
    selectedType = "node";
  }

  function handleEdgeClick({ event, edge }: any) {
    selectedId = edge.id;
    selectedType = "edge";
  }

  function handleNodeDoubleClick({ event, node }: any) {
    selectedId = node.id;
    selectedType = "node";
    const nodeModel = ENode.fromId(node.id);

    if (nodeModel && nodeModel.getType() === "Module") {
      editTargetId = node.id;
      istantiate = true;
    } else if (nodeModel && nodeModel.getType() === "SubGraph") {
      const currentName = (nodeModel as any).name;
      const newName = prompt("Modifica nome Sottoschema:", currentName);
      if (newName && newName.trim() !== "") {
        d.updateSubGraph(node.id, newName);
      }
    }
  }

  function handleNodeDragStop({
    event,
    targetNode,
  }: {
    event: MouseEvent | TouchEvent;
    targetNode: any;
  }) {
    if (!targetNode || !targetNode.id) {
      return;
    }

    console.log("=== handleNodeDragStop ===");
    console.log("targetNode id:", targetNode.id);
    console.log("targetNode position:", targetNode.position);
    console.log("targetNode type:", targetNode.type);

    const allNodes = d.nodes;
    console.log("All nodes in diagram:", allNodes.length);
    allNodes.forEach((n: any, idx: number) => {
      console.log(`  [${idx}] ${n.id} (type: ${n.type})`);
    });

    const intersections = getIntersectingNodes(targetNode).filter((n) => {
      console.log("Checking intersection:", n?.id, "type:", n?.type);
      return n.type === "SubGraph";
    });
    console.log("Intersecting SubGraphs found:", intersections.length);
    intersections.forEach((n: any) => {
      console.log("  -", n.id, "position:", n.position);
    });

    const targetGroup = intersections[0];
    console.log("targetGroup:", targetGroup?.id);

    const nodeIndex = d.nodes.findIndex((n: any) => n.id === targetNode.id);
    console.log("Node index in d.nodes:", nodeIndex);
    if (nodeIndex === -1) {
      console.log(`WARNING: node not found`, targetNode);
      return;
    }

    let targetVNode: VNode = d.nodes[nodeIndex];
    console.log("targetVNode parentId:", targetVNode.parentId);
    console.log("targetVNode position (before):", targetVNode.position);

    if (targetGroup === undefined) {
      console.log("targetGroup is undefined - no SubGraph detected under cursor");
    }

    if (targetGroup && targetGroup.id !== targetNode.id) {
      if (targetVNode.parentId !== targetGroup.id) {
        console.log("FUNZIONE CHIAMATA");
        // Find the parent (SubGraph) node index
        const parentIndex = d.nodes.findIndex((n: any) => n.id === targetGroup.id);
        const childIndex = nodeIndex;

        // Reorder: parent must come before child in the nodes array
        let newNodes = [...d.nodes];
        if (parentIndex < childIndex) {
          // Remove child from current position
          const childNode = newNodes.splice(childIndex, 1)[0];
          // Insert child right after parent
          newNodes.splice(parentIndex + 1, 0, childNode);
          d.nodes = newNodes;
        }

        // Update VNode
        targetVNode.parentId = targetGroup.id;
        // Update position to be relative to parent
        const relativeX = targetNode.position.x - targetGroup.position.x;
        const relativeY = targetNode.position.y - targetGroup.position.y;
        console.log("targetNode.position:", targetNode.position);
        console.log("targetGroup.position:", targetGroup.position);
        console.log("Calculated relative position:", { x: relativeX, y: relativeY });
        targetVNode.position = { x: relativeX, y: relativeY };
        // Sync with SvelteFlow
        console.log("Calling updateNode with:", {
          parentId: targetGroup.id,
          position: { x: relativeX, y: relativeY },
        });
        updateNode(targetNode.id, {
          parentId: targetGroup.id,
          position: { x: relativeX, y: relativeY },
        });
        console.log("After updateNode, d.nodes length:", d.nodes.length);
        d.nodes.forEach((n: any, idx: number) => {
          console.log(`  [${idx}] ${n.id} parentId: ${n.parentId} position: ${JSON.stringify(n.position)}`);
        });
      }
    } else if (!targetGroup && targetVNode.parentId) {
      console.log("FUNZIONE NON CHIAMATA");
      const oldParent = d.nodes.find((n: any) => n.id === targetVNode.parentId);
      if (oldParent) {
        // Reorder: remove child from after parent, put at end
        const parentIndex = d.nodes.findIndex((n: any) => n.id === oldParent.id);
        const childIndex = d.nodes.findIndex((n: any) => n.id === targetNode.id);
        if (childIndex > parentIndex) {
          let newNodes = [...d.nodes];
          const childNode = newNodes.splice(childIndex, 1)[0];
          newNodes.push(childNode);
          d.nodes = newNodes;
        }
      }
      // Update VNode
      targetVNode.parentId = undefined;
      targetVNode.extent = undefined;
      // Update position to be absolute (relative to canvas)
      if (oldParent) {
        targetVNode.position = {
          x: targetNode.position.x + oldParent.position.x,
          y: targetNode.position.y + oldParent.position.y,
        };
      }
      // Sync with SvelteFlow
      updateNode(targetNode.id, {
        parentId: undefined,
        extent: undefined,
        position: targetVNode.position,
      });
    }
  }

  function handlePaneClick({ event }: any) {
    selectedId = null;
    selectedType = null;
  }

  function openCreateModal(e: Event) {
    e.stopPropagation();
    editTargetId = null;
    istantiate = true;
  }

  function openEditModal() {
    if (selectedId && selectedType === "node") {
      const nodeModel = ENode.fromId(selectedId);

      if (nodeModel && nodeModel.getType() === "Module") {
        editTargetId = selectedId;
        istantiate = true;
      } else if (nodeModel && nodeModel.getType() === "Join") {
        editTargetId = selectedId;
        istantiateJoin = true;
      } else if (nodeModel && nodeModel.getType() === "SubGraph") {
        const currentName = (nodeModel as any).name;
        const newName = prompt("Modifica nome Sottoschema:", currentName);
        if (newName && newName.trim() !== "") {
          d.updateSubGraph(selectedId, newName);
        }
      }
    }
  }

  function closeModal() {
    istantiate = false;
    editTargetId = null;
  }

  function handleSaveNode(data: any) {
    if (editTargetId) {
      d.updateModule(
        editTargetId,
        data.stereotype,
        data.name,
        data.values,
        data.color,
        data.width,
        data.height,
      );
    } else {
      const coords = getCenterCoordinates();
      d.addModule(
        data.stereotype,
        data.name,
        data.values,
        data.color,
        data.width,
        data.height,
        coords.x,
        coords.y,
      );
    }
    closeModal();
  }

  function openJoinModal(e: Event) {
    e.stopPropagation();
    editTargetId = null;
    istantiateJoin = true;
  }

  function closeJoinModal() {
    istantiateJoin = false;
    editTargetId = null;
  }

  function handleSelectJoin(stereotype: any) {
    if (editTargetId) {
      d.updateJoin(editTargetId, stereotype);
    } else {
      const coords = getCenterCoordinates();
      d.addJoin(stereotype, coords.x, coords.y);
    }
    closeJoinModal();
  }

  function handleAddSubGraph(): VNode | null {
    const name = prompt("Inserisci il nome del nuovo Schema:", "Nuovo Schema");
    if (name) {
      const coords = getCenterCoordinates();
      return d.addSubGraph(name, coords.x, coords.y);
    }
    return null;
  }

  function openImportModal(e: Event) {
    e.stopPropagation();
    instantiateImport = true;
  }

  function closeImportModal() {
    instantiateImport = false;
  }

  function handleImportFromJson(mode: string) {
    if (mode === "subgraph") {
      loadFromFile(d, handleAddSubGraph());
    } else {
      loadFromFile(d);
    }

    closeImportModal();
  }

  const nodeTypes = { Module: SLayer, Join: SJoin, SubGraph: SSubGraph };
  const edgeTypes = { connection: SConnection };
</script>

<div class="app-container">
  <div class="toolbar">
    <button onclick={openCreateModal}>➕ Aggiungi Module</button>

    <button onclick={handleAddSubGraph}>📦 Aggiungi SubGraph</button>

    <button
      onclick={openEditModal}
      disabled={selectedType !== "node"}
      class:active={selectedType === "node"}>✏️ Modifica</button
    >

    <button onclick={openJoinModal}>🔗 Inserisci Join</button>

    <button
      onclick={deleteSelectedElement}
      disabled={!selectedId}
      class:danger={selectedId !== null}>❌ Elimina</button
    >

    <div class="divider"></div>
    <button onclick={() => exportToJson(d)}>💾 Esporta JSON</button>
    <button onclick={openImportModal}>📂 Carica JSON</button>
    <button onclick={() => convert(d)}>💾 Converti </button>
  </div>

  <div class="flow-wrapper">
    <SvelteFlow
      bind:nodes={d.nodes}
      edges={d.edges}
      {nodeTypes}
      {edgeTypes}
      fitView
      onnodeclick={handleNodeClick}
      onedgeclick={handleEdgeClick}
      onpaneclick={handlePaneClick}
      {onconnect}
      onnodedragstop={handleNodeDragStop}
    >
      <Controls />
      <Background variant={BackgroundVariant.Dots} />
    </SvelteFlow>
  </div>
</div>

{#if istantiate}
  <div class="modal-overlay" role="dialog">
    <div class="modal-container">
      <div class="modal-body">
        <SIstantiator
          diagram={d}
          editNodeId={editTargetId}
          onSave={handleSaveNode}
          onCancel={closeModal}
        />
      </div>

      <button class="btn-close" onclick={closeModal}> Chiudi </button>
    </div>
  </div>
{/if}

{#if instantiateImport}
  <div class="modal-overlay" role="dialog">
    <div class="modal-container" style="max-width: 400px; text-align: center;">
      <div class="modal-body">
        <h3 style="margin-bottom: 20px;">
          In che formato vuoi importare il diagramma?
        </h3>
        <div style="display: flex; flex-direction: column; gap: 10px;">
          <button
            class="join-option-btn"
            onclick={() => handleImportFromJson("subgraph")}
            style="padding: 10px; font-size: 16px; cursor: pointer;"
          >
            {"Sottografo"}
          </button>
          <button
            class="join-option-btn"
            onclick={() => handleImportFromJson("diagram")}
            style="padding: 10px; font-size: 16px; cursor: pointer;"
          >
            {"Diagramma"}
          </button>
        </div>
      </div>
      <button
        class="btn-close"
        style="margin-top: 20px;"
        onclick={closeImportModal}
      >
        Annulla
      </button>
    </div>
  </div>
{/if}

{#if istantiateJoin}
  <div class="modal-overlay" role="dialog">
    <div class="modal-container" style="max-width: 400px; text-align: center;">
      <div class="modal-body">
        <h3 style="margin-bottom: 20px;">Seleziona il tipo di Join</h3>
        <div style="display: flex; flex-direction: column; gap: 10px;">
          {#each d.joins as joinStereotype}
            <button
              class="join-option-btn"
              onclick={() => handleSelectJoin(joinStereotype)}
              style="padding: 10px; font-size: 16px; cursor: pointer;"
            >
              {joinStereotype.name}
            </button>
          {/each}

          {#if d.joins.length === 0}
            <p>Nessun Join trovato nella cartella.</p>
          {/if}
        </div>
      </div>
      <button
        class="btn-close"
        style="margin-top: 20px;"
        onclick={closeJoinModal}
      >
        Annulla
      </button>
    </div>
  </div>
{/if}

<style>
  @import "../lib/styles/page.css";
</style>
