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
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
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
  executive: 'from-blue-500 to-blue-600',
  manager: 'from-emerald-400 to-emerald-500',
  staff: 'from-gray-200 to-gray-300',
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
            'stroke-muted-foreground/60 stroke-2',
            isHovered && styles.pathHover
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
        <foreignObject width="180" height="90" x="-90" y="-45">
          <div
                className={cn(
              'rounded-xl shadow-lg border border-border bg-white flex flex-col items-center w-[180px] h-[90px] overflow-visible',
              isHovered && 'ring-2 ring-primary/60',
                )}
            style={{ pointerEvents: 'all' }}
              >
            {/* Colored header bar */}
            <div
                  className={cn(
                'w-full h-6 rounded-t-xl flex items-center justify-center',
                level === 'executive' ? 'bg-blue-600' : level === 'manager' ? 'bg-emerald-500' : 'bg-gray-300'
              )}
            >
              {/* Avatar */}
              <div className="absolute left-2 top-1 w-8 h-8 rounded-full bg-white border-2 border-border flex items-center justify-center overflow-hidden shadow">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={initials} className="w-8 h-8 object-cover rounded-full" />
                ) : (
                  <span className="text-xs font-bold text-primary">{initials}</span>
                )}
              </div>
            </div>
            {/* Name and title */}
            <div className="flex flex-col items-center justify-center flex-1 mt-2">
              <span className="font-bold text-base text-foreground leading-tight">{nodeData.name}</span>
              <span className="text-xs text-muted-foreground leading-tight">{nodeData.position}</span>
            </div>
          </div>
        </foreignObject>
      );
    },
    [hoveredNode, handleNodeClick]
  );

  return (
    <div className="relative">
      {/* Breadcrumb navigation */}
      {breadcrumb.length > 0 && (
        <div className={styles.breadcrumb}>
          {breadcrumb.map((node, index) => (
            <React.Fragment key={node.name}>
              <span 
                className={styles.breadcrumbItem}
                onClick={() => {
                  setBreadcrumb(prev => prev.slice(0, index + 1));
                  onNodeClick(node);
                }}
              >
                {node.name}
              </span>
              {index < breadcrumb.length - 1 && (
                <span className={styles.breadcrumbSeparator}>/</span>
              )}
            </React.Fragment>
          ))}
        </div>
      )}

      {/* Zoom controls */}
      <div className={styles.zoomControls}>
        <button 
          className={styles.zoomButton}
          onClick={() => handleZoom('in')}
          title="Zoom In"
        >
          <ZoomIn className="h-4 w-4" />
        </button>
        <button 
          className={styles.zoomButton}
          onClick={() => handleZoom('out')}
          title="Zoom Out"
        >
          <ZoomOut className="h-4 w-4" />
        </button>
        <button 
          className={styles.zoomButton}
          onClick={() => handleZoom('reset')}
          title="Reset View"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
      </div>

      <div className="w-full h-[600px] bg-background/50 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]">
        <Tree
          data={data}
          orientation="vertical"
          pathFunc="step"
          renderCustomNodeElement={renderCustomNode}
          translate={{ x: dimensions.width / 2, y: 80 }}
          zoom={currentZoom}
          onUpdate={({ zoom }) => zoom && setCurrentZoom(zoom)}
          nodeSize={{ x: 150, y: 120 }}
          separation={{ siblings: 2, nonSiblings: 2.5 }}
          pathClassFunc={() => 'org-chart-path'}
        />
      </div>
    </div>
  );
}; 