"use client"

import React, { useEffect, useRef, useState } from 'react';
import Tree from 'react-d3-tree';
import type { CustomNodeElementProps, TreeNodeDatum } from 'react-d3-tree';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import styles from './org-chart.module.css';

interface NodeData extends TreeNodeDatum {
  name: string;
  position: string;
  email: string;
  level?: 'executive' | 'manager' | 'staff';
  children?: NodeData[];
}

interface OrgChartProps {
  data: NodeData;
  onNodeClick: (nodeData: NodeData) => void;
}

const nodeColors = {
  executive: 'from-blue-500 to-blue-600',
  manager: 'from-emerald-400 to-emerald-500',
  staff: 'from-gray-200 to-gray-300',
};

export const OrgChart: React.FC<OrgChartProps> = ({ data, onNodeClick }: OrgChartProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = React.useState({ width: 0, height: 0 });
  const [zoom, setZoom] = useState(0.8);
  const [breadcrumb, setBreadcrumb] = useState<NodeData[]>([]);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setDimensions({ width, height });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  const handleNodeClick = (nodeData: NodeData) => {
    setBreadcrumb(prev => {
      const index = prev.findIndex(node => node.name === nodeData.name);
      if (index !== -1) {
        return prev.slice(0, index + 1);
      }
      return [...prev, nodeData];
    });
    onNodeClick(nodeData);
  };

  const handleZoom = (type: 'in' | 'out' | 'reset') => {
    switch (type) {
      case 'in':
        setZoom(prev => Math.min(prev + 0.2, 2));
        break;
      case 'out':
        setZoom(prev => Math.max(prev - 0.2, 0.3));
        break;
      case 'reset':
        setZoom(0.8);
        setBreadcrumb([]);
        break;
    }
  };

  const renderCustomNode = ({ nodeDatum }: CustomNodeElementProps) => {
    const nodeData = nodeDatum as NodeData;
    const level = nodeData.level || 'staff';
    const isHovered = hoveredNode === nodeData.name;

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <g 
              onClick={() => handleNodeClick(nodeData)}
              onMouseEnter={() => setHoveredNode(nodeData.name)}
              onMouseLeave={() => setHoveredNode(null)}
              className={cn(
                "cursor-pointer transition-all duration-300 ease-in-out",
                styles.nodeEnter,
                isHovered && styles.nodeHover
              )}
              transform={`translate(${-30},${-30})`}
            >
              <circle
                r={30}
                className={cn(
                  'fill-background stroke-2 transition-all duration-300',
                  'bg-gradient-to-br shadow-lg',
                  nodeColors[level]
                )}
              />
              <circle
                r={26}
                className="fill-white/90 stroke-none"
                transform="translate(2, 2)"
              />
              <text
                dy="-0.5em"
                textAnchor="middle"
                className="text-sm font-semibold fill-foreground"
              >
                {nodeData.name.split(' ')[0]}
              </text>
              <text
                dy="1em"
                textAnchor="middle"
                className="text-xs fill-muted-foreground"
              >
                {nodeData.position.split(' ')[0]}
              </text>
            </g>
          </TooltipTrigger>
          <TooltipContent>
            <div className="p-3 space-y-1">
              <p className="font-bold">{nodeData.name}</p>
              <p className="text-sm text-muted-foreground">{nodeData.position}</p>
              {nodeData.email && (
                <p className="text-xs text-muted-foreground">{nodeData.email}</p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

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

      <div ref={containerRef} className="w-full h-[600px] bg-background/50 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]">
        <Tree
          data={data}
          renderCustomNodeElement={renderCustomNode}
          orientation="vertical"
          translate={{ x: dimensions.width / 2, y: 80 }}
          zoom={zoom}
          nodeSize={{ x: 150, y: 120 }}
          separation={{ siblings: 2, nonSiblings: 2.5 }}
          pathClassFunc={(link) => cn(
            'stroke-muted-foreground/60 stroke-2',
            hoveredNode && (
              link.source.data.name === hoveredNode || 
              link.target.data.name === hoveredNode
            ) && styles.pathHover
          )}
          pathFunc="step"
        />
      </div>
    </div>
  );
}; 