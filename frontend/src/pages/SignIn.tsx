import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Alert, AlertDescription } from '../components/ui/alert';
import { AlertCircle, Mail, Lock, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { API_ENDPOINTS, getAuthHeaders } from '../config/api';
import authImage from 'figma:asset/25b9347e01175272ae75dfe2e161b71b53ca49ac.png';

export const SignIn: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'credentials' | 'otp'>('credentials');
  
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const response = await fetch(API_ENDPOINTS.SIGNIN, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const text = await response.text();
      let data;
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        console.error('Failed to parse response:', text);
        throw new Error('Invalid response from server');
      }

      if (!response.ok) {
        throw new Error(data?.message || 'Invalid email or password');
      }

      toast.success('OTP sent to your email!');
      setStep('otp');
      setOtp('');
    } catch (err: any) {
      const msg = err instanceof Error ? err.message : String(err) || 'Failed to send OTP';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(API_ENDPOINTS.VERIFY_OTP, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, code: otp }),
      });

      const text = await response.text();
      let data;
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        console.error('Failed to parse response:', text);
        throw new Error('Invalid response from server');
      }

      if (!response.ok) {
        throw new Error(data?.message || 'Invalid OTP');
      }

      const user = data?.data?.user;
      const token = data?.data?.token;

      if (token && user) {
        // Store token and user in localStorage
        localStorage.setItem('authToken', token);
        localStorage.setItem('user', JSON.stringify(user));
        
        toast.success('Successfully signed in!');
        
        // Add a small delay to ensure context reads the localStorage
        // then navigate based on user role
        setTimeout(() => {
          if (user?.role === 'admin') {
            navigate('/admin');
          } else {
            navigate('/incidents');
          }
        }, 200);
      } else {
        throw new Error('No token or user received from server');
      }
    } catch (err: any) {
      const msg = err instanceof Error ? err.message : String(err) || 'Failed to verify OTP';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToCredentials = () => {
    setStep('credentials');
    setOtp('');
    setError('');
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center px-4 py-8">
      {/* Full Background Image */}
      <div className="absolute inset-0">
        <img 
          src={authImage} 
          alt="Authentication Background" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/50" /> {/* Dark overlay */}
      </div>

      {/* Back to Landing Button */}
      <Link 
        to="/" 
        className="absolute top-6 left-6 z-20 flex items-center gap-2 text-white hover:text-white/80 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Home</span>
      </Link>

      {/* Sign In Form as Transparent Popup */}
      <Card className="w-full max-w-md relative z-10 shadow-2xl bg-white/10 backdrop-blur-lg border-white/20">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <AlertCircle className="w-12 h-12 text-white" />
          </div>
          <CardTitle className="text-center text-white">
            {step === 'credentials' ? 'Welcome Back' : 'Verify OTP'}
          </CardTitle>
          <CardDescription className="text-center text-white/80">
            {step === 'credentials' 
              ? 'Sign in to your iReporter account' 
              : `Enter the OTP sent to ${email}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === 'credentials' ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              {error && (
                <Alert variant="destructive" className="bg-red-500/20 border-red-300/30 backdrop-blur-sm">
                  <AlertDescription className="text-white">{error}</AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email" className="text-white">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/60" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="pl-10 bg-white/10 border-white/30 text-white placeholder:text-white/50 focus:bg-white/20"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-white">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/60" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pl-10 pr-10 bg-white/10 border-white/30 text-white placeholder:text-white/50 focus:bg-white/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white" disabled={loading}>
                {loading ? 'Sending OTP...' : 'Send OTP'}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              {error && (
                <Alert variant="destructive" className="bg-red-500/20 border-red-300/30 backdrop-blur-sm">
                  <AlertDescription className="text-white">{error}</AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="otp" className="text-white">Enter OTP Code</Label>
                <Input
                  id="otp"
                  type="text"
                  placeholder="000000"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.slice(0, 6))}
                  maxLength={6}
                  className="text-center text-2xl tracking-widest bg-white/10 border-white/30 text-white placeholder:text-white/50 focus:bg-white/20"
                />
                <p className="text-xs text-white/60 text-center mt-2">
                  OTP expires in 10 minutes
                </p>
              </div>

              <Button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white" disabled={loading || otp.length !== 6}>
                {loading ? 'Verifying...' : 'Verify OTP'}
              </Button>

              <Button 
                type="button" 
                variant="outline" 
                className="w-full text-white border-white/30 hover:bg-white/10"
                onClick={handleBackToCredentials}
                disabled={loading}
              >
                Back to Sign In
              </Button>
            </form>
          )}
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <div className="text-center text-sm text-white/80">
            Don't have an account?{' '}
            <Link to="/signup" className="text-white hover:underline font-medium">
              Sign up
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};
