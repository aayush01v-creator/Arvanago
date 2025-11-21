const getStorage = () => {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    return window.localStorage;
  } catch (error) {
    console.warn('Local storage is unavailable in this environment.', error);
    return null;
  }
};

export const safeLocalStorage = {
  getItem(key: string) {
    const storage = getStorage();
    if (!storage) {
      return null;
    }

    try {
      return storage.getItem(key);
    } catch (error) {
      console.warn(`Unable to read local storage key "${key}".`, error);
      return null;
    }
  },
  setItem(key: string, value: string) {
    const storage = getStorage();
    if (!storage) {
      return;
    }

    try {
      storage.setItem(key, value);
    } catch (error) {
      console.warn(`Unable to write local storage key "${key}".`, error);
    }
  },
  removeItem(key: string) {
    const storage = getStorage();
    if (!storage) {
      return;
    }

    try {
      storage.removeItem(key);
    } catch (error) {
      console.warn(`Unable to remove local storage key "${key}".`, error);
    }
  },
};
