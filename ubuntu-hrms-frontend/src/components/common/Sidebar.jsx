import React, { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import {
  BsSpeedometer2,
  BsPeople,
  BsClipboard,
  BsCreditCard,
  BsGraphUp,
  BsCalendarCheck,
  BsCalendarX,
  BsCheckCircle,
  BsFileText,
  BsGear,
  BsPersonCheck,
  BsHandThumbsUp,
  BsPersonCircle,
  BsClipboardCheck,
  BsBriefcase,
  BsFileEarmarkText,
  BsBullseye,       // ✅ replace BsTarget
  BsCloudUpload,
  BsChevronLeft,
  BsChevronRight,
  BsChevronDown
} from 'react-icons/bs'


const Sidebar = ({ isOpen, onClose, isCollapsed, onToggleCollapse }) => {
  const { user } = useAuth()
  const role = user?.role
  const [collapsedGroups, setCollapsedGroups] = useState({})

  const toggleGroup = (title) => {
    setCollapsedGroups(prev => ({
      ...prev,
      [title]: !prev[title]
    }))
  }

  const getMenuGroups = () => {
    // Profile link for all logged-in users
    const profileItems = [
      { path: '/profile/view', label: 'Profile', icon: BsPersonCircle },
    ];

    // Recruitment links for relevant roles
    const recruitmentItems = [
      { path: '/recruitment/jobs', label: 'Recruitment', icon: BsClipboard },
    ];

    if (role === 'admin') return [
      {
        title: 'Overview',
        items: [
          { path: '/admin/dashboard', label: 'Dashboard', icon: BsSpeedometer2 },
        ]
      },
      {
        title: 'Administration',
        items: [
          { path: '/admin/users', label: 'Users', icon: BsPersonCircle },
          { path: '/admin/employees', label: 'Employees', icon: BsPeople },
          { path: '/admin/permissions', label: 'Permissions', icon: BsGear },
          { path: '/admin/settings', label: 'Settings', icon: BsGear },
        ]
      },
      {
        title: 'Time & Leave',
        items: [
          { path: '/admin/attendance', label: 'Attendance', icon: BsClipboardCheck },
          { path: '/admin/leaves', label: 'Leaves', icon: BsCalendarCheck },
          { path: '/leave/statutory', label: 'Statutory Leave Review', icon: BsFileEarmarkText },
        ]
      },
      {
        title: 'Finance',
        items: [
          // { path: '/admin/payroll', label: 'Payroll', icon: BsCreditCard },
          { path: '/payroll/disburse', label: 'Disburse Payroll', icon: BsCreditCard },
        ]
      },
      {
        title: 'Performance',
        items: [
          { path: '/admin/kpis', label: 'KPIs', icon: BsGraphUp },
        ]
      },
      {
        title: 'Contracts & Projects',
        items: [
          { path: '/admin/contracts', label: 'Contracts', icon: BsFileEarmarkText },
          { path: '/contracts/review', label: 'Review Submissions', icon: BsCheckCircle },
        ]
      },
      {
        title: 'Hiring',
        items: recruitmentItems,
      },
      {
        title: 'Account',
        items: profileItems,
      }
    ];

    if (role === 'manager' || role === 'supervisor') return [
      {
        title: 'Overview',
        items: [
          { path: '/manager/dashboard', label: 'Dashboard', icon: BsSpeedometer2 },
        ]
      },
      {
        title: 'Team Time & Leave',
        items: [
          { path: '/manager/attendance', label: 'Attendance', icon: BsClipboardCheck },
          { path: '/manager/leaves', label: 'Leave Approvals', icon: BsCalendarCheck },
          { path: '/leave/approvals', label: 'Pending Approvals', icon: BsCheckCircle },
          { path: '/leave/statutory', label: 'Statutory Leave Review', icon: BsFileEarmarkText },
        ]
      },
      {
        title: 'Performance',
        items: [
          { path: '/kpi/manage', label: 'Manage KPIs', icon: BsGraphUp },
        ]
      },
      // {
      //   title: 'Finance',
      //   items: [
      //     { path: '/payroll/disburse', label: 'Disburse Payroll', icon: BsCreditCard },
      //     { path: '/contracts/review', label: 'Review Submissions', icon: BsCheckCircle },
      //   ]
      // },
      {
        title: 'Hiring',
        items: recruitmentItems,
      },
      {
        title: 'Account',
        items: profileItems,
      }
    ];

    if (role === 'employee') return [
      {
        title: 'Overview',
        items: [
          { path: '/employee/dashboard', label: 'My Dashboard', icon: BsSpeedometer2 },
        ]
      },
      {
        title: 'Time & Leave',
        items: [
          { path: '/employee/punch', label: 'Manual Punch', icon: BsPersonCheck },
          { path: '/employee/attendance', label: 'My Attendance', icon: BsClipboardCheck },
          { path: '/employee/leaves', label: 'My Leaves', icon: BsCalendarCheck },
          { path: '/leave/request', label: 'Request Leave', icon: BsCalendarX },
        ]
      },
      {
        title: 'Performance',
        items: [
          { path: '/kpi/my-goals', label: 'My Goals', icon: BsBullseye },
        ]
      },
      {
        title: 'Finance',
        items: [
          { path: '/payroll/payslips', label: 'My Payslips', icon: BsFileText },
        ]
      },
      {
        title: 'Careers',
        items: [
          { path: '/recruitment/jobs-board', label: 'Job Board', icon: BsClipboard },
          { path: '/recruitment/my-applications', label: 'My Applications', icon: BsFileText },
        ]
      },
      {
        title: 'Account',
        items: profileItems,
      }
    ];

    if (role === 'contractor') return [
      {
        title: 'Overview',
        items: [
          { path: '/contractor/dashboard', label: 'Dashboard', icon: BsSpeedometer2 },
        ]
      },
      {
        title: 'Work',
        items: [
          { path: '/contractor/projects', label: 'Projects', icon: BsBriefcase },
          { path: '/contractor/portal', label: 'Submit Milestones', icon: BsCloudUpload },
          { path: '/contractor/invoices', label: 'Invoices', icon: BsFileEarmarkText },
        ]
      },
      {
        title: 'Account',
        items: profileItems,
      }
    ];

    return [
      {
        title: 'Overview',
        items: [
          { path: '/dashboard', label: 'Dashboard', icon: BsSpeedometer2 },
          ...profileItems
        ]
      }
    ];
  };

  const menuGroups = getMenuGroups();

  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 lg:hidden z-30"
          onClick={onClose}
        />
      )}
      
      <aside className={`fixed lg:static left-0 top-16 h-[calc(100vh-64px)] ${isCollapsed ? 'w-20' : 'w-64'} bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 transform transition-all duration-300 z-40 flex flex-col ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="flex-1 overflow-y-auto overflow-x-hidden py-4 scrollbar-hide">
          <nav className="flex flex-col gap-4 px-3">
            {menuGroups.map((group, groupIdx) => (
              <div key={groupIdx} className="flex flex-col gap-1">
                {!isCollapsed && (
                  <button 
                    onClick={() => toggleGroup(group.title)}
                    className="flex items-center justify-between w-full px-3 py-1 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                  >
                    <span>{group.title}</span>
                    {collapsedGroups[group.title] ? <BsChevronRight size={12} /> : <BsChevronDown size={12} />}
                  </button>
                )}
                {isCollapsed && groupIdx > 0 && <div className="border-t border-slate-200 dark:border-slate-700 my-1 mx-2" />}
                {(!collapsedGroups[group.title] || isCollapsed) && group.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors duration-200 ${
                        isActive
                          ? 'bg-primary dark:bg-primary-dark text-white'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                      onClick={onClose}
                      title={isCollapsed ? item.label : undefined}
                    >
                      <Icon size={20} className="min-w-[20px]" />
                      {!isCollapsed && <span className="font-medium whitespace-nowrap">{item.label}</span>}
                    </NavLink>
                  );
                })}
              </div>
            ))}
          </nav>
        </div>
        <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex justify-end hidden lg:flex">
          <button 
            onClick={onToggleCollapse} 
            className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-primary transition-colors flex items-center justify-center w-full"
            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {isCollapsed ? <BsChevronRight size={18} /> : <BsChevronLeft size={18} />}
          </button>
        </div>
      </aside>
    </>
  )
}

export default Sidebar
