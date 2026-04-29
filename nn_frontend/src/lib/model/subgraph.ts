import { ENode } from "./node";

export class SubGraph extends ENode {
  public name: string;
  public childrenIds: string[] = [];

  constructor(name: string = "SubGraph") {
    super();
    this.name = name;
  }

  getType(): string {
    return "SubGraph";
  }

  getName(): string {
    return this.name;
  }
}
