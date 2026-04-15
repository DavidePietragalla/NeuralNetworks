import { ENode } from "./node";

export class Fork extends ENode {

  public static counter: number = 0;
  public numberOfBranches: number = 2;

  constructor() {
    super();

    Fork.counter++;
  }

  getType(): string {
    return "Fork";
 }
}
