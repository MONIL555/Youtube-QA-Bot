'use client';
import { createContext, useContext, useState } from 'react';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [activeTab, setActiveTab] = useState('tubetalks');
  const [tubeUrl, setTubeUrl] = useState('');
  const [instaUrl, setInstaUrl] = useState('');
  const [file, setFile] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <AppContext.Provider
      value={{
        activeTab, setActiveTab,
        tubeUrl, setTubeUrl,
        instaUrl, setInstaUrl,
        file, setFile,
        searchQuery, setSearchQuery
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
