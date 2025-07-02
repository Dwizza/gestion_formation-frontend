// src/components/Sidebar.tsx
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useSidebar } from '../../contexts/SidebarContext';
import { useNotifications } from '../../hooks/useNotifications';
import { 
  ChevronLeft, 
  ChevronRight,
  Home,
  BookOpen, 
  Users, 
  Calendar,
  CreditCard,
  Bell,
  Clock,
  Settings,
  LogOut,
  GraduationCap
} from 'lucide-react';

interface SidebarProps {
  userRole: 'ADMIN' | 'TRAINER';
}

const Sidebar: React.FC<SidebarProps> = ({ userRole }) => {
  const { isExpanded, toggleSidebar } = useSidebar();
  const { user, logout } = useAuth();
  const location = useLocation();
  
  // Hook pour les notifications
  const { stats } = useNotifications();
  
  const isActive = (path: string) => {
    return location.pathname === path;
  };
  
  // Define navigation items based on user role
  const getNavItems = () => {
    if (userRole === 'ADMIN') {
      return [
        {
          icon: <Home size={20} />,
          title: 'Dashboard',
          path: '/admin',
          color: '#EF4444'
        },
        {
          icon: <BookOpen size={20} />,
          title: 'Trainings',
          path: '/admin/trainings',
          color: '#DC2626'
        },
        {
          icon: <Users size={20} />,
          title: 'Groups',
          path: '/admin/groups',
          color: '#B91C1C'
        },
        {
          icon: <GraduationCap size={20} />,
          title: 'Learners',
          path: '/admin/learners',
          color: '#991B1B'
        },
        {
          icon: <Calendar size={20} />,
          title: 'Attendance',
          path: '/admin/attendance',
          color: '#7F1D1D'
        },
        {
          icon: <CreditCard size={20} />,
          title: 'Payments',
          path: '/admin/payments',
          color: '#EF4444'
        },
        {
          icon: <Bell size={20} />,
          title: 'Notifications',
          path: '/admin/notifications',
          color: '#DC2626',
          badge: stats.unread > 0 ? stats.unread : undefined // Only show badge when there are unread notifications
        }
      ];
    } else {
      return [
        {
          icon: <Home size={20} />,
          title: 'Dashboard',
          path: '/trainer',
          color: '#EF4444'
        },
        {
          icon: <Users size={20} />,
          title: 'Groups',
          path: '/trainer/groups',
          color: '#DC2626'
        },
        {
          icon: <Calendar size={20} />,
          title: 'Mark Attendance',
          path: '/trainer/attendance',
          color: '#B91C1C'
        },
        {
          icon: <Clock size={20} />,
          title: 'Attendance History',
          path: '/trainer/attendancehistory',
          color: '#991B1B'
        },
        {
          icon: <Settings size={20} />,
          title: 'Session Planning',
          path: '/trainer/sessions',
          color: '#7F1D1D'
        }
      ];
    }
  };

  const navItems = getNavItems();

  return (
    <div 
      style={{
        width: isExpanded ? '288px' : '80px',
        background: 'linear-gradient(180deg, #1A0F0F 0%, #2D1B1B 25%, #4B1818 50%, #2D1B1B 75%, #1A0F0F 100%)',
        height: '100vh',
        transition: 'all 0.3s ease-in-out',
        boxShadow: '0 25px 50px -12px rgba(139, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
        position: 'relative',
        borderRight: '1px solid rgba(220, 38, 38, 0.3)'
      }}
    >
      {/* Decorative shine overlay */}
      <div 
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, transparent 30%, rgba(220, 38, 38, 0.1) 70%, transparent 100%)',
          pointerEvents: 'none'
        }}
      />
      
      {/* Animated shine effect */}
      <div 
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.1) 50%, transparent 70%)',
          animation: 'shine 3s ease-in-out infinite',
          pointerEvents: 'none'
        }}
      />
      
      {/* Toggle button */}
      <button 
        style={{
          position: 'absolute',
          right: '-16px',
          top: '32px',
          background: 'linear-gradient(135deg, #DC2626 0%, #B91C1C 50%, #991B1B 100%)',
          color: 'white',
          borderRadius: '50%',
          padding: '8px',
          boxShadow: '0 10px 25px -5px rgba(220, 38, 38, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
          zIndex: 20,
          border: '2px solid rgba(239, 68, 68, 0.3)',
          cursor: 'pointer',
          transition: 'all 0.2s ease-in-out'
        }}
        onClick={toggleSidebar}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.05)';
          e.currentTarget.style.background = 'linear-gradient(135deg, #B91C1C 0%, #991B1B 50%, #7F1D1D 100%)';
          e.currentTarget.style.boxShadow = '0 15px 35px -5px rgba(220, 38, 38, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.3)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.background = 'linear-gradient(135deg, #DC2626 0%, #B91C1C 50%, #991B1B 100%)';
          e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(220, 38, 38, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)';
        }}
        aria-label={isExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
      >
        {isExpanded ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
      </button>
      
      {/* Branding */}
      <div 
        style={{
          padding: '24px',
          borderBottom: '1px solid rgba(220, 38, 38, 0.3)',
          marginBottom: '8px',
          background: 'linear-gradient(135deg, rgba(220, 38, 38, 0.1) 0%, transparent 100%)'
        }}
      >
        <div 
          style={{
            display: 'flex',
            justifyContent: isExpanded ? 'flex-start' : 'center',
            alignItems: 'center',
            marginBottom: '8px'
          }}
        >
          <div 
            style={{
              background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 50%, #B91C1C 100%)',
              borderRadius: '12px',
              padding: '8px',
              boxShadow: '0 10px 25px -5px rgba(239, 68, 68, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
            }}
          >
            <GraduationCap color="white" size={isExpanded ? 24 : 20} />
          </div>
          {isExpanded && (
            <div style={{ marginLeft: '12px' }}>
              <h2 
                style={{
                  fontWeight: 'bold',
                  fontSize: '20px',
                  color: 'white',
                  margin: 0,
                  textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
                }}
              >
                TweadUp
              </h2>
            </div>
          )}
        </div>
        {isExpanded && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div 
              style={{
                width: '8px',
                height: '8px',
                backgroundColor: '#EF4444',
                borderRadius: '50%',
                animation: 'pulse 2s infinite',
                boxShadow: '0 0 10px rgba(239, 68, 68, 0.5)'
              }}
            />
            <p 
              style={{
                color: '#FCA5A5',
                fontSize: '14px',
                fontWeight: '500',
                margin: 0,
                textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)'
              }}
            >
              {userRole.charAt(0).toUpperCase() + userRole.slice(1).toLowerCase()} Panel
            </p>
          </div>
        )}
      </div>
      
      {/* User info */}
      <div 
        style={{
          padding: '16px',
          borderBottom: '1px solid rgba(220, 38, 38, 0.3)',
          display: 'flex',
          justifyContent: isExpanded ? 'flex-start' : 'center'
        }}
      >
        {isExpanded ? (
          <div 
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              background: 'linear-gradient(135deg, rgba(75, 24, 24, 0.6) 0%, rgba(45, 27, 27, 0.6) 100%)',
              borderRadius: '12px',
              padding: '12px',
              border: '1px solid rgba(220, 38, 38, 0.3)',
              width: '100%',
              boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.1)'
            }}
          >
            <div 
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 50%, #B91C1C 100%)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                fontSize: '14px',
                boxShadow: '0 10px 25px -5px rgba(239, 68, 68, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                border: '2px solid rgba(255, 255, 255, 0.1)'
              }}
            >
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p 
                style={{
                  color: '#FCA5A5',
                  fontSize: '12px',
                  fontWeight: '500',
                  margin: '0 0 2px 0',
                  textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)'
                }}
              >
                Welcome back
              </p>
              <p 
                style={{
                  fontWeight: '600',
                  color: 'white',
                  fontSize: '14px',
                  margin: 0,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)'
                }}
              >
                {user?.name}
              </p>
            </div>
          </div>
        ) : (
          <div 
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 50%, #B91C1C 100%)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              boxShadow: '0 10px 25px -5px rgba(239, 68, 68, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
              border: '2px solid rgba(255, 255, 255, 0.1)'
            }}
          >
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
        )}
      </div>
      
      {/* Navigation */}
      <nav style={{ marginTop: '16px', flex: 1, padding: '0 12px' }}>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {navItems.map((item) => {
            const active = isActive(item.path);
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    textDecoration: 'none',
                    transition: 'all 0.2s ease-in-out',
                    position: 'relative',
                    overflow: 'hidden',
                    justifyContent: isExpanded ? 'flex-start' : 'center',
                    background: active 
                      ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.9) 0%, rgba(220, 38, 38, 0.9) 50%, rgba(185, 28, 28, 0.9) 100%)'
                      : 'transparent',
                    color: active ? 'white' : '#FCA5A5',
                    boxShadow: active ? '0 10px 25px -5px rgba(239, 68, 68, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)' : 'none',
                    border: active ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid transparent'
                  }}
                  onMouseEnter={(e) => {
                    if (!active) {
                      e.currentTarget.style.background = 'linear-gradient(135deg, rgba(75, 24, 24, 0.7) 0%, rgba(45, 27, 27, 0.7) 100%)';
                      e.currentTarget.style.color = 'white';
                      e.currentTarget.style.boxShadow = '0 5px 15px -5px rgba(220, 38, 38, 0.3)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!active) {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = '#FCA5A5';
                      e.currentTarget.style.boxShadow = 'none';
                    }
                  }}
                >
                  {/* Active indicator */}
                  {active && (
                    <div 
                      style={{
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        height: '100%',
                        width: '4px',
                        background: 'linear-gradient(180deg, #FCA5A5 0%, #FECACA 100%)',
                        borderRadius: '0 4px 4px 0',
                        boxShadow: '0 0 10px rgba(252, 165, 165, 0.5)'
                      }}
                    />
                  )}
                  
                  {/* Icon */}
                  <div style={{ color: active ? 'white' : item.color, flexShrink: 0, position: 'relative' }}>
                    {item.icon}
                    {/* Badge pour les notifications non lues */}
                    {item.badge && item.badge > 0 && (
                      <div style={{
                        position: 'absolute',
                        top: '-6px',
                        right: '-6px',
                        background: '#EF4444',
                        color: 'white',
                        borderRadius: '50%',
                        width: '18px',
                        height: '18px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '10px',
                        fontWeight: 'bold',
                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
                        border: '2px solid #7F1D1D'
                      }}>
                        {item.badge > 99 ? '99+' : item.badge}
                      </div>
                    )}
                  </div>
                  
                  {isExpanded && (
                    <>
                      <span 
                        style={{
                          marginLeft: '16px',
                          fontWeight: '500',
                          fontSize: '14px',
                          transition: 'all 0.2s ease-in-out',
                          textShadow: active ? '0 1px 2px rgba(0, 0, 0, 0.3)' : 'none',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          flex: 1
                        }}
                      >
                        {item.title}
                      </span>
                      <ChevronRight 
                        size={14} 
                        style={{
                          marginLeft: 'auto',
                          opacity: 0,
                          transition: 'all 0.2s ease-in-out'
                        }}
                      />
                    </>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      
      {/* Logout button */}
      <div style={{ padding: '16px', borderTop: '1px solid rgba(220, 38, 38, 0.3)' }}>
        <button
          onClick={logout}
          style={{
            display: 'flex',
            alignItems: 'center',
            borderRadius: '12px',
            transition: 'all 0.2s ease-in-out',
            background: 'linear-gradient(135deg, #DC2626 0%, #B91C1C 50%, #991B1B 100%)',
            color: 'white',
            boxShadow: '0 10px 25px -5px rgba(220, 38, 38, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
            border: '1px solid rgba(220, 38, 38, 0.3)',
            cursor: 'pointer',
            padding: isExpanded ? '12px 16px' : '12px',
            width: isExpanded ? '100%' : 'auto',
            justifyContent: isExpanded ? 'flex-start' : 'center',
            margin: isExpanded ? '0' : '0 auto'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.05)';
            e.currentTarget.style.background = 'linear-gradient(135deg, #B91C1C 0%, #991B1B 50%, #7F1D1D 100%)';
            e.currentTarget.style.boxShadow = '0 20px 40px -10px rgba(220, 38, 38, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.background = 'linear-gradient(135deg, #DC2626 0%, #B91C1C 50%, #991B1B 100%)';
            e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(220, 38, 38, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)';
          }}
        >
          <LogOut size={isExpanded ? 16 : 18} />
          {isExpanded && (
            <span style={{ marginLeft: '12px', fontWeight: '500', fontSize: '14px' }}>
              Logout
            </span>
          )}
        </button>
      </div>
      
      {/* Add CSS animations */}
      <style>
        {`
          @keyframes pulse {
            0%, 100% {
              opacity: 1;
            }
            50% {
              opacity: 0.5;
            }
          }
          
          @keyframes shine {
            0% {
              transform: translateX(-100%);
            }
            100% {
              transform: translateX(100%);
            }
          }
        `}
      </style>
    </div>
  );
};

export default Sidebar;