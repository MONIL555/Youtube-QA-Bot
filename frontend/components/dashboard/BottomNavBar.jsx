'use client';
import { Video, Camera, FileText } from 'lucide-react';

export default function BottomNavBar({ activeTab, setActiveTab }) {
  const tabs = [
    { id: 'tubetalks', name: 'TubeTalks', icon: Video, color: '#ef4444' }, // Red for YouTube
    { id: 'instatalks', name: 'InstaTalks', icon: Camera, color: '#ec4899' }, // Pink for Instagram
    { id: 'filetalks', name: 'FileTalks', icon: FileText, color: '#06b6d4' } // Cyan for Files
  ];

  return (
    <div className="bottom-nav-container">
      <div className="bottom-nav-bar">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`nav-tab ${isActive ? 'active' : ''}`}
              style={{
                '--tab-color': tab.color,
              }}
            >
              {isActive && <div className="active-top-indicator" />}
              <div className="icon-container">
                <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <div className="tab-name-container">
                <span className="tab-name">{tab.name}</span>
              </div>
            </button>
          );
        })}
      </div>

      <style>{`
        .bottom-nav-container {
          position: fixed;
          bottom: 24px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 100;
          display: flex;
          justify-content: center;
          width: auto;
          pointer-events: none;
        }

        .bottom-nav-bar {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          background: #ffffff;
          border: 1px solid rgba(0, 0, 0, 0.04);
          border-radius: 100px;
          box-shadow: 0 12px 32px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.04);
          pointer-events: auto;
          min-width: 320px;
          justify-content: space-around;
        }

        .nav-tab {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          background: transparent;
          border: none;
          border-radius: 100px;
          cursor: pointer;
          position: relative;
          color: var(--text-secondary);
          transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
          overflow: hidden;
        }

        .nav-tab:hover:not(.active) {
          color: var(--text-primary);
        }

        .nav-tab.active {
          color: var(--tab-color);
        }

        .icon-container {
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2;
        }

        .tab-name-container {
          max-width: 0;
          opacity: 0;
          overflow: hidden;
          transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
          z-index: 2;
        }

        .nav-tab.active .tab-name-container {
          max-width: 100px; /* enough width to reveal text */
          opacity: 1;
        }

        .tab-name {
          font-size: 15px;
          font-weight: 700;
          white-space: nowrap;
          display: block;
        }

        .active-top-indicator {
          position: absolute;
          top: -8px;
          left: 50%;
          transform: translateX(-50%);
          width: 32px;
          height: 4px;
          border-radius: 4px;
          background-color: var(--tab-color);
          box-shadow: 0 2px 8px var(--tab-color);
          transition: all 0.3s ease;
        }

        /* Mobile View */
        @media (max-width: 600px) {
          .bottom-nav-container {
            bottom: 20px;
            width: 85%;
          }
          
          .bottom-nav-bar {
            width: 100%;
            min-width: auto;
            padding: 10px;
            gap: 4px;
          }

          .nav-tab {
            padding: 12px;
            gap: 6px;
            justify-content: center;
          }
          
          .active-top-indicator {
            top: -10px;
          }
        }
      `}</style>
    </div>
  );
}
