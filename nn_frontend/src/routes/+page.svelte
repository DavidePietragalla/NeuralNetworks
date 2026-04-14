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

  import SIstantiator from "$lib/components/SIstantiator.svelte";

  import {
    convert,
    exportToJson,
    importFromJson,
    loadFromFile,
  } from "$lib/utils";

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
