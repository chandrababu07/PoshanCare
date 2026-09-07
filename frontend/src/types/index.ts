export interface BaseUser {
  id: string;
  email: string;
  name?: string;
}

export interface NavItem {
  title: string;
  path: string;
  icon?: string;
}
