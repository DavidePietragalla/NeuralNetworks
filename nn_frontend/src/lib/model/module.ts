
import { ENode } from "./node";
import type { Stereotype } from "./stereotype";

export interface IstanceParameter {
  type: string; // python type
  value: string;
}

export class Module extends ENode {

  public static counter: number = 0;

  public name: string
  public expr: string = "";

  public type: string;

  public params: Array<IstanceParameter> = new Array();
  public stereotypeName: string = "";

  public stereotype: Stereotype;

  constructor(stereotype: Stereotype, name: string | null = null) {
    super();
    if (name === null) {
      name = stereotype.getName() + "_" + Module.counter
    }
    Module.counter++;
    this.name = name;
    this.type = stereotype.category;
    for (const [key, value] of Object.entries(stereotype.parameters)) {
      if (key === "in_channels")
        console.log(key, value);
      // this.params.push()
    }
  }

  getType(): string {
    return this.type;
  }
}
