import React from "react";

const ScoreRing = ({ score = 35, size = 106 }) => {
  const maxScore = 50;
  const sections = 10;
  const strokeWidth = 14;

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const segmentLength = circumference / sections;
  const gap = 4;

  const activeSegments = Math.ceil(score / 5);

  return (
    <div
      style={{
        width: size,
        height: size,
        position: "relative",
      }}
    >
      <svg width={size} height={size}>
        <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
          {Array.from({ length: sections }).map((_, i) => (
            <circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={i < activeSegments ? "#25c7f7" : "#D9D9D9"}
              strokeWidth={strokeWidth}
              strokeDasharray={`${segmentLength - gap} ${circumference}`}
              strokeDashoffset={-i * segmentLength}
              strokeLinecap="butt"
            />
          ))}
        </g>
      </svg>

      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            fontSize: 52,
            fontWeight: 700,
            lineHeight: 1,
          }}
        >
          {score}
        </div>

        <div
          style={{
            fontSize: 12,
            color: "#888",
          }}
        >
        </div>
      </div>
    </div>
  );
};

export default ScoreRing;