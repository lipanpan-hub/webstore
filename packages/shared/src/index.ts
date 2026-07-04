export interface User {
  id: number
  name: string
  email: string
  role: 'admin' | 'user'
}

export interface ApiResponse<T = unknown> {
  code: number
  message: string
  data: T
}
