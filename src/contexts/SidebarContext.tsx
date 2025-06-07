// src/contexts/SidebarContext.tsx
import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';

interface SidebarContextType {
  isExpanded: boolean;
  toggleSidebar: () => void;
  setExpanded: (value: boolean) => void;
}

const SidebarContext = createContext<SidebarContextType>({
  isExpanded: true,
  toggleSidebar: () => {},
  setExpanded: () => {},
});

interface SidebarProviderProps {
  children: ReactNode;
}

export const SidebarProvider: React.FC<SidebarProviderProps> = ({ children }) => {
  // Try to get the saved preference from localStorage
  const getSavedState = (): boolean => {
    try {
      const saved = localStorage.getItem('tweadup_sidebar_expanded');
      return saved === null ? true : saved === 'true';
    } catch (error) {
      console.error('Error reading sidebar state from localStorage:', error);
      return true;
    }
  };
  
  const [isExpanded, setIsExpanded] = useState<boolean>(getSavedState());
  
  const toggleSidebar = () => {
    const newState = !isExpanded;
    setIsExpanded(newState);
    try {
      localStorage.setItem('tweadup_sidebar_expanded', String(newState));
    } catch (error) {
      console.error('Error saving sidebar state to localStorage:', error);
    }
  };
  
  const setExpanded = (value: boolean) => {
    setIsExpanded(value);
    try {
      localStorage.setItem('tweadup_sidebar_expanded', String(value));
    } catch (error) {
      console.error('Error saving sidebar state to localStorage:', error);
    }
  };
  
  // Handle responsiveness
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsExpanded(false);
      } else if (window.innerWidth > 1024) {
        setIsExpanded(true);
      }
    };
    
    window.addEventListener('resize', handleResize);
    // Initial check
    handleResize();
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  return (
    <SidebarContext.Provider value={{ isExpanded, toggleSidebar, setExpanded }}>
      {children}
    </SidebarContext.Provider>
  );
};

export const useSidebar = () => useContext(SidebarContext);