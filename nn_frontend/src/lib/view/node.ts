import type { ENode } from "$lib/model/node";

export class VNode {
  public id: string;
  public position: { x: number; y: number };
  public data: Record<string, any>;
  public type: string;
  public width?: string;
  public height?: string;

  public parentId?: string;
  public extent?: 'parent';
  public style?: string;
  public selected?: boolean = false;

  constructor(
    node: ENode,
    x: number | null = null,
    y: number | null = null,
    color?: string,
    width?: string,
    height?: string,
    parentId?: string
  ) {
    if (x === null || y === null) {
      x = Math.random() * 100;
      y = Math.random() * 100;
    }

    this.position = { x, y };
    this.id = node.id;
    this.type = node.getType();
    this.parentId = parentId;

    if (parentId) {
      //this.extent = 'parent';
    }

    this.data = {
      enode: node.id,
      color: color || "#4779c4",
      width: width || "100px",
      height: height || "60px",
      _tick: Date.now()
    };

    this.width = width || "100px";
    this.height = height || "60px";
    if (this.type === "SubGraph") {
      this.style = "width: 400px; height: 300px; background-color: rgba(71, 121, 196, 0.1); border: 2px dashed #4779c4; z-index: -1;";
    }
  }
}
