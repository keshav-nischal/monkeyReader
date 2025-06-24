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
// Or even simpler - use user and loading directly
const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
    const { user, loading } = useContext(AuthContext);
    
    if (loading) {
        return <div>Loading...</div>;
    }
    
    return user ? <>{children}</> : <Navigate to="/auth" replace />;
};
const AppRoutes = () => {
 
    return (
            <Routes>
                <Route path='/auth' element={<Authentication/>}></Route>
                <Route 
                    path="/" 
                    element={
                        <ProtectedRoute>
                            <Home />
                        </ProtectedRoute>
                    } 
                />
                <Route 
                    path="/home" 
                    element={
                        <ProtectedRoute>
                            <Home />
                        </ProtectedRoute>
                    } 
                />
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