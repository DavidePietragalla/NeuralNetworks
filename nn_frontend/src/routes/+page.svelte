<script lang="ts">
  import {
    SvelteFlow,
    Controls,
    Background,
    BackgroundVariant,
  } from "@xyflow/svelte";

  import "@xyflow/svelte/dist/style.css";

  import SLayer from "../lib/components/SLayer.svelte";
  import SActivationFunction from "$lib/components/SActivationFunction.svelte";
  import SConnection from "$lib/components/SConnection.svelte";
  import { Diagram } from "$lib/diagram.svelte";
  import { ENode } from "$lib/model/node";

  import SDropdown from "$lib/components/SDropdown.svelte";
  import SIstantiator from "$lib/components/SIstantiator.svelte";

  // SVELTE 5: Usiamo $state al posto di writable
  // let nodes = $state([]);
  // let edges = $state([]);
  //
  // let layerCounter = 1;
  // const generateId = () => `layer_${layerCounter++}`;

  // L'elemento cliccato va evidenziato.
  let selectedId = $state<string | null>(null);

  let istantiate: boolean = $state(false);
  let d = new Diagram();

  // --- FUNZIONI CORE ---

  function addLayer() {
    d.addLayer();
  }

  function deleteSelectedNode() {
    if (selectedId) {
      d.deleteNode(selectedId);

      selectedId = null;
    }
  }

  // SVELTE 5: I parametri degli eventi vengono passati direttamente
  function onconnect(connection: any) {
    // TODO: use addEdge inside addConnection
    // edges = addEdge(connection, edges);
    d.addConnection(connection);
  }

  function handleNodeClick({ event, node }: any) {
    selectedId = node.id;
  }

  function handlePaneClick({ event }: any) {
    selectedId = null;
  }

  function exportToJson() {
    // Rimuoviamo il prefisso '$' usato per i writable
    console.log(ENode.allNodes);
    const flowState = {
      model: Object.fromEntries(ENode.allNodes),
      view: { nodes: d.nodes, edges: d.edges },
    };
    const jsonString = JSON.stringify(flowState, null, 2);
    // TODO: salva in un file
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

  function addActivationFunction() {
    d.addActivationFunction();
  }

  function closeModal() {
    istantiate = false;
  }

  // GESTIONE DELLA PAGINA

  const nodeTypes = { Linear: SLayer, activationFunction: SActivationFunction };
  const edgeTypes = { connection: SConnection };
</script>

<div class="app-container">
  <div class="toolbar">
    <button
      onclick={(e) => {
        e.stopPropagation();
        istantiate = true;
      }}>➕ Aggiungi Module</button
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
        <SIstantiator diagram={d} onSuccess={closeModal} />
      </div>

      <button class="btn-close" onclick={closeModal}> Chiudi </button>
    </div>
  </div>
{/if}

<style>
  @import "../lib/styles/page.css";
</style>
