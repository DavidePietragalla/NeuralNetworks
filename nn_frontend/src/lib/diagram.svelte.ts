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

  // Modificato per accettare color e width
  public addModule(
    stereotype: Stereotype | null,
    name: string | null = null,
    valueToSave: Record<string, string> | null = null,
    color?: string,
    width?: string,
    height?: string,
  ) {
    if (stereotype === null) return;
    console.log(stereotype.getName());

    // Passiamo un oggetto vuoto in caso valueToSave sia null
    const m = new Module(stereotype, name, valueToSave || {});

    // Generiamo il nodo visivo passando i nuovi parametri
    const n = new VNode(m, null, null, color, width, height);
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

    // Typo corretto: "targer" -> "target"
    if (source === undefined || target === undefined)
      throw Error("the source or target are undefined");

    source.add_next_node(target);

    // ADD TO VIEW
    this.edges = [...this.edges, newVConn];
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
}
