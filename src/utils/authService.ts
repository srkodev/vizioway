
interface User {
  id: string;
  name: string;
  email?: string;
}

export const authService = {
  login(name: string, email?: string): User {
    const user: User = {
      id: crypto.randomUUID(),
      name,
      email
    };
    localStorage.setItem('user', JSON.stringify(user));
    return user;
  },

  logout(): void {
    localStorage.removeItem('user');
  },

  getCurrentUser(): User | null {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    try {
      return JSON.parse(userStr) as User;
    } catch (e) {
      console.error('Erreur lors de la récupération de l\'utilisateur:', e);
      return null;
    }
  },

  isAuthenticated(): boolean {
    return !!this.getCurrentUser();
  }
};
