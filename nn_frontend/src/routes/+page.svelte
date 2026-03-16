<script>
  import {
    SvelteFlow,
    Controls,
    Background,
    BackgroundVariant,
    addEdge,
  } from "@xyflow/svelte";

  import "@xyflow/svelte/dist/style.css";

  // SVELTE 5: Usiamo $state al posto di writable
  let nodes = $state([]);
  let edges = $state([]);

  let layerCounter = 1;
  const generateId = () => `layer_${layerCounter++}`;

  // --- FUNZIONI CORE ---

  function addLayer() {
    const newNode = {
      id: generateId(),
      type: "default",
      position: { x: Math.random() * 250, y: Math.random() * 250 },
      data: { label: `Layer ${layerCounter - 1}` },
    };
    // In Svelte 5 possiamo riassegnare direttamente l'array
    nodes = [...nodes, newNode];
  }

  // SVELTE 5: I parametri degli eventi vengono passati direttamente
  function onconnect(connection) {
    edges = addEdge(connection, edges);
  }

  function exportToJson() {
    // Rimuoviamo il prefisso '$' usato per i writable
    const flowState = {
      nodes: nodes,
      edges: edges,
    };
    const jsonString = JSON.stringify(flowState, null, 2);
    console.log("JSON Esportato:", jsonString);
    alert("JSON generato! Guarda la console.");
    return jsonString;
  }

  function importFromJson(jsonString) {
    try {
      const parsedData = JSON.parse(jsonString);
      nodes = parsedData.nodes || [];
      edges = parsedData.edges || [];

      if (nodes.length > 0) {
        const ids = nodes.map((n) => parseInt(n.id.replace("layer_", "")) || 0);
        layerCounter = Math.max(...ids) + 1;
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
</script>

<div class="app-container">
  <div class="toolbar">
    <button onclick={addLayer}>➕ Aggiungi Layer</button>
    <div class="divider"></div>
    <button onclick={exportToJson}>💾 Esporta JSON</button>
    <button onclick={testImport}>📂 Testa Import JSON</button>
  </div>

  <div class="flow-wrapper">
    <SvelteFlow bind:nodes bind:edges {onconnect} fitView>
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
</style>
