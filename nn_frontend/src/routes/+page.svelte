<script lang="ts">
  import {
    SvelteFlow,
    Controls,
    Background,
    BackgroundVariant,
  } from "@xyflow/svelte";

  import "@xyflow/svelte/dist/style.css";

  import SLayer from "../lib/components/SLayer.svelte";
  import SJoin  from "../lib/components/SJoin.svelte";
  import SFork from "../lib/components/SFork.svelte";
  import SConnection from "$lib/components/SConnection.svelte";
  import { Diagram } from "$lib/diagram.svelte";

  import SIstantiator from "$lib/components/SIstantiator.svelte";

  import {
    convert,
    exportToJson,
    importFromJson,
    loadFromFile,
  } from "$lib/utils";

  import { ENode } from "$lib/model/node";

  let selectedId = $state<string | null>(null);
  let selectedType = $state<'node' | 'edge' | null>(null);

  let istantiate: boolean = $state(false);

  // 1. NUOVO STATO: Ricorda quale nodo stiamo aprendo nella modale
  let editTargetId = $state<string | null>(null);

  let d = new Diagram();

  function deleteSelectedElement() {
    if (!selectedId || !selectedType) return;

    if (selectedType === 'node') {
      d.deleteNode(selectedId);
    } else if (selectedType === 'edge') {
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
    selectedType = 'node';
  }

  function handleEdgeClick({ event, edge }: any) {
    selectedId = edge.id;
    selectedType = 'edge';
  }

  function handleNodeDoubleClick({ event, node }: any) {
    selectedId = node.id;
    selectedType = 'node';

    const nodeModel = ENode.fromId(node.id);
    
    if (nodeModel && nodeModel.getType() === "Module") {
      editTargetId = node.id;
      istantiate = true;
    }
  }

  function handlePaneClick({ event }: any) {
    selectedId = null;
    selectedType = null;
  }

  // 3. FUNZIONI PER GESTIRE L'APERTURA DELLA MODALE
  function openCreateModal(e: Event) {
    e.stopPropagation();
    editTargetId = null; // Ci assicuriamo che sia null per la Creazione
    istantiate = true;
  }

  function openEditModal() {
  if (selectedId && selectedType === 'node') {
    const nodeModel = ENode.fromId(selectedId);
    if (nodeModel && nodeModel.getType() === "Module") {
      editTargetId = selectedId; 
      istantiate = true;
    }
  }
}

  function closeModal() {
    istantiate = false;
    editTargetId = null; // Pulizia quando si chiude
  }

  function newJoin() {
    d.addJoin();
  }

  // TODO: Gli edge non distinguono i vari punti del fork e quindi va gestito.
  function newFork() {
    d.addFork();
  }

  const nodeTypes = { Module: SLayer, Join: SJoin, Fork: SFork };
  const edgeTypes = { connection: SConnection };
</script>

<div class="app-container">
  <div class="toolbar">
    <button onclick={openCreateModal}>➕ Aggiungi Module</button>

    <button
    onclick={openEditModal}
    disabled={selectedType !== 'node'}
    class:active={selectedType === 'node'}>✏️ Modifica</button
    >

    <button onclick={newJoin}>🔗 Inserisci Join</button> 

    <button onclick={newFork}>🔱 Inserisci Fork</button> 

    <button
      onclick={deleteSelectedElement}
      disabled={!selectedId}
      class:danger={selectedId !== null}>❌ Elimina</button
    >

    <div class="divider"></div>
    <button onclick={() => exportToJson(d)}>💾 Esporta JSON</button>
    <button onclick={() => loadFromFile(d)}>📂 Carica JSON</button>
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
