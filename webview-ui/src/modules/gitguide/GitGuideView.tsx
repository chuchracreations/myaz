import React from 'react';
import { GitBranch } from 'lucide-react';
import { CheatSheetView } from '../shared/CheatSheetView';
import { GIT_CATEGORIES } from './gitCommands';

export const GitGuideView: React.FC = () => (
  <CheatSheetView
    icon={<GitBranch size={16} />}
    title="Git Cheat Sheet"
    categories={GIT_CATEGORIES}
    accentClass="git-guide-body"
    searchPlaceholder="Search commands (e.g. branch, stash, rebase)..."
  />
);
