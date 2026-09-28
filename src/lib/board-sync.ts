/**
 * Lightweight pub/sub so each tab's useHomeTasks / useHomeExpenses instance
 * can refresh when another screen mutates the same home data.
 */

type Listener = (sourceId: symbol) => void;

function createBoardSyncChannel() {
  const listeners = new Set<Listener>();

  return {
    /**
     * Subscribe to remote refreshes. Returns unsubscribe.
     */
    subscribe(listener: Listener): () => void {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },

    /**
     * Notify other hook instances (skips `sourceId` via listener check).
     */
    notify(sourceId: symbol): void {
      for (const listener of listeners) {
        listener(sourceId);
      }
    },
  };
}

export const tasksBoardSync = createBoardSyncChannel();
export const expensesBoardSync = createBoardSyncChannel();
export const absencesBoardSync = createBoardSyncChannel();
export const examPeriodsBoardSync = createBoardSyncChannel();
export const noticesBoardSync = createBoardSyncChannel();
