import { Module } from "./model/module";
import { ENode } from "./model/node";
import { VConnection } from "./view/connection";
import { VNode } from "./view/node";
import { Stereotype } from "./model/stereotype";

export class Diagram {
  public stereotypes: Array<Stereotype> = [];
  public nodes: Array<VNode> = $state([]);
  public edges: Array<any> = $state([]);

  constructor() {
    const moduleFiles = import.meta.glob('./Modules/*.json', { eager: true });

    console.log("Files found:", Object.keys(moduleFiles));

    this.stereotypes = Object.entries(moduleFiles).map(([path, data]) => {
      const content = (data as any).default || data;
      return new Stereotype(path, content);
    });
  }

  public addModule(stereotype: Stereotype | string) {
    if (typeof stereotype === 'string') return
    console.log(stereotype.getName())
    // TODO:
    const m = new Module(stereotype);
    const n = new VNode(m);
    this.nodes = [...this.nodes, n];
  }

  public addLayer() {
    const l = new Module("layer");
    const n = new VNode(l);
    this.nodes = [...this.nodes, n];
  }

  public addActivationFunction() {
    const a = new Module("activationFunction");
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


    let old_edges = this.edges.filter(edge => edge.source !== id && edge.target === id);
    old_edges.forEach(edge => {
      let source = ENode.fromId(edge.source);
      let target = ENode.fromId(edge.target);
      if (source === undefined || target === undefined) throw Error("the source or targer are undefined");
      source.remove_next_node(target);
    });

    ENode.removeId(id);

    this.nodes = this.nodes.filter(node => node.id !== id);
    this.edges = this.edges.filter(edge => edge.source !== id && edge.target !== id);
  }

}
