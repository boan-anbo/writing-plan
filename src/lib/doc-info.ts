import { WritingPlanOptions } from "./entities/writing-plan-options";

export class WritingInfo {
  rawLength: number;
  lines: number;
  hasPlan: boolean;
  documentName: string | null = null;
  lastUpdated: Date = new Date();

  static fromPlainText(text: string, options: WritingPlanOptions): WritingInfo {
    const info = new WritingInfo();
    info.rawLength = text.length;
    info.lines = text.split("\n").length;

    info.hasPlan = this.checkIfTextHasPlan(text, options);

    info.documentName = options.documentName ?? null;

    info.lastUpdated = new Date();

    return info;
  }

  private static checkIfTextHasPlan(
    text: string,
    options: WritingPlanOptions
  ): boolean {
    const regex = options.getMarkerRegex();
    return regex.test(text);
  }
}
