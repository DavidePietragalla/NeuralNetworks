
import { ENode } from "./node";

export class Module extends ENode {

  public static counter: number = 0;

  public name: string
  public expr: string = "";

  public type: string;

  public in_channels: number = 0;
  public out_channels: number = 0;

  constructor(type: string, name: string | null = null) {
    super();
    if (name === null) {
      name = type + "_" + Module.counter
    }
    Module.counter++;
    this.name = name;
    this.type = type;
  }

  setStereotype(s: Stereotype) {
    this.expr = s.getExpr();
  }

  getType(): string {
    return this.type;
  }
}
