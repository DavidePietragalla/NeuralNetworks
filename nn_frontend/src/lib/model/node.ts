

export abstract class ENode {

  public static counter: number = 0;
  public static allNodes: Map<string, ENode> = new Map<string, ENode>();

  public id: string;
  public hyperparameters: Array<Hyperparameter>;

  public next_nodes: Array<string>;

  constructor() {
    this.id = "ENode_" + ENode.counter++;
    if (ENode.allNodes.get(this.id) !== undefined) throw Error("node with id " + this.id + "exists");
    ENode.allNodes.set(this.id, this);
    this.hyperparameters = [];
    this.next_nodes = [];
  }

  public add_next_node(l: ENode) {
    this.next_nodes.push(l.id);
  }

  public remove_next_node(l: ENode) {
    const index = this.next_nodes.indexOf(l.id, 0);
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
