import React, { useEffect, useRef } from 'react';
import { Tree } from 'react-d3-tree';
import type { CustomNodeElementProps, TreeNodeDatum } from 'react-d3-tree';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface NodeData extends TreeNodeDatum {
  name: string;
  position: string;
  email: string;
  children?: NodeData[];
}

interface OrgChartProps {
  data: NodeData;
  onNodeClick: (nodeData: NodeData) => void;
}

export const OrgChart: React.FC<OrgChartProps> = ({ data, onNodeClick }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = React.useState({ width: 0, height: 0 });

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

  const renderCustomNode = ({ nodeDatum }: CustomNodeElementProps) => {
    const nodeData = nodeDatum as NodeData;
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <g 
              onClick={() => onNodeClick(nodeData)}
              className="cursor-pointer hover:opacity-80 transition-opacity"
              transform={`translate(${-20},${-20})`}
            >
              <circle
                r={20}
                className="fill-background stroke-border"
              />
              <text
                dy=".31em"
                textAnchor="middle"
                className="text-xs font-medium fill-foreground"
              >
                {nodeData.name.split(' ')[0]}
              </text>
            </g>
          </TooltipTrigger>
          <TooltipContent>
            <div className="p-2">
              <p className="font-bold">{nodeData.name}</p>
              <p className="text-sm text-muted-foreground">{nodeData.position}</p>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  return (
    <div ref={containerRef} className="w-full h-[600px] bg-background">
      <Tree
        data={data}
        renderCustomNodeElement={renderCustomNode}
        orientation="vertical"
        translate={{ x: dimensions.width / 2, y: 50 }}
        zoom={0.8}
        nodeSize={{ x: 120, y: 100 }}
        separation={{ siblings: 1.5, nonSiblings: 2 }}
        pathClassFunc={() => 'stroke-muted-foreground'}
      />
    </div>
  );
}; 