import { useReducer, useCallback } from 'react';
import { MAX_HISTORY } from '../constants';

// ---- State & Actions --------------------------------------------------------

type HistoryState<T> = {
  history: T[];
  pointer: number;
};

type Action<T> =
  | { type: 'UPDATE'; payload: T }
  | { type: 'UNDO' }
  | { type: 'REDO' };

// ---- Reducer (no stale-closure risk) ----------------------------------------

function createReducer<T>() {
  return (state: HistoryState<T>, action: Action<T>): HistoryState<T> => {
    switch (action.type) {
      case 'UPDATE': {
        const trimmed = state.history.slice(0, state.pointer + 1);
        trimmed.push(action.payload);
        const capped = trimmed.length > MAX_HISTORY ? trimmed.slice(-MAX_HISTORY) : trimmed;
        return { history: capped, pointer: capped.length - 1 };
      }
      case 'UNDO':
        if (state.pointer <= 0) return state;
        return { ...state, pointer: state.pointer - 1 };
      case 'REDO':
        if (state.pointer >= state.history.length - 1) return state;
        return { ...state, pointer: state.pointer + 1 };
      default:
        return state;
    }
  };
}

// ---- Hook -------------------------------------------------------------------

export function useHistory<T>(initialState: T | (() => T)) {
  const reducer = createReducer<T>();
  const [{ history, pointer }, dispatch] = useReducer(reducer, undefined, () => {
    const init = typeof initialState === 'function' ? (initialState as () => T)() : initialState;
    return {
      history: [init],
      pointer: 0,
    };
  });

  const state = history[pointer];

  const updateState = useCallback((newState: T) => {
    dispatch({ type: 'UPDATE', payload: newState });
  }, []);

  const undo = useCallback(() => dispatch({ type: 'UNDO' }), []);
  const redo = useCallback(() => dispatch({ type: 'REDO' }), []);

  return {
    state,
    updateState,
    undo,
    redo,
    canUndo: pointer > 0,
    canRedo: pointer < history.length - 1,
  };
}
