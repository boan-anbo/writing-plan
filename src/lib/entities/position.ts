export class Position {
  line: number;
  index: number;
  positionType?: 'GENERAL' | 'OPEN' | 'CLOSE' = 'OPEN';
  constructor(line: number, index: number) {
    this.line = line;
    this.index = index;
  }
}
