import React from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import {
  BsSpeedometer2,
  BsPeople,
  BsClipboard,
  BsCreditCard,
  BsGraphUp,
  BsCalendarCheck,
  BsFileText,
  BsGear,
  BsPersonCheck,
  BsHandThumbsUp,
  BsPersonCircle,
  BsClipboardCheck,
} from 'react-icons/bs'

const Sidebar = ({ isOpen, onClose }) => {
  const { user } = useAuth()
  const role = user?.role

  const getMenuItems = () => {
    const baseItems = [
      { path: '/dashboard', label: 'Dashboard', icon: BsSpeedometer2 },
    ];

    // Profile link for all logged-in users
    const profileItems = [
      { path: '/profile/view', label: 'Profile', icon: BsPersonCircle },
    ];

    // Recruitment links for relevant roles
    const recruitmentItems = [
      { path: '/recruitment/jobs', label: 'Recruitment', icon: BsClipboard },
    ];

    const adminItems = [
      { path: '/admin/dashboard', label: 'Dashboard', icon: BsSpeedometer2 },
      { path: '/admin/users', label: 'Users', icon: BsPersonCircle },
      { path: '/admin/employees', label: 'Employees', icon: BsPeople },
      { path: '/admin/attendance', label: 'Attendance', icon: BsClipboardCheck },
      { path: '/admin/permissions', label: 'Permissions', icon: BsGear },
      ...recruitmentItems,
      ...profileItems,
    ];

    const managerItems = [
      { path: '/manager/dashboard', label: 'Dashboard', icon: BsSpeedometer2 },
      { path: '/manager/attendance', label: 'Attendance', icon: BsClipboardCheck },
      ...recruitmentItems,
      ...profileItems,
    ];

    const employeeItems = [
      { path: '/employee/dashboard', label: 'My Dashboard', icon: BsSpeedometer2 },
      { path: '/employee/attendance', label: 'My Attendance', icon: BsClipboardCheck },
      { path: '/employee/punch', label: 'Manual Punch', icon: BsPersonCheck },
      { path: '/recruitment/jobs-board', label: 'Job Board', icon: BsClipboard },
      { path: '/recruitment/my-applications', label: 'My Applications', icon: BsFileText },
      ...profileItems,
    ];

    if (role === 'admin') return adminItems;
    if (role === 'manager' || role === 'supervisor') return managerItems;
    if (role === 'employee') return employeeItems;

    return baseItems;
  };

  const menuItems = getMenuItems();

  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 lg:hidden z-30"
          onClick={onClose}
        />
      )}
      
      <aside className={`fixed lg:static left-0 top-16 h-[calc(100vh-64px)] w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 transform transition-transform duration-300 z-40 overflow-y-auto ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <nav className="flex flex-col gap-1 p-4">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors duration-200 ${
                  isActive
                    ? 'bg-primary dark:bg-primary-dark text-white'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
                onClick={onClose}
              >
                <Icon size={20} />
                <span className="font-medium">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </aside>
    </>
  )
}

export default Sidebar
