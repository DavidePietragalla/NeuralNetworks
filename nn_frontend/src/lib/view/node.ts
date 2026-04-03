import type { ENode } from "$lib/model/node";

export class VNode {
  public id: string;
  public position: { x: number; y: number };
  public data: Record<string, any>;
  public type: string;

  constructor(
    node: ENode,
    x: number | null = null,
    y: number | null = null,
    color?: string,
    width?: string,
    height?: string
  ) {
    if (x === null || y === null) {
      x = Math.random() * 100;
      y = Math.random() * 100;
    }

    this.position = { x, y };
    this.id = node.id;
    this.type = node.getType();

    this.data = {
      enode: node.id,
      color: color || "#4779c4", // Blue 
      width: width || "100px",
      height: height || "60px"
    };
  }
}
