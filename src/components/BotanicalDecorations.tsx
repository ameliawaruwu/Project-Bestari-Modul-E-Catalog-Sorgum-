import React from 'react';

/**
 * High-Fidelity Botanical SVG Artworks
 * Inspired directly by the user's reference mockup.
 * Features realistic curvature, multi-layer depth-of-field blur,
 * organic leaf veins, sunlight highlights, and textured golden sorghum panicles.
 */

// Shared SVG Gradients and Filters
export const BotanicalDefs: React.FC = () => (
  <svg width="0" height="0" className="absolute">
    <defs>
      {/* Lush Green Gradient - Main */}
      <linearGradient id="bioLeafMain" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#8AE382" />
        <stop offset="35%" stopColor="#43A047" />
        <stop offset="75%" stopColor="#2E7D32" />
        <stop offset="100%" stopColor="#1B5E20" />
      </linearGradient>

      {/* Fresh Lime Highlight Leaf */}
      <linearGradient id="bioLeafFresh" x1="10%" y1="0%" x2="90%" y2="100%">
        <stop offset="0%" stopColor="#B2F2A5" />
        <stop offset="40%" stopColor="#66BB6A" />
        <stop offset="85%" stopColor="#388E3C" />
        <stop offset="100%" stopColor="#1E6B24" />
      </linearGradient>

      {/* Deep Forest Shadow Leaf (Rear Layer) */}
      <linearGradient id="bioLeafDark" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#388E3C" />
        <stop offset="50%" stopColor="#1B5E20" />
        <stop offset="100%" stopColor="#0E3813" />
      </linearGradient>

      {/* Golden Sorghum Seed Gradient */}
      <linearGradient id="bioSorghumGold" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FDE68A" />
        <stop offset="30%" stopColor="#F59E0B" />
        <stop offset="70%" stopColor="#D97706" />
        <stop offset="100%" stopColor="#92400E" />
      </linearGradient>

      {/* Depth of Field Blur for Background Leaves */}
      <filter id="bioDepthBlur" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="1.8" />
      </filter>

      {/* Soft Ambient Foliage Drop Shadow */}
      <filter id="bioShadow" x="-15%" y="-15%" width="135%" height="135%">
        <feDropShadow dx="2" dy="5" stdDeviation="6" floodColor="#0F3316" floodOpacity="0.16" />
      </filter>
    </defs>
  </svg>
);

/**
 * Top-Left Cascading Foliage
 * Emerges from top-left, gracefully arching downward along the left margin.
 * Perfectly framed so it does NOT collide with or poke horizontally into the title.
 */
export const HeroTopLeftFoliage: React.FC = () => (
  <div className="absolute top-0 left-0 w-24 sm:w-32 lg:w-40 pointer-events-none z-10 filter drop-shadow-xs opacity-85 animate-float-slow">
    <svg viewBox="0 0 220 260" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* Woody stem arching downward along margin */}
      <path
        d="M-10 -10 C30 30 50 80 55 140 C58 180 50 210 38 240"
        stroke="#1C4722"
        strokeWidth="3"
        strokeLinecap="round"
      />

      {/* REAR LAYER: Blurred depth-of-field leaf pointing downward */}
      <g filter="url(#bioDepthBlur)">
        <path
          d="M40 70 C70 95 85 145 75 195 C45 165 35 115 40 70 Z"
          fill="url(#bioLeafDark)"
          opacity="0.85"
        />
      </g>

      {/* FRONT LAYER LEAF 1: Main arching leaf pointing downward */}
      <g filter="url(#bioShadow)">
        <path
          d="M45 50 C95 70 120 120 110 175 C70 155 45 105 45 50 Z"
          fill="url(#bioLeafMain)"
        />
        {/* Curved Center Rib Vein */}
        <path
          d="M45 50 Q85 105 110 175"
          stroke="#C8F5BE"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeOpacity="0.85"
        />
        {/* Subtle lateral veins */}
        <path d="M60 85 Q75 80 88 88" stroke="#C8F5BE" strokeWidth="0.8" strokeOpacity="0.6" />
        <path d="M72 110 Q90 110 102 122" stroke="#C8F5BE" strokeWidth="0.8" strokeOpacity="0.6" />
      </g>

      {/* FRONT LAYER LEAF 2: Upper fresh leaf curving right */}
      <g filter="url(#bioShadow)">
        <path
          d="M25 25 C65 20 110 35 135 70 C95 80 55 60 25 25 Z"
          fill="url(#bioLeafFresh)"
        />
        <path
          d="M25 25 Q85 45 135 70"
          stroke="#EAFCE6"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeOpacity="0.9"
        />
      </g>

      {/* FRONT LAYER LEAF 3: Lower drooping leaf */}
      <g filter="url(#bioShadow)">
        <path
          d="M52 140 C80 160 92 195 85 235 C60 215 45 180 52 140 Z"
          fill="url(#bioLeafMain)"
        />
        <path
          d="M52 140 Q72 185 85 235"
          stroke="#C8F5BE"
          strokeWidth="1.1"
          strokeLinecap="round"
          strokeOpacity="0.8"
        />
      </g>
    </svg>
  </div>
);

/**
 * Top-Right Graceful Foliage
 * Frames the upper-right corner cleanly without encroaching on the hero photo.
 */
export const HeroTopRightFoliage: React.FC = () => (
  <div className="absolute top-0 right-0 w-28 sm:w-36 lg:w-48 pointer-events-none z-10 filter drop-shadow-sm animate-float-reverse">
    <svg viewBox="0 0 200 220" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <path
        d="M210 -10 C175 35 155 80 150 130 C145 170 152 195 160 220"
        stroke="#1C4722"
        strokeWidth="2.8"
        strokeLinecap="round"
      />

      {/* Background blurred leaf for 3D depth */}
      <g filter="url(#bioDepthBlur)">
        <path
          d="M170 60 C135 80 115 125 125 170 C155 145 165 100 170 60 Z"
          fill="url(#bioLeafDark)"
          opacity="0.8"
        />
      </g>

      {/* Main leaf pointing leftward */}
      <g filter="url(#bioShadow)">
        <path
          d="M165 40 C115 55 90 95 95 145 C135 130 160 90 165 40 Z"
          fill="url(#bioLeafMain)"
        />
        <path
          d="M165 40 Q125 90 95 145"
          stroke="#C8F5BE"
          strokeWidth="1.3"
          strokeLinecap="round"
          strokeOpacity="0.85"
        />
      </g>

      {/* Upper fresh sprout */}
      <g filter="url(#bioShadow)">
        <path
          d="M185 20 C145 15 105 30 80 60 C120 70 160 50 185 20 Z"
          fill="url(#bioLeafFresh)"
        />
        <path
          d="M185 20 Q130 35 80 60"
          stroke="#EAFCE6"
          strokeWidth="1.1"
          strokeLinecap="round"
          strokeOpacity="0.9"
        />
      </g>
    </svg>
  </div>
);

/**
 * Bottom-Left Agricultural Botanical Leaves
 * Emerges from bottom-left corner with tall slender organic curves,
 * matching the bottom-left of the reference image.
 */
export const BottomLeftFoliage: React.FC = () => (
  <div className="absolute bottom-0 left-0 w-28 sm:w-36 lg:w-44 pointer-events-none z-10 filter drop-shadow-sm animate-float-drift">
    <svg viewBox="0 0 200 240" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <path
        d="M-10 250 C30 200 65 140 90 70 C100 40 108 10 115 -10"
        stroke="#1C4722"
        strokeWidth="2.8"
        strokeLinecap="round"
      />

      {/* Rear blurred leaf */}
      <g filter="url(#bioDepthBlur)">
        <path
          d="M20 210 C50 160 70 105 95 50 C75 95 55 155 20 210 Z"
          fill="url(#bioLeafDark)"
          opacity="0.85"
        />
      </g>

      {/* Main tall leaf reaching upward */}
      <g filter="url(#bioShadow)">
        <path
          d="M35 190 C75 145 105 90 120 30 C95 75 65 135 35 190 Z"
          fill="url(#bioLeafMain)"
        />
        <path
          d="M35 190 Q85 110 120 30"
          stroke="#C8F5BE"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeOpacity="0.85"
        />
      </g>

      {/* Side curving leaf */}
      <g filter="url(#bioShadow)">
        <path
          d="M55 170 C95 160 140 135 165 95 C125 105 80 130 55 170 Z"
          fill="url(#bioLeafFresh)"
        />
        <path
          d="M55 170 Q115 135 165 95"
          stroke="#EAFCE6"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeOpacity="0.9"
        />
      </g>
    </svg>
  </div>
);

/**
 * Bottom-Right Realistic Sorghum Grain Stalk & Panicles
 * Direct reproduction of the golden sorghum wheat-like grains & leaves
 * seen on the bottom-right corner of the user's reference image.
 */
export const BottomRightSorghum: React.FC = () => (
  <div className="absolute bottom-0 right-0 w-32 sm:w-44 lg:w-56 pointer-events-none z-10 filter drop-shadow-md animate-float-reverse">
    <svg viewBox="0 0 240 260" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* Central Sorghum Cane */}
      <path
        d="M250 270 C200 200 150 130 95 50 C75 25 55 5 35 -10"
        stroke="#78350F"
        strokeWidth="3"
        strokeLinecap="round"
      />

      {/* Golden Sorghum Panicle (Textured Grain Beads) */}
      <g filter="url(#bioShadow)">
        <ellipse cx="98" cy="62" rx="7.5" ry="11.5" transform="rotate(-35 98 62)" fill="url(#bioSorghumGold)" />
        <ellipse cx="86" cy="48" rx="7" ry="10.5" transform="rotate(-40 86 48)" fill="url(#bioSorghumGold)" />
        <ellipse cx="106" cy="52" rx="6.5" ry="10.5" transform="rotate(-25 106 52)" fill="url(#bioSorghumGold)" />
        <ellipse cx="75" cy="34" rx="6.5" ry="9.5" transform="rotate(-45 75 34)" fill="url(#bioSorghumGold)" />
        <ellipse cx="94" cy="37" rx="6.5" ry="9.5" transform="rotate(-30 94 37)" fill="url(#bioSorghumGold)" />
        <ellipse cx="64" cy="20" rx="6" ry="8.5" transform="rotate(-50 64 20)" fill="url(#bioSorghumGold)" />
        <ellipse cx="80" cy="23" rx="6" ry="8.5" transform="rotate(-35 80 23)" fill="url(#bioSorghumGold)" />
        <ellipse cx="54" cy="7" rx="5.5" ry="7.5" transform="rotate(-55 54 7)" fill="url(#bioSorghumGold)" />
        <ellipse cx="68" cy="10" rx="5.5" ry="7.5" transform="rotate(-40 68 10)" fill="url(#bioSorghumGold)" />
        <ellipse cx="44" cy="-4" rx="5" ry="7" transform="rotate(-60 44 -4)" fill="url(#bioSorghumGold)" />
      </g>

      {/* Secondary Sorghum Panicle Branch */}
      <path
        d="M145 135 C130 110 115 85 100 58"
        stroke="#92400E"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <g>
        <ellipse cx="132" cy="110" rx="6" ry="9" transform="rotate(-25 132 110)" fill="url(#bioSorghumGold)" />
        <ellipse cx="120" cy="95" rx="6" ry="9" transform="rotate(-30 120 95)" fill="url(#bioSorghumGold)" />
        <ellipse cx="138" cy="100" rx="5.5" ry="8.5" transform="rotate(-15 138 100)" fill="url(#bioSorghumGold)" />
        <ellipse cx="108" cy="80" rx="5.5" ry="8.5" transform="rotate(-35 108 80)" fill="url(#bioSorghumGold)" />
        <ellipse cx="125" cy="84" rx="5" ry="8" transform="rotate(-20 125 84)" fill="url(#bioSorghumGold)" />
      </g>

      {/* Lush Green Arching Leaves around Sorghum */}
      <g filter="url(#bioShadow)">
        <path
          d="M190 185 C145 160 95 155 45 170 C90 190 145 200 190 185 Z"
          fill="url(#bioLeafMain)"
        />
        <path
          d="M190 185 Q115 170 45 170"
          stroke="#C8F5BE"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeOpacity="0.85"
        />
      </g>
      <g filter="url(#bioShadow)">
        <path
          d="M210 225 C160 195 120 170 65 165 C115 195 165 220 210 225 Z"
          fill="url(#bioLeafDark)"
        />
        <path
          d="M210 225 Q135 195 65 165"
          stroke="#8FD88B"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeOpacity="0.75"
        />
      </g>
    </svg>
  </div>
);
