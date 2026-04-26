import { Module } from "./model/module";
import { ENode } from "./model/node";
import { VConnection } from "./view/connection";
import { VNode } from "./view/node";
import { Stereotype } from "./model/stereotype";
import { JoinStereotype } from "./model/joinStereotype";
import { Join } from "./model/join";
import { SubGraph } from "./model/subgraph";

export class Diagram {
  public stereotypes: Array<Stereotype> = [];
  public joins: Array<JoinStereotype> = [];
  public nodes: Array<VNode> = $state([]);
  public edges: Array<any> = $state([]);

  constructor() {
    const moduleFiles = import.meta.glob('./Modules/*.json', { eager: true });
    this.stereotypes = Object.entries(moduleFiles).map(([path, data]) => {
      const content = (data as any).default || data;
      return new Stereotype(path, content);
    });

    // Cerca lo stereotipo Input e crea il nodo iniziale
    const inputStereotype = this.stereotypes.find(s => s.category.toLowerCase() === "input");
    if (inputStereotype) {
      // Lo posizioniamo forzatamente in x: 250, y: 50
      this.addModule(inputStereotype, "Input_0", null, undefined, undefined, undefined, 250, 50);
    }

    const joinFiles = import.meta.glob('./Joins/*.json', { eager: true });
    this.joins = Object.entries(joinFiles).map(([path, data]) => {
      const content = (data as any).default || data;
      return new JoinStereotype(path, content);
    });
  }

  // Aggiunti i parametri opzionali x e y
  public addModule(
    stereotype: Stereotype | null,
    name: string | null = null,
    valueToSave: Record<string, string> | null = null,
    color?: string,
    width?: string,
    height?: string,
    x: number | null = null,
    y: number | null = null
  ) {
    if (stereotype === null) return;

    const m = new Module(stereotype, name, valueToSave || {});
    // Passiamo le coordinate al VNode
    const n = new VNode(m, x, y, color, width, height);
    this.nodes = [...this.nodes, n];
  }

  public addConnection(connection: any) {

    console.log(connection);

    // UPDATE MODEL
    let source = ENode.fromId(connection.source);
    let target = ENode.fromId(connection.target);

    // Typo corretto: "targer" -> "target"
    if (source === undefined || target === undefined)
      throw Error("the source or target are undefined");



    // let targetHandle = null;
    // if (target.getType() === "Join") {
    //   targetHandle = target.getNumberOfInputs();
    //   target.takenInput++;
    // }


    const newVConn = new VConnection(
      `e-${connection.source}-${connection.target}`,
      connection.source, // Qui passiamo gli ID (strin)
      connection.target,
      connection.targetHandle,
    );
    source.add_next_node(target);

    // ADD TO VIEW
    this.edges = [...this.edges, newVConn];
  }

  public addJoin(stereotype: JoinStereotype, x: number | null = null, y: number | null = null) {
    const j = new Join(stereotype);
    const n = new VNode(j, x, y, "#000000", "80px", "80px");
    this.nodes = [...this.nodes, n];
  }

  public updateJoin(id: string, stereotype: JoinStereotype) {
    const j = ENode.fromId(id) as Join;
    if (!j) return;

    (j as any).stereotype = stereotype;
    (j as any).name = stereotype.name;

    this.nodes = this.nodes.map(node => {
      if (node.id === id) {
        return {
          ...node,
          data: {
            ...node.data,
            _tick: Date.now()
          }
        } as VNode;
      }
      return node;
    });
  }

  public deleteNode(id: string) {
    let old_edges = this.edges.filter(edge => edge.source !== id && edge.target === id);
    old_edges.forEach(edge => {
      let source = ENode.fromId(edge.source);
      let target = ENode.fromId(edge.target);

      // Typo corretto: "targer" -> "target"
      if (source === undefined || target === undefined)
        throw Error("the source or target are undefined");

      source.remove_next_node(target);
    });

    ENode.removeId(id);

    this.nodes = this.nodes.filter(node => node.id !== id);
    this.edges = this.edges.filter(edge => edge.source !== id && edge.target !== id);
  }

  public deleteEdge(id: string) {
    const edgeToDelete = this.edges.find(edge => edge.id === id);

    if (!edgeToDelete) return;

    let source = ENode.fromId(edgeToDelete.source);
    let target = ENode.fromId(edgeToDelete.target);

    if (source !== undefined && target !== undefined) {
      source.remove_next_node(target);
    } else {
      console.warn("Source or target not found for edge deletion.");
    }

    this.edges = this.edges.filter(edge => edge.id !== id);
  }

  public updateModule(
    id: string,
    stereotype: Stereotype,
    name: string | null = null,
    valueToSave: Record<string, string> | null = null,
    color?: string,
    width?: string,
    height?: string
  ) {
    const m = ENode.fromId(id) as Module;
    if (!m) return;

    m.stereotype = stereotype;
    m.stereotypeName = stereotype.getName();
    m.name = name || `${stereotype.getName()}_${id.split('_')[1]}`;

    m.params = [];
    if (valueToSave) {
      for (const [key, paramDef] of Object.entries(stereotype.parameters)) {
        const userValue = valueToSave[key] !== undefined ? valueToSave[key] : paramDef.default;
        m.params.push({ name: key, type: paramDef.type, value: String(userValue) });
      }
    }

    this.nodes = this.nodes.map(node => {
      if (node.id === id) {
        return {
          ...node,
          data: {
            ...node.data,
            color: color || node.data.color,
            width: width || node.data.width,
            height: height || node.data.height,
            _tick: Date.now()
          }
        } as VNode;
      }
      return node;
    });
  }

  public addSubGraph(name: string, x: number, y: number) {
    const sub = new SubGraph(name);

    const vNode = new VNode(sub, x, y);
    
    this.nodes = [...this.nodes, vNode];
  }

  public updateSubGraph(id: string, newName: string) {
    const sub = ENode.fromId(id) as SubGraph;
    if (sub) {
      sub.name = newName;
      
      const vNodeIndex = this.nodes.findIndex(n => n.id === id);
      if (vNodeIndex !== -1) {
        this.nodes[vNodeIndex].data = { 
          ...this.nodes[vNodeIndex].data, 
          _tick: Date.now() 
        };
        this.nodes = [...this.nodes];
      }
    }
  }

  public exportSequentialGraph(): string {
    // Cerchiamo tra tutti gli ENode quello che ha categoria "input"
    let currentNode = Array.from(ENode.allNodes.values()).find(
      (n) => (n as Module).stereotype.category.toLowerCase() === "input"
    );

    if (!currentNode) {
      throw new Error("Nodo di Input non trovato. Impossibile generare la sequenza.");
    }

    const sequence: any[] = new Tree();
    let step = 0;
    let loss: Object | null = null;
    // Navighiamo il grafo sequenzialmente
    while (currentNode) {
      console.log(currentNode);
      if (currentNode.getType() === "Module") {
        const mod = currentNode as Module;

        // Ignoriamo l'Input stesso nella lista finale di PyTorch (o lo teniamo se ti serve per i config)
        if (mod.stereotype.category.toLocaleLowerCase().includes("loss")) {
          if (loss !== null) {
            throw new Error("Trovata più di una loss. Impossibile continuare");
          }
          const paramsObj: Record<string, any> = {};

          mod.params.forEach(p => {
            // Manteniamo il valore testuale per ora, lo parseremo in Python
            paramsObj[p.name] = {
              value: p.value,
              type: p.type,
            };
          });
          loss = {
            id: `loss_${step}`,
            name: mod.name,
            target: mod.stereotype.pythonClassName, // es: "nn.Conv2d"
            params: paramsObj
          };
        } else if (mod.stereotype.category.toLowerCase() !== "input") {
          const paramsObj: Record<string, any> = {};

          mod.params.forEach(p => {
            // Manteniamo il valore testuale per ora, lo parseremo in Python
            paramsObj[p.name] = {
              value: p.value,
              type: p.type,
            };
          });

          sequence.push({
            id: `layer_${step}`,
            name: mod.name,
            target: mod.stereotype.pythonClassName, // es: "nn.Conv2d"
            params: paramsObj
          });

          step++;
        }
      }

      // 3. Passiamo al nodo successivo (assumendo che ce ne sia solo uno)
      currentNode = currentNode.next_nodes.length > 0 ? ENode.fromId(currentNode.next_nodes[0]) : undefined;
    }

    return JSON.stringify({ network: sequence, loss: loss }, null, 2);
  }
}
