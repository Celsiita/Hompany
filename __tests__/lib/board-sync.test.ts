import { expensesBoardSync, tasksBoardSync } from '@/lib/board-sync';

describe('board-sync', () => {
  it('delivers notify payloads to subscribers', () => {
    const source = Symbol('tasks-source');
    const received: symbol[] = [];
    const unsub = tasksBoardSync.subscribe((id) => {
      received.push(id);
    });

    tasksBoardSync.notify(source);
    expect(received).toEqual([source]);
    unsub();
  });

  it('keeps expense channel independent from tasks', () => {
    const source = Symbol('expenses-source');
    const received: symbol[] = [];
    const unsub = expensesBoardSync.subscribe((id) => {
      received.push(id);
    });

    tasksBoardSync.notify(Symbol('ignored'));
    expect(received).toEqual([]);

    expensesBoardSync.notify(source);
    expect(received).toEqual([source]);
    unsub();
  });
});
