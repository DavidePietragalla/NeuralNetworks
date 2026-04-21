
import { ENode } from "./node";
import { JoinStereotype } from "./joinStereotype";

export class Join extends ENode {

  public static counter: number = 0;
  public numberOfInputs: number = 2;
  public stereotype: JoinStereotype;

  constructor(stereotype: JoinStereotype) {
    super();
    this.stereotype = stereotype;

    Join.counter++;
  }

  getType(): string {
    return "Join";
  }

}
