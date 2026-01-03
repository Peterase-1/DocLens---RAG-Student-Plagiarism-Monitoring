import React from 'react';
import { motion } from 'framer-motion';

const SimilarityHeatmap = ({ data, onCellClick }) => {
  // data should be a 2D array of scores or a list of objects
  // For demonstration, we'll assume a grid of students

  const getScoreColor = (score) => {
    if (score > 80) return 'bg-white text-black';
    if (score > 50) return 'bg-zinc-400 text-black';
    if (score > 20) return 'bg-zinc-700 text-white';
    return 'bg-zinc-900 text-zinc-500';
  };

  return (
    <div className="overflow-x-auto">
      <div className="inline-grid gap-1" style={{
        gridTemplateColumns: `repeat(${data.length}, minmax(40px, 1fr))`
      }}>
        {data.map((row, rIdx) => (
          row.map((score, cIdx) => (
            <motion.div
              key={`${rIdx}-${cIdx}`}
              whileHover={{ scale: 1.2, zIndex: 10 }}
              onClick={() => onCellClick && onCellClick(rIdx, cIdx)}
              className={`w-10 h-10 rounded-sm cursor-pointer transition-colors ${getScoreColor(score)} flex items-center justify-center text-[10px] font-bold`}
              title={`Click to compare Student ${rIdx} vs Student ${cIdx}`}
            >
              {score > 10 ? `${score}` : ''}
            </motion.div>
          ))
        ))}
      </div>
      <div className="mt-4 flex gap-4 text-xs text-zinc-400">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-zinc-900 rounded-sm"></div> Low Similarity
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-white rounded-sm"></div> High Alert
        </div>
      </div>
    </div>
  );
};

export default SimilarityHeatmap;
