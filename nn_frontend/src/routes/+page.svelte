<script lang="ts">
  import {
    SvelteFlow,
    Controls,
    Background,
    BackgroundVariant,
    addEdge,
  } from "@xyflow/svelte";

  import "@xyflow/svelte/dist/style.css";

  import { ActivationFunction, Diagram, ENode, Layer } from "$lib/utils.svelte";

  // SVELTE 5: Usiamo $state al posto di writable
  // let nodes = $state([]);
  // let edges = $state([]);
  //
  // let layerCounter = 1;
  // const generateId = () => `layer_${layerCounter++}`;

  // L'elemento cliccato va evidenziato.
  let selectedId = $state<string | null>(null);

  let d = new Diagram();

  // --- FUNZIONI CORE ---

  function addLayer() {
    // const newNode = new Layer(`Layer ${layerCounter - 1}`);
    // layerCounter++;
    // const newNode = {
    //   id: generateId(),
    //   type: "default",
    //   position: { x: Math.random() * 250, y: Math.random() * 250 },
    //   data: { label: `Layer ${layerCounter - 1}` },
    // };
    // // In Svelte 5 possiamo riassegnare direttamente l'array
    // nodes = [...nodes, newNode];
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
    const flowState = {
      model: ENode.allNodes,
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

  // GESTIONE DELLA PAGINA
  import SLayer from "../lib/components/SLayer.svelte";
  import SActivationFunction from "$lib/components/SActivationFunction.svelte";

  const nodeTypes = { layer: SLayer, activationFunction: SActivationFunction };
</script>

<div class="app-container">
  <div class="toolbar">
    <button onclick={addLayer}>➕ Aggiungi Layer</button>
    <button onclick={addActivationFunction}>
      ➕ Aggiungi Activation Function
    </button>
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
      bind:edges={d.edges}
      {nodeTypes}
      fitView
      onnodeclick={handleNodeClick}
      onpaneclick={handlePaneClick}
    >
      <Controls />
      <Background variant={BackgroundVariant.Dots} />
    </SvelteFlow>
  </div>
</div>

<style>
  .app-container {
    height: 100vh;
    display: flex;
    flex-direction: column;
    font-family: sans-serif;
  }
  .toolbar {
    padding: 1rem;
    background: #f4f4f5;
    border-bottom: 1px solid #e4e4e7;
    display: flex;
    gap: 10px;
  }
  .divider {
    width: 1px;
    background: #d4d4d8;
    margin: 0 10px;
  }
  button {
    padding: 8px 16px;
    cursor: pointer;
    background: white;
    border: 1px solid #d4d4d8;
    border-radius: 4px;
    font-weight: 500;
  }
  button:hover {
    background: #f4f4f5;
  }
  .flow-wrapper {
    flex-grow: 1;
    width: 100%;
  }

  /* When the delete button is disabled*/
  button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  /* When the delete button is enabled*/
  button.danger {
    color: #dc2626;
    /*border-color: #dc2626;*/
  }

  /* When the delete button is enabled and hovered */
  button.danger:hover {
    background: #fef2f2;
  }
</style>
