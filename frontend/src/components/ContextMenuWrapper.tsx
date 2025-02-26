import React, { ReactNode } from 'react';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger
} from '@/components/ui/context-menu';

interface ContextMenuWrapperProps {
  children: ReactNode;
  menuItems: Array<{
    label: string;
    onClick: () => void;
  }>;
}

export function ContextMenuWrapper({ children, menuItems }: ContextMenuWrapperProps) {
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div>{children}</div>
      </ContextMenuTrigger>
      <ContextMenuContent>
        {menuItems.map((item, index) => (
          <ContextMenuItem key={index} onClick={item.onClick}>
            {item.label}
          </ContextMenuItem>
        ))}
      </ContextMenuContent>
    </ContextMenu>
  );
}