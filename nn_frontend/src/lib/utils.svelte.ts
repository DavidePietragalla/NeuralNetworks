
class Hyperparameter {
  // TODO: aggiungere vincolo di unicità
  public name: string
  // TODO: la mia idea e' che type non e' una stringa ma un tipo, voglio poter dichiarare
  // il tipo del mio hyperparameter senza doverlo successivamente mappare.
  public type: string

  constructor(name: string, type: string) {
    this.name = name;
    this.type = type;
  }
}

export abstract class ENode {

  public static counter: number = 0;
  public static allNodes: Record<string, ENode> = {};

  public id: string;
  private hyperparameters: Array<Hyperparameter>

  constructor() {
    this.id = "ENode_" + ENode.counter++;
    if (ENode.allNodes[this.id] !== undefined) throw Error("node with id " + this.id + "exists");
    ENode.allNodes[this.id] = this;
    this.hyperparameters = [];
  }

  public static fromId(id: string): ENode {
    return ENode.allNodes[id];
  }

  abstract getType(): string;

}

export class VNode {
  public static counter: number = 0;
  public id: string;
  public position: { x: number; y: number };
  public data: Record<string, any>;
  public type: string

  constructor(node: ENode, x: number | null = null, y: number | null = null) {
    if (x === null || y === null) {
      x = Math.random() * 100;
      y = Math.random() * 100;
    }
    this.position = { x, y };
    this.id = "Node_" + VNode.counter++;
    this.data = { enode: node.id };
    this.type = node.getType();
  }
}

export class ActivationFunction extends ENode {
  public static istances: number = 0;
  public name: string;

  constructor(name: string | null = null) {
    super();
    Layer.instances++;
    if (name === null) {
      name = "acti_f_" + (Layer.instances);
    }
    this.name = name;
  }

  public getType(): string {
    return "activationFunction";
  }
}

export class Layer extends ENode {
  public static instances: number = 0;
  public name: string

  constructor(name: string | null = null) {
    super();
    Layer.instances++;
    if (name === null) {
      name = "layer_" + (Layer.instances);
    }
    this.name = name;
    // TODO: La mia idea e' avere un file json che rappresenta una serie di
    // Layer comuni che noi forniamo agli utenti (inclusi i rispettivi hyperparameters)
    // cosi l'utente puo aggiungere layer che noi non abbiamo implementato.
    // Per questa ragione dentro il costruttore bisognera implementare il recupero degli
    // hyperparameters e inizializzarli con un valore di default.
  }

  public getType(): string {
    return "layer";
  }
}

import { addEdge } from "@xyflow/svelte";


export class Diagram {
  public nodes: Array<VNode> = $state([]);
  public edges: Array<any> = $state([]);

  constructor() {
  }

  public addLayer() {
    const l = new Layer();
    const n = new VNode(l);
    this.nodes = [...this.nodes, n];
  }

  public addActivationFunction() {
    const a = new ActivationFunction();
    const n = new VNode(a);
    this.nodes = [...this.nodes, n];
  }

  public addConnection(conn: any) {
    console.log(conn.valueOf());
    addEdge(conn, this.edges);
  }

  public deleteNode(id: string) {
    this.nodes = this.nodes.filter(node => node.id !== id);
    this.edges = this.edges.filter(edge => edge.source !== id && edge.target !== id);
  }

}
