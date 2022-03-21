export interface Position {
  line: number;
  index: number;
  positionType?: 'GENERAL' | 'OPEN' | 'CLOSE'
}
