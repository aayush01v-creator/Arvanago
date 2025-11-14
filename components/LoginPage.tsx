
import React, { useState } from 'react';
import Icon from './common/Icon.tsx';
import { signInWithGoogle, signInWithEmail, signUpWithEmail } from '../services/authService.ts';
import { LOGO_URL } from '../constants.ts';

interface LoginPageProps {
    onNavigateHome: () => void;
}

type AuthTab = 'signin' | 'signup';

const studyItems = [
    { id: 1, content: 'alpha', className: 'top-[15%] left-[10%]', size: 'text-7xl', duration: '22s', delay: '0s', animation: 'animate-float-1' },
    { id: 2, content: 'integral dx', className: 'top-[20%] right-[15%]', size: 'text-6xl', duration: '28s', delay: '-5s', animation: 'animate-float-2' },
    { id: 3, content: 'pi', className: 'bottom-[15%] left-[20%]', size: 'text-6xl', duration: '25s', delay: '-2s', animation: 'animate-float-2' },
    { id: 4, content: 'sin(theta)', className: 'bottom-[20%] right-[10%]', size: 'text-5xl', duration: '30s', delay: '-10s', animation: 'animate-float-1' },
    { id: 5, content: <Icon name="cube" className="w-16 h-16" />, className: 'top-[50%] left-[50%]', size: '', duration: '18s', delay: '-8s', animation: 'animate-blob' },
    { id: 6, content: <Icon name="iit" className="w-12 h-12" />, className: 'top-[65%] left-[15%]', size: '', duration: '32s', delay: '-3s', animation: 'animate-float-1' },
    { id: 7, content: <Icon name="send" className="w-12 h-12 transform -rotate-45" />, className: 'bottom-[5%] left-[45%]', size: '', duration: '20s', delay: '-15s', animation: 'animate-float-2' },
    { id: 8, content: 'E=mc^2', className: 'top-[70%] right-[25%]', size: 'text-4xl', duration: '26s', delay: '-7s', animation: 'animate-float-1' },
    { id: 9, content: 'H2O', className: 'top-[10%] right-[40%]', size: 'text-5xl', duration: '23s', delay: '-12s', animation: 'animate-float-2' },
    { id: 10, content: 'Sigma', className: 'top-[5%] left-[40%]', size: 'text-6xl', duration: '29s', delay: '-1s', animation: 'animate-float-1' },
    { id: 11, content: <Icon name="neet" className="w-14 h-14" />, className: 'bottom-[10%] right-[40%]', size: '', duration: '24s', delay: '-6s', animation: 'animate-float-2' },
    { id: 12, content: 'nabla^2', className: 'top-[40%] left-[5%]', size: 'text-5xl', duration: '31s', delay: '-9s', animation: 'animate-float-1' },
    { id: 13, content: <Icon name="test" className="w-10 h-10" />, className: 'bottom-[45%] right-[5%]', size: '', duration: '27s', delay: '-4s', animation: 'animate-float-2' },
];

const strengthConfig = {
    0: { width: '0%', colorClass: 'bg-transparent', shadowColor: 'transparent', label: '' },
    1: { width: '33%', colorClass: 'bg-red-500', shadowColor: '#ef4444', label: 'Weak' },
    2: { width: '66%', colorClass: 'bg-yellow-500', shadowColor: '#f59e0b', label: 'Okay' },
    3: { width: '100%', colorClass: 'bg-green-500', shadowColor: '#22c55e', label: 'Strong' },
};

const LoginPage: React.FC<LoginPageProps> = ({ onNavigateHome }) => {
    const [activeTab, setActiveTab] = useState<AuthTab>('signin');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState(0); // 0: none, 1: weak, 2: medium, 3: strong

    const currentStrength = strengthConfig[passwordStrength as keyof typeof strengthConfig];

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        // Allow only alphabets and spaces, and limit to 15 characters.
        const filteredValue = value.replace(/[^a-zA-Z\s]/g, '').slice(0, 15);
        setName(filteredValue);
    };
    
    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newPassword = e.target.value;
        setPassword(newPassword);

        if (activeTab === 'signup') {
            if (newPassword.length === 0) {
                setPasswordStrength(0);
                return;
            }

            let score = 0;
            if (newPassword.length >= 8) score++;
            if (/[a-z]/.test(newPassword)) score++;
            if (/[A-Z]/.test(newPassword)) score++;
            if (/[0-9]/.test(newPassword)) score++;
            if (/[\W_]/.test(newPassword)) score++; // Special character

            if (score <= 2) {
                setPasswordStrength(1); // Weak
            } else if (score <= 4) {
                setPasswordStrength(2); // Medium
            } else {
                setPasswordStrength(3); // Strong
            }
        }
    };

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email.trim() || !emailRegex.test(email)) {
            setError("Please use a valid email format (e.g., user@example.com).");
            return;
        }

        setLoading(true);

        try {
            if (activeTab === 'signup') {
                if (!name) throw { code: 'auth/missing-name' };
                await signUpWithEmail(name, email, password);
            } else {
                await signInWithEmail(email, password);
            }
        } catch (err: any) {
            let message;
            switch (err.code) {
                case 'auth/invalid-email':
                    message = "Please use a valid email format (e.g., user@example.com).";
                    break;
                case 'auth/email-already-in-use':
                    message = "This email is already registered. Please Sign In.";
                    break;
                case 'auth/weak-password':
                    message = "Password should be at least 6 characters long.";
                    break;
                case 'auth/invalid-credential':
                case 'auth/user-not-found':
                case 'auth/wrong-password':
                     message = "Invalid email or password. Please try again.";
                     break;
                case 'auth/missing-name':
                    message = "Please enter your full name.";
                    break;
                default:
                    message = err.message.replace('Firebase: ', '');
                    break;
            }
            setError(message || "An unknown error occurred.");
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        setError('');
        try {
            await signInWithGoogle();
        } catch (err: any) {
             setError(err.message || "Could not sign in with Google.");
        }
    }

    const welcomeContent = {
        signin: {
            title: 'Welcome Back!',
            subtitle: 'Sign in to continue your learning journey and unlock your full potential.',
        },
        signup: {
            title: 'Start Your Journey',
            subtitle: 'Create an account to access interactive courses, track progress, and join a community of learners.',
        }
    };
    
    const switchTab = (tab: AuthTab) => {
        setActiveTab(tab);
        setError('');
        setPassword('');
        setEmail('');
        setName('');
        setPasswordStrength(0);
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4 font-sans text-slate-800 dark:text-white relative overflow-hidden">
            {/* Background Blobs */}
            <div className="absolute -top-1/4 -left-1/4 w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-40 animate-blob dark:opacity-20"></div>
            <div className="absolute -bottom-1/4 -right-1/4 w-96 h-96 bg-indigo-300 rounded-full mix-blend-multiply filter blur-xl opacity-40 animate-blob dark:opacity-20" style={{animationDelay: '2s'}}></div>

            <div className="w-full max-w-4xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-lg rounded-2xl shadow-2xl flex flex-col md:flex-row overflow-hidden border border-white/30 dark:border-slate-700/50 relative z-10">
                {/* Left Panel - Welcome/Info */}
                <div className="w-full md:w-1/2 p-8 md:p-12 bg-gradient-to-br from-purple-800 to-indigo-900 text-white flex flex-col justify-center items-center text-center relative overflow-hidden">
                    <div className="absolute inset-0 z-0">
                        {studyItems.map(item => (
                            <div 
                                key={item.id}
                                className={`absolute text-white/20 font-mono will-change-transform ${item.className} ${item.size} ${item.animation}`}
                                style={{
                                    animationDuration: item.duration,
                                    animationDelay: item.delay,
                                }}
                            >
                                {item.content}
                            </div>
                        ))}
                    </div>

                    {/* Content */}
                    <div className="relative z-10">
                        <div key={activeTab} className="animate-fade-in space-y-6">
                            <div className="flex items-center justify-center">
                                <img src={LOGO_URL} alt="Edusimulate Logo" className="h-10 mr-3" />
                                <span className="text-3xl font-extrabold text-shadow text-white">Edusimulate</span>
                            </div>
                            <h1 className="text-4xl font-extrabold text-shadow">{welcomeContent[activeTab].title}</h1>
                            <p className="text-lg opacity-90 max-w-sm mx-auto">{welcomeContent[activeTab].subtitle}</p>
                        </div>
                    </div>
                </div>

                {/* Right Panel - Auth Form */}
                <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
                    <button onClick={onNavigateHome} className="absolute top-4 right-4 text-slate-500 dark:text-slate-400 hover:text-brand-primary transition">
                        <Icon name="x" className="w-6 h-6"/>
                    </button>
                    <div>
                        <div className="relative flex border-b border-slate-200 dark:border-slate-600 mb-6">
                            <button onClick={() => switchTab('signin')} className={`w-1/2 pb-3 font-semibold text-lg transition-colors duration-300 ${activeTab === 'signin' ? 'text-brand-primary' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>Sign In</button>
                            <button onClick={() => switchTab('signup')} className={`w-1/2 pb-3 font-semibold text-lg transition-colors duration-300 ${activeTab === 'signup' ? 'text-brand-primary' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>Sign Up</button>
                            <div 
                                className="absolute bottom-[-1px] h-0.5 bg-brand-primary transition-transform duration-300 ease-in-out"
                                style={{
                                    width: '50%',
                                    transform: activeTab === 'signin' ? 'translateX(0%)' : 'translateX(100%)'
                                }}
                            />
                        </div>
                        
                        <form onSubmit={handleFormSubmit} noValidate>
                            <div className={`transition-all duration-500 ease-in-out overflow-hidden transform ${activeTab === 'signup' ? 'max-h-20 opacity-100 translate-y-0' : 'max-h-0 opacity-0 -translate-y-4 pointer-events-none'}`}>
                                <div className="mb-4">
                                    <input type="text" placeholder="Full Name" aria-label="Full Name" value={name} onChange={handleNameChange} required={activeTab === 'signup'} tabIndex={activeTab === 'signup' ? 0 : -1} className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-700 border-2 border-transparent focus:border-brand-primary focus:ring-0 rounded-lg outline-none transition" />
                                </div>
                            </div>
                            <div className="mb-4">
                                <input type="email" placeholder="Email Address" aria-label="Email Address" value={email} onChange={e => setEmail(e.target.value)} required className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-700 border-2 border-transparent focus:border-brand-primary focus:ring-0 rounded-lg outline-none transition" />
                            </div>
                            <div className="mb-4">
                                <input type="password" placeholder="Password" aria-label="Password" value={password} onChange={handlePasswordChange} required className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-700 border-2 border-transparent focus:border-brand-primary focus:ring-0 rounded-lg outline-none transition" />
                            </div>
                            
                            <div className={`transition-all duration-500 ease-in-out overflow-hidden transform ${activeTab === 'signup' ? 'max-h-24 opacity-100 translate-y-0' : 'max-h-0 opacity-0 -translate-y-4 pointer-events-none'}`}>
                                <div className="pt-1 mb-2">
                                    <div className="w-full bg-slate-200 dark:bg-slate-600 rounded-full h-2 my-1 overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all duration-300 ${currentStrength.colorClass}`}
                                            style={{
                                                width: currentStrength.width,
                                                boxShadow: passwordStrength > 0 ? `0 0 8px 1px ${currentStrength.shadowColor}` : 'none'
                                            }}
                                        />
                                    </div>
                                    <p className={`text-xs h-4 text-right transition-colors duration-300 ${
                                        passwordStrength === 1 ? 'text-red-500' :
                                        passwordStrength === 2 ? 'text-yellow-500' :
                                        passwordStrength === 3 ? 'text-green-500' : 'text-transparent'
                                    }`}>
                                        {currentStrength.label}
                                    </p>
                                </div>
                            </div>
                            
                            {error && <p className="text-red-500 text-sm text-center py-2 animate-fade-in">{error}</p>}

                            <button type="submit" disabled={loading || (activeTab === 'signup' && passwordStrength < 2)} className="w-full mt-2 bg-brand-primary text-white font-bold py-3 px-6 rounded-lg hover:bg-brand-secondary transition-all duration-300 shadow-lg transform hover:scale-105 active:scale-95 hover:shadow-brand-primary/50 disabled:bg-slate-400 disabled:scale-100 disabled:shadow-none disabled:cursor-not-allowed dark:disabled:bg-slate-600">
                                {loading ? (
                                    <Icon name="spinner" className="w-6 h-6 animate-spin mx-auto"/>
                                ) : (activeTab === 'signin' ? 'Sign In' : 'Create Account')}
                            </button>
                        </form>

                        <div className="flex items-center my-6">
                            <hr className="flex-grow border-slate-200 dark:border-slate-600" />
                            <span className="mx-4 text-sm text-slate-500">OR</span>
                            <hr className="flex-grow border-slate-200 dark:border-slate-600" />
                        </div>

                        <button onClick={handleGoogleSignIn} className="w-full flex items-center justify-center py-3 px-4 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-all transform active:scale-95">
                            <svg className="w-6 h-6 mr-3" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M21.35 11.1H12.18V13.83H18.67C18.36 15.53 17.27 16.92 15.68 17.84V20.14H18.3C20.44 18.23 21.62 15.22 21.62 12.24C21.62 11.83 21.5 11.46 21.35 11.1Z"/>
                                <path fill="#34A853" d="M11.99 21.89C14.77 21.89 17.06 21.03 18.7 19.43L15.93 17.38C15.01 18.03 13.62 18.52 11.99 18.52C9.43 18.52 7.23 16.89 6.43 14.69H3.6V16.94C5.23 20.07 8.35 21.89 11.99 21.89Z"/>
                                <path fill="#FBBC05" d="M6.43 14.69C6.2 14.04 6.09 13.35 6.09 12.64C6.09 11.93 6.2 11.24 6.43 10.59V8.34H3.6C2.82 9.87 2.37 11.24 2.37 12.64C2.37 14.04 2.82 15.41 3.6 16.94L6.43 14.69Z"/>
                                <path fill="#EA4335" d="M11.99 6.48C13.29 6.48 14.39 6.94 15.21 7.72L17.9 5.02C16.32 3.51 14.28 2.61 11.99 2.61C8.75 2.61 5.8 4.4 4.18 6.98L6.96 9.03C7.76 6.83 9.68 5.48 11.99 5.48Z"/>
                            </svg>
                            <span className="font-semibold text-slate-700 dark:text-slate-200">Continue with Google</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
