
class Hyperparameter {
  // TODO: aggiungere vincolo di unicità
  public name: string
  public type: string

  constructor(name: string, type: string) {
    this.name = name;
    this.type = type;
  }

}

class Coordinate {
  constructor(public x: number, public y: number) { }
}

class ENode {

}

class Configuration extends ENode { }



class Layer extends ENode {

  private static counter: number = 0
  // TODO: aggiungere vincolo di unicità
  public name: string

  public next_layers: Array<Layer>

  constructor(name: string | null = null) {
    super();
    if (name === null) {
      name = "layer_" + (Layer.counter + 1);
    }
    this.name = name;
    this.next_layers = [];
  }

  public add_next_layer(l: Layer) {
    this.next_layers.push(l);
  }

  public remove_next_layer(l: Layer) {
    const index = this.next_layers.indexOf(l, 0);
    if (index > -1) {
      this.next_layers.splice(index, 1);
    }
  }
}

class Initial {

}


export class VisualizeNode {
  public static counter: number = 0;
  public id: string;
  // Use SvelteFlow's expected structure for position
  public position: { x: number; y: number };
  // Tell TS this satisfies SvelteFlow's generic data requirement
  public data: Record<string, any>;

  constructor(x: number, y: number, enode: ENode) {
    // 1. Assign position as a plain object
    this.position = { x, y };

    this.id = `node_` + (VisualizeNode.counter++);

    // 2. Wrap your ENode inside a standard object. 
    // We can also add a 'label' so SvelteFlow's default nodes have something to display!
    this.data = {
      enode: enode,
      label: enode instanceof Layer ? enode.name : "Node"
    };
  }
}

class Model {
  public nodes: Array<ENode> = [];
  public edges: Array<any> = [];

}

export class Diagram {
  public nodes: Array<VisualizeNode> = $state([]);
  public edges: Array<any> = $state([]);

  constructor() {
  }

  public addLayer() {
    const l = new Layer();
    const newNode = new VisualizeNode(Math.random() * 100, Math.random() * 100, l);
    this.nodes = [...this.nodes, newNode];
  }

  public loadModel(model: Model) {
    // Deallocare i nodi visualizzati
    // Carica nodes , quindi istanzia VisualizeNode node
  }

  public addConnection(conn: any) {

    console.log(conn.valueOf());
    this.edges = [...this.edges, conn];
  }

}
