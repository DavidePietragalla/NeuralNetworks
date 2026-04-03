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
