export const routes = [
  {
    path: '/',
    component: 'home-page',
    title: 'Home'
  },
  {
    path: '/login',
    component: 'login-page',
    title: 'Login'
  },
  {
    path: '/register',
    component: 'register-page',
    title: 'Register'
  },
  {
    path: '/profile',
    component: 'profile-page',
    authRequired: true,
    title: 'Your Profile'
  },
  {
    path: '/upload',
    component: 'upload-page',
    authRequired: true,
    title: 'Upload Music'
  },
  // Add other routes as needed
];
