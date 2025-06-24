class HistoryManager {
  constructor(maxHistorySize = 50) {
    this.histories = {};
    this.maxSize = maxHistorySize;
  }

  _getHistory(projectId) {
    if (!projectId) return null;
    if (!this.histories[projectId]) {
      this.histories[projectId] = {
        undo: [],
        redo: [],
      };
    }
    return this.histories[projectId];
  }

  recordState(projectId, state) {
    const history = this._getHistory(projectId);
    if (!history) return;

    history.undo.push(state);
    history.redo = [];

    if (history.undo.length > this.maxSize) {
      history.undo.shift();
    }
  }

  undo(projectId, currentState) {
    const history = this._getHistory(projectId);
    if (!history || !this.canUndo(projectId)) {
      return null;
    }
    history.redo.push(currentState);
    return history.undo.pop();
  }

  redo(projectId, currentState) {
    const history = this._getHistory(projectId);
    if (!history || !this.canRedo(projectId)) {
      return null;
    }
    history.undo.push(currentState);
    return history.redo.pop();
  }

  canUndo(projectId) {
    const history = this._getHistory(projectId);
    return history && history.undo.length > 0;
  }

  canRedo(projectId) {
    const history = this._getHistory(projectId);
    return history && history.redo.length > 0;
  }

  deleteHistory(projectId) {
    if (this.histories[projectId]) {
      delete this.histories[projectId];
    }
  }
}

const historyManager = new HistoryManager();
