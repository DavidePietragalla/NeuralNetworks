export interface ModuleParameter {
  type: string;
  default: string;
}

export class Stereotype {

  public file_path: string;
  public category: string;
  public pythonClassName: string;
  public expr: string;
  public parameters: Record<string, ModuleParameter>;
  public view: { color: string; width: number; height: number };

  constructor(file_path: string, data: any) {
    this.file_path = file_path;
    this.category = data.category || "";
    this.pythonClassName = data.pythonClassName || "";
    this.expr = data.expr || "";
    this.parameters = data.params || {};
    this.view = data.view || { color: "#4779c4", width: 100, height: 60 };
  }

  public getName(): string {
    if (!this.file_path) return '';

    const fileWithExt = this.file_path.split(/[\\/]/).pop() || '';

    const lastDotIndex = fileWithExt.lastIndexOf('.');

    return lastDotIndex > 0 ? fileWithExt.substring(0, lastDotIndex) : fileWithExt;
  }

  public getExpr(): string {
    return this.expr;
  }
}
