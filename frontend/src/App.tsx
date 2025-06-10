import { Route, Routes, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@/context/theme-provider';
import Authentication from '@/pages/Authentication';
import ReadingTest from '@/pages/ReadingTest';
import { BrowserRouter } from 'react-router-dom';
import { AuthContext, AuthProvider } from '@/context/authContext';
import { useContext, type ReactNode } from 'react';
import Home from '@/pages/Home';

type ProtectedRouteProps = {
    children: ReactNode;
};

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
    const { isAuthenticated } = useContext(AuthContext);
    return isAuthenticated ? <>{children}</> : <Navigate to="/auth" replace />;
};

const AppRoutes = () => {
    const { isAuthenticated } = useContext(AuthContext);
    
    return (
            <Routes>
                <Route path='/auth' element={<Authentication/>}></Route>
                <Route 
                    path="/" 
                    element={isAuthenticated ? <ReadingTest /> : <Navigate to="/auth" replace />} 
                />
                <Route path="/home" element={<Home />} />
                <Route 
                    path="/play" 
                    element={
                        <ProtectedRoute>
                            <ReadingTest />
                        </ProtectedRoute>
                    } 
                />

            </Routes>
    );
};

const App = () => {
    return (
        <BrowserRouter>
            <AuthProvider>
                <ThemeProvider>
                    <AppRoutes />
                </ThemeProvider>
            </AuthProvider>
        </BrowserRouter>
    );
};

export default App;