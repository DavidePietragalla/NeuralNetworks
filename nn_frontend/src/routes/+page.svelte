<script lang="ts">
  import {
    SvelteFlow,
    Controls,
    Background,
    BackgroundVariant,
  } from "@xyflow/svelte";

  import "@xyflow/svelte/dist/style.css";

  import SLayer from "../lib/components/SLayer.svelte";
  import SConnection from "$lib/components/SConnection.svelte";
  import { Diagram } from "$lib/diagram.svelte";
  import { ENode } from "$lib/model/node";

  import SIstantiator from "$lib/components/SIstantiator.svelte";

  let selectedId = $state<string | null>(null);
  let istantiate: boolean = $state(false);

  // 1. NUOVO STATO: Ricorda quale nodo stiamo aprendo nella modale
  let editTargetId = $state<string | null>(null);

  let d = new Diagram();

  function deleteSelectedNode() {
    if (selectedId) {
      d.deleteNode(selectedId);
      selectedId = null;
    }
  }

  function onconnect(connection: any) {
    d.addConnection(connection);
  }

  function handleNodeClick({ event, node }: any) {
    selectedId = node.id;
  }

  // 2. EXTRA UX: Aprire la modifica con un doppio click sul nodo!
  function handleNodeDoubleClick({ event, node }: any) {
    selectedId = node.id;
    editTargetId = node.id;
    istantiate = true;
  }

  function handlePaneClick({ event }: any) {
    selectedId = null;
  }

  function exportToJson() {
    console.log(ENode.allNodes);
    const flowState = {
      model: Object.fromEntries(ENode.allNodes),
      view: { nodes: d.nodes, edges: d.edges },
    };
    const jsonString = JSON.stringify(flowState, null, 2);
    console.log("JSON Esportato:", jsonString);
    alert("JSON generato! Guarda la console.");
    return jsonString;
  }

  function importFromJson(jsonString: string) {
    try {
      const parsedData = JSON.parse(jsonString);
      d.nodes = parsedData.nodes || [];
      d.edges = parsedData.edges || [];

      if (d.nodes.length > 0) {
        const ids = d.nodes.map((n) => parseInt(n.id.replace("Node_", "")));
        ENode.counter = Math.max(...ids) + 1;
      }
    } catch (error) {
      console.error("Errore durante il parsing del JSON:", error);
      alert("Il JSON fornito non è valido.");
    }
  }

  function testImport() {
    const dummyJson = `{"nodes":[{"id":"layer_1","type":"default","position":{"x":100,"y":100},"data":{"label":"Input Layer"}}],"edges":[]}`;
    importFromJson(dummyJson);
  }

  // 3. FUNZIONI PER GESTIRE L'APERTURA DELLA MODALE
  function openCreateModal(e: Event) {
    e.stopPropagation();
    editTargetId = null; // Ci assicuriamo che sia null per la Creazione
    istantiate = true;
  }

  function openEditModal() {
    if (selectedId) {
      editTargetId = selectedId; // Impostiamo l'ID da Modificare
      istantiate = true;
    }
  }

  function closeModal() {
    istantiate = false;
    editTargetId = null; // Pulizia quando si chiude
  }

  const nodeTypes = { Module: SLayer };
  const edgeTypes = { connection: SConnection };
</script>

<div class="app-container">
  <div class="toolbar">
    <button onclick={openCreateModal}>➕ Aggiungi Module</button>

    <button
      onclick={openEditModal}
      disabled={!selectedId}
      class:active={selectedId !== null}>✏️ Modifica</button
    >

    <button
      onclick={deleteSelectedNode}
      disabled={!selectedId}
      class:danger={selectedId !== null}>❌ Elimina</button
    >

    <div class="divider"></div>
    <button onclick={exportToJson}>💾 Esporta JSON</button>
    <button onclick={testImport}>📂 Testa Import JSON</button>
  </div>

  <div class="flow-wrapper">
    <SvelteFlow
      bind:nodes={d.nodes}
      edges={d.edges}
      {nodeTypes}
      {edgeTypes}
      fitView
      onnodeclick={handleNodeClick}
      onnodedoubleclick={handleNodeDoubleClick}
      onpaneclick={handlePaneClick}
      {onconnect}
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
          onSuccess={closeModal}
        />
      </div>

      <button class="btn-close" onclick={closeModal}> Chiudi </button>
    </div>
  </div>
{/if}

<style>
  @import "../lib/styles/page.css";
</style>
