
import { ENode } from "./node";

export class Join extends ENode {

  public static counter: number = 0;
  public numberOfInputs: number = 2;

  constructor() {
    super();

    Join.counter++;
  }

  getType(): string {
    return "Join";
  }

}
