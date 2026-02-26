export interface MoveNode {
  ply: number
  san: string
  fen: string
  parent: MoveNode | null
  children: MoveNode[]
}