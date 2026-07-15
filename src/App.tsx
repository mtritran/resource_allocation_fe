import { useState, useEffect } from 'react';
import './App.css';
import { Dashboard } from './pages/Dashboard';
import { Employees } from './pages/Employees';
import { Projects } from './pages/Projects';
import { Allocations } from './pages/Allocations';
import { AiAssistant } from './pages/AiAssistant';
import { LayoutGrid, Users, Briefcase, Activity, Sparkles, Moon, Sun, Layers } from 'lucide-react';

type Tab = 'dashboard' | 'employees' | 'projects' | 'allocations' | 'ai';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [isLightMode, setIsLightMode] = useState(false);

  useEffect(() => {
    // Sync UI with document root class list
    if (isLightMode) {
      document.documentElement.classList.add('light-mode');
    } else {
      document.documentElement.classList.remove('light-mode');
    }
  }, [isLightMode]);

  const renderActivePage = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'employees':
        return <Employees />;
      case 'projects':
        return <Projects />;
      case 'allocations':
        return <Allocations />;
      case 'ai':
        return <AiAssistant />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="logo-container">
          <Layers className="logo-icon" />
          <span className="logo-text">ResAllocation</span>
        </div>

        <nav className="nav-links">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            style={{ width: '100%', background: 'none', textAlign: 'left' }}
          >
            <LayoutGrid size={18} />
            <span className="nav-label">Dashboard</span>
          </button>

          <button
            onClick={() => setActiveTab('employees')}
            className={`nav-item ${activeTab === 'employees' ? 'active' : ''}`}
            style={{ width: '100%', background: 'none', textAlign: 'left' }}
          >
            <Users size={18} />
            <span className="nav-label">Employees</span>
          </button>

          <button
            onClick={() => setActiveTab('projects')}
            className={`nav-item ${activeTab === 'projects' ? 'active' : ''}`}
            style={{ width: '100%', background: 'none', textAlign: 'left' }}
          >
            <Briefcase size={18} />
            <span className="nav-label">Projects</span>
          </button>

          <button
            onClick={() => setActiveTab('allocations')}
            className={`nav-item ${activeTab === 'allocations' ? 'active' : ''}`}
            style={{ width: '100%', background: 'none', textAlign: 'left' }}
          >
            <Activity size={18} />
            <span className="nav-label">Allocations</span>
          </button>

          <button
            onClick={() => setActiveTab('ai')}
            className={`nav-item ${activeTab === 'ai' ? 'active' : ''}`}
            style={{ width: '100%', background: 'none', textAlign: 'left' }}
          >
            <Sparkles size={18} />
            <span className="nav-label">AI Copilot</span>
          </button>
        </nav>

        <div className="sidebar-footer">
          <button
            onClick={() => setIsLightMode(!isLightMode)}
            className="theme-toggle-btn"
          >
            {isLightMode ? (
              <>
                <Moon size={16} />
                <span className="nav-label">Dark Mode</span>
              </>
            ) : (
              <>
                <Sun size={16} />
                <span className="nav-label">Light Mode</span>
              </>
            )}
          </button>
        </div>
      </aside>

      {/* Main Page Area */}
      <main className="main-content">
        {renderActivePage()}
      </main>
    </div>
  );
}

export default App;
