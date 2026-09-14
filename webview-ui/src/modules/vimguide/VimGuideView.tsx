import React from 'react';
import { Keyboard } from 'lucide-react';
import { CheatSheetView } from '../shared/CheatSheetView';
import { VIM_CATEGORIES } from './vimCommands';

export const VimGuideView: React.FC = () => (
  <CheatSheetView
    icon={<Keyboard size={16} />}
    title="Vim Guide"
    categories={VIM_CATEGORIES}
    accentClass="vim-guide-body"
    searchPlaceholder="Search commands (e.g. delete, paste, dd)..."
  />
);
