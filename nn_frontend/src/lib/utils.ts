import type { Diagram } from "./diagram.svelte";
import { ENode } from "./model/node";
import { NNTree } from "./model/nntree";
import { Join } from "./model/join";
import { Module } from "./model/module";
import type { VNode } from "./view/node";
import { SubGraph } from "./model/subgraph";
import { MarkerType } from '@xyflow/svelte';


export async function loadFromFile(d: Diagram, subgraph: VNode | null = null) {
  try {
    let jsonString = "";

    // 1. Prova a usare la File System Access API
    if ("showOpenFilePicker" in window) {
      const [fileHandle] = await (window as any).showOpenFilePicker({
        types: [
          {
            description: "JSON Configuration File",
            accept: { "application/json": [".json"] },
          },
        ],
        multiple: false,
      });

      const file = await fileHandle.getFile();
      jsonString = await file.text();
    }
    // 2. Fallback classico tramite input file invisibile
    else {
      jsonString = await new Promise((resolve, reject) => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = ".json";

        input.onchange = async (e: any) => {
          const file = e.target.files[0];
          if (file) {
            resolve(await file.text());
          } else {
            reject(new Error("Nessun file selezionato"));
          }
        };

        input.click();
      });
    }

    // Passa il testo letto alla funzione di importazione
    if (subgraph !== null) {
      console.log("Istanziazione sottografo")
      loadJsonAsSubGraph(d, jsonString, subgraph);
    } else {
      console.log("APERTURA FILE")
      importFromJson(d, jsonString);
    }
  } catch (error: any) {
    if (error.name !== "AbortError") {
      console.error("Errore durante l'apertura del file:", error);
      alert("Si è verificato un errore durante il caricamento.");
    }
  }
}

async function saveToFile(jsonString: string) {
  try {
    // 2. Prova a usare la File System Access API (Apre il popup di salvataggio nativo)
    // Type assertion to bypass TypeScript's Window type definition limitations
    if ((window as any).showSaveFilePicker) {
      const fileHandle = await (window as any).showSaveFilePicker({
        suggestedName: "model_config.json",
        types: [
          {
            description: "JSON Configuration File",
            accept: { "application/json": [".json"] },
          },
        ],
      });

      // Crea uno stream scrivibile e salva il file nel path scelto
      const writable = await fileHandle.createWritable();
      await writable.write(jsonString);
      await writable.close();

      console.log("File salvato con successo via File System Access API");
    }
    // 3. Fallback classico per i browser che non supportano la nuova API
    else {
      const filename = prompt(
        "Inserisci il nome del file:",
        "model_config.json",
      );
      if (!filename) return; // L'utente ha annullato

      const blob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      console.log("File scaricato via fallback");
    }
  } catch (error: any) {
    // Ignora l'errore se l'utente ha semplicemente chiuso la finestra di dialogo senza salvare
    if (error.name !== "AbortError") {
      console.error("Errore durante il salvataggio del file:", error);
      alert("Si è verificato un errore durante il salvataggio.");
    }
  }
}

export async function convert(d: Diagram) {
  try {
    // Use the new NNTree-based conversion
    const tree = new NNTree(d);
    console.log(tree.printTree());
    const jsonString = tree.toJSON();
    await saveToFile(jsonString);
  } catch (error: any) {
    console.error("Conversion error:", error);
    alert(error.message || "Errore durante la conversione del modello.");
  }
}

export async function exportToJson(d: Diagram) {
  console.log(ENode.allNodes);
  const flowState = {
    model: Object.fromEntries(ENode.allNodes),
    view: { nodes: d.nodes, edges: d.edges },
  };
  const jsonString = JSON.stringify(flowState, null, 2);
  await saveToFile(jsonString);
}

export function loadJsonAsSubGraph(d: Diagram, jsonString: string, subgraph: VNode) {
  try {
    const parsedData = JSON.parse(jsonString);
    console.log("inizio funzione")
    if (!parsedData.view || !parsedData.model) {
      throw new Error(
        "Il file JSON non ha la struttura attesa (mancano model o view).",
      );
    }

    // 1. Ripristina i nodi e gli archi visuali di SvelteFlow
    // Applichiamo la logica sul parentId in base al flag 'subgraph'
    let modifiedVNodes: Map<string, any> = new Map();
    let modifiedENode: any[] = [];

    // parseData.view.edges

    let rawNodes = parsedData.view.nodes || [];

    console.log("rawNodes", rawNodes);
    console.log("Model: ", parsedData.model);
    let filteredNodes = rawNodes.filter((node: any) => {
      return parsedData.model[node.id].stereotypeName !== "Input"; /* && TODO: filter of the loss */
    });
    //
    // let filteredNodes = rawNodes;

    rawNodes.forEach((node: any) => {
      console.log(parsedData.model[node.id].stereotypeName); /* && TODO: filter of the loss */
    });

    console.log("filteredNodes: ", filteredNodes);
    // First pass: collect all child node positions to determine subgraph origin
    let childMinX = Infinity;
    let childMinY = Infinity;

    filteredNodes.forEach((node: any) => {
      if (node.position) {
        childMinX = Math.min(childMinX, node.position.x);
        childMinY = Math.min(childMinY, node.position.y);
      }
    });

    // Calculate proper subgraph position (with padding)
    const padding = 50;
    let newSubgraphX = childMinX - padding;
    let newSubgraphY = childMinY - padding;

    // Update subgraph position to ensure all children fit nicely
    console.log("Child nodes range:", { minX: childMinX, minY: childMinY });
    console.log("New subgraph position:", { x: newSubgraphX, y: newSubgraphY });

    // Update the subgraph VNode's position to trigger reactivity
    const subgraphVNode = d.nodes.find(n => n.id === subgraph.id);
    if (subgraphVNode) {
      subgraphVNode.position = { x: newSubgraphX, y: newSubgraphY };
      subgraphVNode.data._tick = Date.now();
      d.nodes = [...d.nodes];  // Force Svelte reactivity
    }
    // Also update the subgraph model node position
    subgraph.position = { x: newSubgraphX, y: newSubgraphY };

    // Now convert child node positions to be relative to the subgraph
    const subgraphX = newSubgraphX;
    const subgraphY = newSubgraphY;

    filteredNodes.map((node: any) => ({
      ...node,
      parentId: subgraph.id  // Bind nodes to subgraph (not subgraph.parentId)
    })).forEach((vnodeRaw: any) => {
      let enodeRaw = parsedData.model[vnodeRaw.id];
      let oldId = vnodeRaw.id;
      let newId = `${subgraph.id}_${vnodeRaw.id}`;
      vnodeRaw.id = newId;
      enodeRaw.id = newId;
      
      // Convert absolute position to relative position within subgraph
      if (vnodeRaw.position) {
        vnodeRaw.position = {
          x: vnodeRaw.position.x - subgraphX,
          y: vnodeRaw.position.y - subgraphY
        };
      }
      
      // Update data.enode to match the new ID
      if (vnodeRaw.data && vnodeRaw.data.enode) {
        vnodeRaw.data.enode = newId;
      }
      let new_nexts = [];
      for (const key of enodeRaw.next_nodes) {
        new_nexts.push(`${subgraph.id}_${key}`);
      }
      // TODO: gestire subgraph
      enodeRaw.next_nodes = new_nexts; // TODO: gli id potrebbero avere nomi assurdi

      modifiedVNodes.set(vnodeRaw.id, vnodeRaw);
      modifiedENode.push(enodeRaw);
    });
    // Store raw edges for edge matching later
    const rawEdges = parsedData.view.edges || [];

    console.log("filter done")

    // Create a map of subgraph node IDs for fast lookup
    const subgraphNodeIds = new Set(modifiedVNodes.keys());

    // Create a mapping from original IDs to new IDs for edge matching
    const idMapping = new Map<string, string>();
    modifiedVNodes.forEach((vnode: any) => {
      // Extract original ID by removing subgraph prefix
      const originalId = vnode.id.replace(`${subgraph.id}_`, "");
      idMapping.set(originalId, vnode.id);
    });

    console.log("idMapping:", Object.fromEntries(idMapping));

    // 2. Ripristina i dati del modello logico
    for (const value of modifiedENode) {
      const rawNode = value as any;

      console.log(`Loading node ${rawNode.id}: next_nodes=${JSON.stringify(rawNode.next_nodes || [])}`);
      console.log(`node: `, rawNode);
      if (rawNode.stereotype === undefined) console.log("OH NO!")
      if (rawNode.stereotype !== undefined) console.log("OH Si!", rawNode.stereotype)
      // Impostazione del prototipo in base alla struttura
      Object.setPrototypeOf(rawNode, ENode.prototype);
      // console.log(`Esecuzione ${value.id} numberOfInputs`);
      if (rawNode.childrenIds !== undefined) {
        // caso subgraph
        // TODO: implement
        Object.setPrototypeOf(rawNode, SubGraph);
      } else if (rawNode.numberOfInputs) {
        // caso Join
        console.log("numberOfInputs");
        Object.setPrototypeOf(rawNode, Join.prototype);
        let joinNode: Join = rawNode;
        // Filter edges that originate from this subgraph node
        // Use the mapping to find edges with original IDs
        const matchingEdges = rawEdges.filter((edge: any) => {
          // Check if edge.source matches this node's original ID (before prefix)
          const originalSourceId = edge.source.replace(`${subgraph.id}_`, "");
          const nodeOriginalId = joinNode.id.replace(`${subgraph.id}_`, "");
          return edge.source === nodeOriginalId;
        });
        console.log(`Join ${joinNode.id} matching edges:`, matchingEdges);
        // Get prefixed target IDs from idMapping
        const prefixedEdges = matchingEdges.map((edge: any) => {
          const prefixedTarget = idMapping.get(edge.target);
          return {
            ...edge,
            target: prefixedTarget || `${subgraph.id}_${edge.target}`
          };
        });
        d.addENodeWithEdges(joinNode, modifiedVNodes.get(joinNode.id), prefixedEdges, subgraph.id);
      } else {
        // caso Module
        Object.setPrototypeOf(rawNode, Module.prototype);
        let mod: Module = rawNode;

        // Filter edges that originate from this subgraph node
        // Use the mapping to find edges with original IDs
        const matchingEdges = rawEdges.filter((edge: any) => {
          // Check if edge.source matches this node's original ID (before prefix)
          const originalSourceId = edge.source.replace(`${subgraph.id}_`, "");
          const nodeOriginalId = mod.id.replace(`${subgraph.id}_`, "");
          return edge.source === nodeOriginalId;
        });
        console.log(`Module ${mod.id} matching edges:`, matchingEdges);
        // Get prefixed target IDs from idMapping
        const prefixedEdges = matchingEdges.map((edge: any) => {
          const prefixedTarget = idMapping.get(edge.target);
          return {
            ...edge,
            target: prefixedTarget || `${subgraph.id}_${edge.target}`
          };
        });
        d.addENodeWithEdges(mod, modifiedVNodes.get(mod.id), prefixedEdges, subgraph.id);
      }
      // TODO: controlla che l'Id non esista
    }
    console.log("Importazione completata con successo!");

    // Adjust subgraph size to fit all child nodes
    // Calculate bounding box of all child nodes
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    
    for (const vnode of modifiedVNodes.values()) {
      if (vnode.position) {
        const nodeWidth = vnode.data?.width ? parseFloat(vnode.data.width) : 100;
        const nodeHeight = vnode.data?.height ? parseFloat(vnode.data.height) : 60;
        minX = Math.min(minX, vnode.position.x);
        minY = Math.min(minY, vnode.position.y);
        maxX = Math.max(maxX, vnode.position.x + nodeWidth);
        maxY = Math.max(maxY, vnode.position.y + nodeHeight);
      }
    }
    
    console.log("Bounding box of child nodes:", { minX, minY, maxX, maxY });
    
    // Update subgraph size if we have valid bounds
    if (minX !== Infinity && minY !== Infinity) {
      const padding = 50;
      const subgraphWidth = (maxX - minX) + padding * 2;
      const subgraphHeight = (maxY - minY) + padding * 2;
      
      console.log("Subgraph new size:", { width: subgraphWidth, height: subgraphHeight });
      
      // Update the subgraph node's VNode data with new dimensions
      const subgraphVNode = d.nodes.find(n => n.id === subgraph.id);
      if (subgraphVNode) {
        subgraphVNode.data.width = `${subgraphWidth}px`;
        subgraphVNode.data.height = `${subgraphHeight}px`;
        // Update style to match new dimensions
        subgraphVNode.style = `width: ${subgraphWidth}px; height: ${subgraphHeight}px; background-color: rgba(71, 121, 196, 0.1); border: 2px dashed #4779c4; z-index: -1;`;
        // Trigger Svelte reactivity
        subgraphVNode.data._tick = Date.now();
        d.nodes = [...d.nodes];
      }
    }
    
    // Add all edges from the subgraph to the diagram
    // Edges use original IDs, so we need to prefix them for the diagram
    for (const edge of rawEdges) {
      const originalSource = edge.source;
      const originalTarget = edge.target;
      
      // Check if source and target are in the subgraph (have the subgraph prefix)
      const sourceInSubgraph = subgraphNodeIds.has(`${subgraph.id}_${originalSource}`);
      const targetInSubgraph = subgraphNodeIds.has(`${subgraph.id}_${originalTarget}`);
      
      if (sourceInSubgraph && targetInSubgraph) {
        // Both nodes are in the subgraph - add edge with prefixed IDs
        d.edges.push({
          id: `e-${subgraph.id}_${originalSource}-${subgraph.id}_${originalTarget}`,
          source: `${subgraph.id}_${originalSource}`,
          target: `${subgraph.id}_${originalTarget}`,
          type: 'connection',
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 10,
            height: 15,
            color: '#27b376',
          },
          style: 'stroke: #27b376; stroke-width: 2;'
        });
      }
    }
    console.log("Edges added to diagram:", d.edges.length);
  } catch (error) {
    console.error("Errore durante il parsing del JSON:", error);
    alert("Il JSON fornito non è valido o è incompatibile.");
  }
}

export function importFromJson(d: Diagram, jsonString: string) {
  try {
    const parsedData = JSON.parse(jsonString);

    if (!parsedData.view || !parsedData.model) {
      throw new Error(
        "Il file JSON non ha la struttura attesa (mancano model o view).",
      );
    }

    // 1. Ripristina i nodi e gli archi visuali di SvelteFlow
    // Applichiamo la logica sul parentId in base al flag 'subgraph'
    const rawNodes = parsedData.view.nodes || [];
    d.nodes = rawNodes.map((node: any) => ({
      ...node,
      parentId: ""
    }));

    d.edges = parsedData.view.edges || [];

    // 2. Ripristina i dati del modello logico
    for (const [key, value] of Object.entries(parsedData.model)) {
      const rawNode = value as any;

      console.log(`Loading node ${key}: next_nodes=${JSON.stringify(rawNode.next_nodes || [])}`);

      // Impostazione del prototipo in base alla struttura
      Object.setPrototypeOf(rawNode, ENode.prototype);

      if (rawNode.childrenIds !== undefined) {
        // caso subgraph
        // TODO: implement
        Object.setPrototypeOf(rawNode, SubGraph.prototype);
      } else if (rawNode.numberOfInputs) {
        Object.setPrototypeOf(rawNode, Join.prototype);
      } else {
        Object.setPrototypeOf(rawNode, Module.prototype);
      }

      ENode.allNodes.set(key, rawNode);
    }

    // 3. Aggiorna il contatore interno per evitare conflitti con i nuovi ID
    if (d.nodes.length > 0) {
      const ids = d.nodes
        .map((n) => {
          const parts = n.id.split("_");
          return parseInt(parts[parts.length - 1]);
        })
        .filter((n) => !isNaN(n));

      ENode.counter = ids.length > 0 ? Math.max(...ids) + 1 : 1;
    }

    console.log("Importazione completata con successo!");
  } catch (error) {
    console.error("Errore durante il parsing del JSON:", error);
    alert("Il JSON fornito non è valido o è incompatibile.");
  }
}
