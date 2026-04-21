export class JoinStereotype {
  public path: string;
  public name: string;
  public expr: string;

  constructor(path: string, content: any) {
    this.path = path;
    this.name = content.Name || "Undefined Join";
    this.expr = content.Expr || "";
  }
}