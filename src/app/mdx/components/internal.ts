import { createContext, useContext } from 'react'

// passes "I'm rendering inside FileTabs" down so Pre can suppress its
// own filename header (the tab strip already shows it).
export const FileTabsContext = createContext(false)

export function useInsideFileTabs(): boolean {
  return useContext(FileTabsContext)
}
