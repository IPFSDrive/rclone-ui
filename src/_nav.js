export default {
  items: [
    // 去掉:Dashboard
    // {
    //     name: 'Dashboard',
    //     url: '/dashboard',
    //     icon: 'icon-speedometer'
    // },
    {
      name: 'Configs',
      url: '/showconfig',
      // icon: 'icon-note'
      icon: 'icon-link',
    },
    // 修改:Explorer -> Files
    {
      name: 'Files',
      url: '/remoteExplorer',
      icon: 'icon-docs'
    },
    // 去掉:Backend
    // {
    //     name: 'Backend',
    //     url: '/rcloneBackend',
    //     icon: 'icon-star',
    // },
    {
      name: 'Mounts',
      url: '/mountDashboard',
      // icon: 'fa fa-hdd-o icon-disc'
      icon: 'icon-drawer'
    },
    // 去掉:退出登录
    // {
    //     name: 'Log Out',
    //     url: '/login',
    //     icon: 'icon-logout',
    // },

  ],
};
