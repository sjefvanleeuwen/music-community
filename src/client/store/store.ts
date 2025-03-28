type Listener = () => void;

export interface Store<T> {
  getState: () => T;
  dispatch: (action: any) => void;
  subscribe: (listener: Listener) => () => void;
}

export function createStore<T>(reducer: (state: T, action: any) => T, initialState: T): Store<T> {
  let state = initialState;
  const listeners: Listener[] = [];
  
  function getState() {
    return state;
  }
  
  function dispatch(action: any) {
    state = reducer(state, action);
    listeners.forEach(listener => listener());
  }
  
  function subscribe(listener: Listener) {
    listeners.push(listener);
    
    // Return an unsubscribe function
    return () => {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }
  
  return { getState, dispatch, subscribe };
}
