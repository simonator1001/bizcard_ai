"use client"

import React, { useCallback, useState } from 'react';
import { Tree } from 'react-d3-tree';
import type {
  TreeLinkDatum,
  RawNodeDatum,
  CustomNodeElementProps,
} from 'react-d3-tree';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { ZoomIn, ZoomOut, RefreshCw, Maximize, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import styles from './org-chart.module.css';

interface NodeData extends RawNodeDatum {
  level?: 'executive' | 'manager' | 'staff';
  position?: string;
  email?: string;
  __rd3t?: {
    id: string;
    depth: number;
    collapsed: boolean;
  };
  cardDetails?: {
    avatarUrl?: string;
    photoUrl?: string;
  };
}

interface OrgChartProps {
  data: NodeData;
  onNodeClick: (nodeData: NodeData) => void;
  zoom?: number;
}

const nodeColors = {
  executive: 'bg-gradient-to-r from-blue-500 to-blue-600 border-blue-400',
  manager: 'bg-gradient-to-r from-emerald-400 to-emerald-500 border-emerald-300',
  staff: 'bg-gradient-to-r from-slate-100 to-slate-200 border-slate-300',
};

export const OrgChart: React.FC<OrgChartProps> = ({ data, onNodeClick, zoom = 0.8 }: OrgChartProps) => {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [currentZoom, setCurrentZoom] = useState(zoom);
  const [breadcrumb, setBreadcrumb] = useState<NodeData[]>([]);
  const dimensions = {
    width: 800,
    height: 600,
  };

  const handleNodeClick = useCallback(
    (nodeData: NodeData) => {
      setBreadcrumb(prev => {
        const index = prev.findIndex(node => node.name === nodeData.name);
        if (index !== -1) {
          return prev.slice(0, index + 1);
        }
        return [...prev, nodeData];
      });
      onNodeClick(nodeData);
    },
    [onNodeClick]
  );

  const handleZoom = (type: 'in' | 'out' | 'reset') => {
    switch (type) {
      case 'in':
        setCurrentZoom(prev => Math.min(prev + 0.2, 2));
        break;
      case 'out':
        setCurrentZoom(prev => Math.max(prev - 0.2, 0.3));
        break;
      case 'reset':
        setCurrentZoom(0.8);
        setBreadcrumb([]);
        break;
    }
  };

  const renderCustomLink = useCallback(
    ({ source, target }: TreeLinkDatum) => {
      const sourceNode = source as unknown as { data: NodeData };
      const targetNode = target as unknown as { data: NodeData };
      const isHovered =
        hoveredNode &&
        (sourceNode.data.__rd3t?.id === hoveredNode ||
          targetNode.data.__rd3t?.id === hoveredNode);

      return (
        <path
          className={cn(
            'stroke-muted-foreground/40 stroke-2 transition-all duration-300',
            isHovered && 'stroke-primary/60 stroke-[2.5px]'
          )}
          d={`M${source.x},${source.y}L${target.x},${target.y}`}
        />
      );
    },
    [hoveredNode]
  );

  const renderCustomNode = useCallback(
    ({ nodeDatum, toggleNode }: CustomNodeElementProps) => {
      const nodeData = nodeDatum as unknown as NodeData;
      const level = nodeData.level || 'staff';
      const isHovered = hoveredNode === nodeData.__rd3t?.id;
      const cardDetails = nodeData.cardDetails || {};
      const avatarUrl = cardDetails.avatarUrl || cardDetails.photoUrl || null;
      const initials = nodeData.name
        ? nodeData.name.split(' ').map(n => n[0]).join('').slice(0, 2)
        : '';

      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <foreignObject width="200" height="100" x="-100" y="-50"
                onMouseEnter={() => setHoveredNode(nodeData.__rd3t?.id || null)}
                onMouseLeave={() => setHoveredNode(null)}
                onClick={() => handleNodeClick(nodeData)}
                style={{ cursor: 'pointer' }}
              >
                <div
                  className={cn(
                    'rounded-xl shadow-lg border transition-all duration-300 bg-white flex flex-col items-center w-full h-full overflow-visible',
                    isHovered && 'ring-2 ring-primary shadow-xl scale-105 border-primary/30',
                    !isHovered && 'hover:shadow-md'
                  )}
                >
                  {/* Color header */}
                  <div
                    className={cn(
                      'w-full h-2 rounded-t-xl',
                      level === 'executive' ? nodeColors.executive : 
                      level === 'manager' ? nodeColors.manager : 
                      nodeColors.staff
                    )}
                  />
                  
                  <div className="flex items-center justify-center w-full py-2 px-3">
                    {/* Avatar */}
                    <div className={cn(
                      'flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center overflow-hidden shadow',
                      level === 'executive' ? 'bg-blue-50 ring-2 ring-blue-200' : 
                      level === 'manager' ? 'bg-emerald-50 ring-2 ring-emerald-200' : 
                      'bg-slate-50 ring-1 ring-slate-200'
                    )}>
                      {avatarUrl ? (
                        <img src={avatarUrl} alt={initials} className="w-full h-full object-cover" />
                      ) : (
                        <span className={cn(
                          'text-sm font-semibold',
                          level === 'executive' ? 'text-blue-600' : 
                          level === 'manager' ? 'text-emerald-600' : 
                          'text-slate-600'
                        )}>{initials}</span>
                      )}
                    </div>
                    
                    {/* Name and title */}
                    <div className="flex flex-col ml-3 overflow-hidden">
                      <span className="font-medium text-sm text-foreground leading-tight truncate max-w-[110px]">{nodeData.name}</span>
                      <span className="text-xs text-muted-foreground leading-tight truncate max-w-[110px]">{nodeData.position}</span>
                    </div>
                  </div>
                </div>
              </foreignObject>
            </TooltipTrigger>
            <TooltipContent side="top" align="center" className="z-50">
              <div className="p-1">
                <p className="font-medium">{nodeData.name}</p>
                <p className="text-xs text-muted-foreground">{nodeData.position}</p>
                {nodeData.email && (
                  <p className="text-xs text-primary">{nodeData.email}</p>
                )}
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    },
    [hoveredNode, handleNodeClick]
  );

  return (
    <div className="relative">
      {/* Breadcrumb navigation */}
      {breadcrumb.length > 0 && (
        <div className="absolute top-4 left-4 z-10 flex items-center rounded-lg bg-white border shadow-sm p-2 px-3">
          <Users className="h-3.5 w-3.5 text-muted-foreground mr-2" />
          {breadcrumb.map((node, index) => (
            <React.Fragment key={node.name}>
              <button 
                className={cn(
                  "text-sm transition-colors hover:text-primary",
                  index === breadcrumb.length - 1 ? "font-medium text-primary" : "text-muted-foreground"
                )}
                onClick={() => {
                  setBreadcrumb(prev => prev.slice(0, index + 1));
                  onNodeClick(node);
                }}
              >
                {node.name}
              </button>
              {index < breadcrumb.length - 1 && (
                <span className="mx-1.5 text-muted-foreground">/</span>
              )}
            </React.Fragment>
          ))}
        </div>
      )}

      {/* Zoom controls */}
      <div className="absolute bottom-4 right-4 z-10 flex gap-1 bg-white p-1 rounded-lg shadow-sm border">
        <Button 
          variant="ghost" 
          size="icon"
          className="h-8 w-8 rounded-md"
          onClick={() => handleZoom('in')}
          title="Zoom In"
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon"
          className="h-8 w-8 rounded-md"
          onClick={() => handleZoom('out')}
          title="Zoom Out"
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon"
          className="h-8 w-8 rounded-md"
          onClick={() => handleZoom('reset')}
          title="Reset View"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      <div className="w-full h-[600px] bg-gradient-to-br from-background/70 to-muted/20 rounded-md bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:24px_24px]">
        <Tree
          data={data}
          orientation="vertical"
          pathFunc="step"
          renderCustomNodeElement={renderCustomNode}
          translate={{ x: dimensions.width / 2, y: 80 }}
          zoom={currentZoom}
          onUpdate={({ zoom }) => zoom && setCurrentZoom(zoom)}
          nodeSize={{ x: 180, y: 150 }}
          separation={{ siblings: 2, nonSiblings: 2.5 }}
          pathClassFunc={() => 'org-chart-path'}
        />
      </div>
    </div>
  );
}; 