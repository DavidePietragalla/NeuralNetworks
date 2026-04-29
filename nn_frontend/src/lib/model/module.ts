
import { ENode } from "./node";
import type { Stereotype } from "./stereotype";

export interface InstanceParameter {
  name: string
  type: string; // python type
  value: string;
}
// TODO: Module have takenInput at most 1
export class Module extends ENode {

  public static counter: number = 0;

  public name: string
  public expr: string = "";

  public params: Array<InstanceParameter> = [];
  public stereotypeName: string = "";

  public stereotype: Stereotype;

  constructor(stereotype: Stereotype, name: string | null = null, valueToSave: Record<string, string> | null) {
    super();

    if (valueToSave === null) {
      valueToSave = {};
    }
    if (!name || name.trim() === "") {
      name = `${stereotype.getName()}_${Module.counter}`;
    }

    Module.counter++;

    this.name = name;
    this.stereotype = stereotype;
    this.stereotypeName = stereotype.getName();

    for (const [key, paramDef] of Object.entries(stereotype.parameters)) {
      // Prendiamo il valore dal form (valueToSave). 
      // Se per qualche motivo manca, facciamo un fallback sul valore di default dello stereotipo.
      const userValue = valueToSave[key] !== undefined ? valueToSave[key] : paramDef.default;

      this.params.push({
        name: key,                 // Es: 'in_channels'
        type: paramDef.type,       // Es: 'int'
        value: String(userValue)
      });
    }
  }

  getName(): string {
    return this.name;
  }

  getType(): string {
    return "Module";
  }
}
