import type { Diagram } from "./diagram.svelte";
import { ENode } from "./model/node";
import { NNTree } from "./model/nntree";
import { Join } from "./model/join";
import { Module } from "./model/module";
import type { VNode } from "./view/node";

<<<<<<< HEAD
export async function loadSubGraphFromFile(d: Diagram) {
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
    importFromJson(d, jsonString);
  } catch (error: any) {
    if (error.name !== "AbortError") {
      console.error("Errore durante l'apertura del file:", error);
      alert("Si è verificato un errore durante il caricamento.");
    }
  }
}


export async function loadFromFile(d: Diagram) {
=======
export async function loadFromFile(d: Diagram, subgraph: VNode | null = null) {
>>>>>>> loadingsubgraph
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
    importFromJson(d, jsonString, subgraph);
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
    if (window.showSaveFilePicker) {
      const fileHandle = await window.showSaveFilePicker({
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

export function importFromJson(d: Diagram, jsonString: string, subgraph: VNode | null = null) {
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
      parentId: subgraph ? subgraph.parentId : "" 
    }));

    d.edges = parsedData.view.edges || [];

    // 2. Ripristina i dati del modello logico
    for (const [key, value] of Object.entries(parsedData.model)) {
      const rawNode = value as any;
      
      console.log(`Loading node ${key}: next_nodes=${JSON.stringify(rawNode.next_nodes || [])}`);
      
      // Impostazione del prototipo in base alla struttura
      Object.setPrototypeOf(rawNode, ENode.prototype);
      if (rawNode.numberOfInputs) {
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