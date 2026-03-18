import Maia from '../lib/engine/maia'

export type MaiaStatus =
  | 'loading'
  | 'no-cache'
  | 'downloading'
  | 'ready'
  | 'error'

export type StockfishStatus = 'loading' | 'ready' | 'error'

export interface MaiaEngine {
  maia?: Maia
  status: MaiaStatus
  progress: number
  downloadModel: () => void
}
