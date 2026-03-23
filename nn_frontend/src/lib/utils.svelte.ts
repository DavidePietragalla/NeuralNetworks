
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
  public static allNodes: Map<string, ENode> = new Map<string, ENode>();

  public id: string;
  public hyperparameters: Array<Hyperparameter>;

  public next_nodes: Array<ENode>;

  constructor() {
    this.id = "ENode_" + ENode.counter++;
    if (ENode.allNodes.get(this.id) !== undefined) throw Error("node with id " + this.id + "exists");
    ENode.allNodes.set(this.id, this);
    this.hyperparameters = [];
    this.next_nodes = [];
  }

  public add_next_node(l: ENode) {
    this.next_nodes.push(l);
  }

  public remove_next_node(l: ENode) {
    const index = this.next_nodes.indexOf(l, 0);
    if (index > -1) {
      this.next_nodes.splice(index, 1);
    }
  }

  public static fromId(id: string): ENode | undefined {
    return ENode.allNodes.get(id);
  }

  public static removeId(id: string) {
    ENode.allNodes.delete(id);
  }

  abstract getType(): string;

}

export abstract class Module extends ENode {
  public name: string

  constructor(name: string) {
    super();
    this.name = name;
  }
}

export class VNode {
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
    this.id = node.id;
    this.data = { enode: node.id };
    this.type = node.getType();
  }
}

export class ActivationFunction extends Module {
  public static istances: number = 0;

  constructor(name: string | null = null) {
    if (name === null) {
      name = "acti_f_" + (Layer.instances);
    }
    super(name);
    Layer.instances++;
  }

  public getType(): string {
    return "activationFunction";
  }
}

export class Layer extends Module {
  public static instances: number = 0;

  constructor(name: string | null = null) {
    if (name === null) {
      name = "layer_" + (Layer.instances);
    }
    super(name);
    Layer.instances++;
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

// Connection.js
import { MarkerType } from '@xyflow/svelte';

export class VConnection {
  public id: string;
  public source: string; // Cambiato da ENode a string per compatibilità Flow
  public target: string;
  public type: string;
  public markerEnd: any;
  public style: string;

  constructor(id: string, source: string, target: string) {
    this.id = id;
    this.source = source;
    this.target = target;
    this.type = 'connection'; // Deve corrispondere alla chiave in edgeTypes

    this.markerEnd = {
      type: MarkerType.ArrowClosed,
      width: 20,
      height: 20,
      color: '#FF0072',
    };

    this.style = 'stroke: #FF0072; stroke-width: 2;';
  }

}

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

  public addConnection(connection: any) {
    const newVConn = new VConnection(
      `e-${connection.source}-${connection.target}`,
      connection.source, // Qui passiamo gli ID (string)
      connection.target
    );

    // UPDATE MODEL
    let source = ENode.fromId(connection.source);
    let target = ENode.fromId(connection.target);

    if (source === undefined || target === undefined)
      throw Error("the source or targer are undefined");

    source.add_next_node(target);

    // ADD TO VIEW
    this.edges = [...this.edges, newVConn];
  }

  public deleteNode(id: string) {
    this.nodes = this.nodes.filter(node => node.id !== id);
    this.edges = this.edges.filter(edge => edge.source !== id && edge.target !== id);
    ENode.removeId(id);
  }

}
