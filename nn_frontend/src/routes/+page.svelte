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
  import SJoin  from "../lib/components/SJoin.svelte";
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
  let istantiateJoin: boolean = $state(false);

  let editTargetId = $state<string | null>(null);

  let d = new Diagram();

  const { screenToFlowPosition, getViewport } = useSvelteFlow();
  
  function getCenterCoordinates() {
    const wrapper = document.querySelector('.flow-wrapper');
    if (!wrapper) return { x: 100, y: 100 };

    const rect = wrapper.getBoundingClientRect();
    
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const rawPos = screenToFlowPosition({ x: centerX, y: centerY });
    return {
      x: rawPos.x - 50,
      y: rawPos.y - 30
    };
  }

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

  function openCreateModal(e: Event) {
    e.stopPropagation();
    editTargetId = null;
    istantiate = true;
  }

  function openEditModal() {
    if (selectedId && selectedType === 'node') {
      const nodeModel = ENode.fromId(selectedId);
      
      if (nodeModel && nodeModel.getType() === "Module") {
        editTargetId = selectedId; 
        istantiate = true;
      } else if (nodeModel && nodeModel.getType() === "Join") {
        editTargetId = selectedId;
        istantiateJoin = true;
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
        data.height
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
        coords.y
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

  const nodeTypes = { Module: SLayer, Join: SJoin};
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

    <button onclick={openJoinModal}>🔗 Inserisci Join</button> 

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
          onSave={handleSaveNode}
          onCancel={closeModal}
        />
      </div>

      <button class="btn-close" onclick={closeModal}> Chiudi </button>
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
      <button class="btn-close" style="margin-top: 20px;" onclick={closeJoinModal}> Annulla </button>
    </div>
  </div>
{/if}

<style>
  @import "../lib/styles/page.css";
</style>