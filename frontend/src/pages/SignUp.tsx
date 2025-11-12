import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Alert, AlertDescription } from '../components/ui/alert';
import { AlertCircle, Mail, Lock, User, ArrowLeft } from 'lucide-react';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '../components/ui/input-otp';
import { toast } from 'sonner';
import authImage from 'figma:asset/25b9347e01175272ae75dfe2e161b71b53ca49ac.png';

export const SignUp: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role] = useState<'user'>('user'); // 👈 default user role only
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showOtpStep, setShowOtpStep] = useState(false);
  const [otp, setOtp] = useState('');
  const [resendTimer, setResendTimer] = useState(0);
  const { signUp, verifySignUpOtp, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const result = await signUp(email, password, name, role);
      toast.success(result.message);
      setShowOtpStep(true);
      setResendTimer(60);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0) return;

    setLoading(true);
    try {
      const result = await signUp(email, password, name, role);
      toast.success('New verification code sent!');
      setResendTimer(60);
      setOtp('');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await verifySignUpOtp(email, otp);
      toast.success('Account created successfully!');
      navigate('/incidents'); // 👈 always goes to user page
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to verify OTP');
      setOtp('');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (value: string) => {
    setOtp(value);
    setError('');
    if (value.length === 6) {
      handleVerifyOtp();
    }
  };

  if (showOtpStep) {
    return (
      <div className="min-h-screen relative flex items-center justify-center px-4 py-8">
        <div className="absolute inset-0">
          <img src={authImage} alt="Authentication Background" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/50" />
        </div>

        <Link 
          to="/" 
          className="absolute top-6 left-6 z-20 flex items-center gap-2 text-white hover:text-white/80 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </Link>

        <Card className="w-full max-w-md relative z-10 shadow-2xl bg-white/10 backdrop-blur-lg border-white/20">
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 bg-red-500/20 backdrop-blur-sm rounded-full flex items-center justify-center border border-red-300/30">
                <Mail className="w-8 h-8 text-white" />
              </div>
            </div>
            <CardTitle className="text-center text-white">Verify Your Email</CardTitle>
            <CardDescription className="text-center text-white/80">
              We've sent a 6-digit verification code to<br />
              <span className="font-medium text-white">{email}</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <Alert variant="destructive" className="bg-red-500/20 border-red-300/30 backdrop-blur-sm">
                <AlertDescription className="text-white">{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-4">
              <Label htmlFor="otp" className="text-center block text-white">
                Enter Verification Code
              </Label>
              <div className="flex justify-center">
                <InputOTP maxLength={6} value={otp} onChange={handleOtpChange} disabled={loading}>
                  <InputOTPGroup>
                    {Array.from({ length: 6 }).map((_, i) => (
                      <InputOTPSlot key={i} index={i} className="bg-white/10 border-white/30 text-white" />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
              </div>
              <p className="text-xs text-center text-white/70">
                Check your email for the verification code
              </p>
            </div>

            <Button
              onClick={handleVerifyOtp}
              className="w-full bg-red-600 hover:bg-red-700 text-white"
              disabled={loading || otp.length !== 6}
            >
              {loading ? 'Verifying...' : 'Verify & Create Account'}
            </Button>

            <div className="text-center space-y-2">
              <p className="text-sm text-white/80">Didn't receive the code?</p>
              <Button
                variant="ghost"
                onClick={handleResendOtp}
                disabled={resendTimer > 0 || loading}
                className="text-white hover:text-white/80 hover:bg-white/10"
              >
                {resendTimer > 0 ? `Resend OTP in ${resendTimer}s` : 'Resend OTP'}
              </Button>
            </div>

            <Button
              variant="outline"
              onClick={() => {
                setShowOtpStep(false);
                setOtp('');
                setError('');
              }}
              className="w-full bg-white/10 border-white/30 text-white hover:bg-white/20"
            >
              Change Email
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center px-4 py-8">
      <div className="absolute inset-0">
        <img src={authImage} alt="Authentication Background" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/50" />
      </div>

      <Link 
        to="/" 
        className="absolute top-6 left-6 z-20 flex items-center gap-2 text-white hover:text-white/80 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Home</span>
      </Link>

      <Card className="w-full max-w-md relative z-10 shadow-2xl bg-white/10 backdrop-blur-lg border-white/20">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <AlertCircle className="w-12 h-12 text-white" />
          </div>
          <CardTitle className="text-center text-white">Create Account</CardTitle>
          <CardDescription className="text-center text-white/80">
            Join iReporter to report incidents in your community
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSendOtp} className="space-y-4">
            {error && (
              <Alert variant="destructive" className="bg-red-500/20 border-red-300/30 backdrop-blur-sm">
                <AlertDescription className="text-white">{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="name" className="text-white">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/60" />
                <Input
                  id="name"
                  type="text"
                  placeholder="Your Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="pl-10 bg-white/10 border-white/30 text-white placeholder:text-white/50 focus:bg-white/20"
                />
              </div>
            </div>

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
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pl-10 bg-white/10 border-white/30 text-white placeholder:text-white/50 focus:bg-white/20"
                />
              </div>
              <p className="text-xs text-white/70">Must be at least 6 characters</p>
            </div>

            <Button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white" disabled={loading}>
              {loading ? 'Sending OTP...' : 'Continue to Verification'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <div className="text-center text-sm text-white/80">
            Already have an account?{' '}
            <Link to="/signin" className="text-white hover:underline font-medium">
              Sign in
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};
