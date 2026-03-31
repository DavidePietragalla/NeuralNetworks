export interface ModuleParameter {
  type: string;
  default: string;
}

export class Stereotype {
  public file_path: string;
  public category: string = "";
  public pythonClassName: string = "";
  public expr: string = "";
  public parameters: Record<string, ModuleParameter> = {};

  constructor(file_path: string, data: any) {
    this.file_path = file_path;
    this.loadFromData(data);
  }

  private loadFromData(data: any): void {
    this.category = data.category || "";
    this.pythonClassName = data.pythonClassName || "";
    this.expr = data.expr || "";
    this.parameters = data.params || {};
  }

  public getName(): string {
    if (!this.file_path) return '';

    // Normalize slashes to handle both Windows (\) and Unix (/) paths
    const normalizedPath = this.file_path.replace(/\\/g, '/');

    // Grab just the final part of the path
    const fileWithExt = normalizedPath.split('/').pop() || '';

    // Find the last dot to remove the extension
    const lastDotIndex = fileWithExt.lastIndexOf('.');

    // Return the name (checks > 0 so it doesn't break on hidden files like .env)
    if (lastDotIndex > 0) {
      return fileWithExt.substring(0, lastDotIndex);
    }

    return fileWithExt;
  }

  public getExpr(): string {
    return this.expr;
  }
}
