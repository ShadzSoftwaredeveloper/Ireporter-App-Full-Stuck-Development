import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { AlertCircle, Flag, MapPin, Camera, TrendingUp, Users, FileText, Apple, Smartphone } from 'lucide-react';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import heroImage from 'figma:asset/3e90d8aa38a951664e37e44868034fce4e9ef44d.png';
import { toast } from 'sonner';

export const Landing: React.FC = () => {
  const navigate = useNavigate();

  const handleSignIn = () => {
    toast.info('Redirecting to Sign In page...');
    navigate('/signin');
  };

  const handleSignUp = () => {
    toast.info('Redirecting to Sign Up page...');
    navigate('/signup');
  };

  const handleAppStoreClick = () => {
    toast.success('App Store link clicked! Coming soon...');
  };

  const handlePlayStoreClick = () => {
    toast.success('Google Play link clicked! Coming soon...');
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="w-[90%] max-w-[1200px] mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="bg-red-600 rounded-lg p-2">
                <AlertCircle className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-red-600">iReporter</h1>
                <p className="text-xs text-[rgb(0,0,0)]">Empowering Communities</p>
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={handleSignIn}
              >
                Sign In
              </Button>
              <Button
                onClick={handleSignUp} className="bg-[rgb(213,20,20)]"
              >
                Sign Up
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section - Inspired by the provided image */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 bg-[rgba(241,15,15,0.83)]">
        <div className="w-[90%] max-w-[1200px] mx-auto px-4   ">
          <div className="grid lg:grid-cols-2 gap-8 md:gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-4 md:space-y-6 lg:space-y-8 text-center lg:text-left">
              {/* Brand Label */}
              {/* <div>
                <span className="text-red-600 tracking-wider text-sm">IREPORTER</span>
              </div> */}

              {/* Main Heading */}
              <div>
                <h2 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl text-gray-900 leading-tight mb-4 font-[ADLaM_Display]">
                  Report <span className="relative inline-block">
                    <span className="relative z-10">Corruption</span>
                    
                  </span> 
                </h2>
              </div>

              {/* Description */}
              <p className="text-gray-600 text-base md:text-lg max-w-xl leading-relaxed mx-auto lg:mx-0">
                iReporter is a platform that enables citizens to bring any form of corruption to 
                the notice of appropriate authorities and the general public.
              </p>

              {/* Download Buttons */}
              <div className="flex flex-col sm:flex-row flex-wrap gap-3 md:gap-4 justify-center lg:justify-start">
                <button className="bg-black text-white px-4 md:px-6 py-2.5 md:py-3 rounded-lg flex items-center justify-center gap-2 md:gap-3 hover:bg-gray-800 hover:scale-105 transition-all duration-300 shadow-md hover:shadow-lg" onClick={handleAppStoreClick}>
                  <Apple className="w-5 h-5 md:w-6 md:h-6" />
                  <div className="text-left">
                    <div className="text-xs">Download on the</div>
                    <div className="text-sm">App Store</div>
                  </div>
                </button>
                <button className="bg-black text-white px-4 md:px-6 py-2.5 md:py-3 rounded-lg flex items-center justify-center gap-2 md:gap-3 hover:bg-gray-800 hover:scale-105 transition-all duration-300 shadow-md hover:shadow-lg" onClick={handlePlayStoreClick}>
                  <Smartphone className="w-5 h-5 md:w-6 md:h-6" />
                  <div className="text-left">
                    <div className="text-xs">GET IT ON</div>
                    <div className="text-sm">Google Play</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Right Content - Image and Stats */}
            <div className="relative mt-8 lg:mt-0">
              {/* Stats Cards */}
              <div className="absolute top-4 md:top-8 left-0 bg-[rgb(246,239,239)] rounded-xl md:rounded-2xl shadow-lg px-3 py-2 md:px-6 md:py-4 z-10 animate-float">
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="flex -space-x-2">
                    <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 border-2 border-white"></div>
                    <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 border-2 border-white"></div>
                    <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-gradient-to-br from-pink-400 to-pink-600 border-2 border-white"></div>
                  </div>
                  <div>
                    <div className="text-sm md:text-base text-gray-900">120k+</div>
                    <div className="text-xs md:text-sm text-gray-500">Active users</div>
                  </div>
                </div>
              </div>

              <div className="absolute top-1/2 right-0 bg-[rgb(251,242,242)] rounded-xl md:rounded-2xl shadow-lg px-3 py-2 md:px-6 md:py-4 z-10 animate-float-delay">
                <div>
                  <div className="text-xs md:text-sm text-gray-500 mb-1">Reports Received</div>
                  <div className="text-lg md:text-2xl text-red-600">+35,890.00</div>
                </div>
              </div>

              {/* Hero Image */}
              <div className="relative">
                <ImageWithFallback
                  src={heroImage}
                  alt="Person using iReporter app"
                  className="w-full max-w-md md:max-w-lg mx-auto lg:ml-auto rounded-2xl"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-20 right-20 w-20 h-20 bg-purple-200 rounded-full opacity-50 blur-2xl"></div>
        <div className="absolute bottom-20 left-20 w-32 h-32 bg-blue-200 rounded-full opacity-50 blur-3xl"></div>
      </section>

      {/* Features Section */}
      <section className="w-[90%] max-w-[1200px] mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-red-50 text-red-600 px-4 py-2 rounded-full border border-red-200 mb-4">
            <Flag className="w-4 h-4" />
            <span>Why Choose iReporter</span>
          </div>
          <h2 className="text-gray-900 mb-4 text-3xl md:text-4xl font-[ADLaM_Display]">
            Powerful Features for Community Impact
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto text-lg">
            Our platform provides all the tools you need to report incidents effectively and track their resolution.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="bg-red-100 w-14 h-14 rounded-xl flex items-center justify-center mb-6">
              <MapPin className="w-7 h-7 text-red-600" />
            </div>
            <h3 className="text-gray-900 mb-3 text-xl font-[ADLaM_Display]">Geolocation Tracking</h3>
            <p className="text-gray-600 leading-relaxed">
              Pinpoint exact incident locations with interactive Google Maps integration and precise GPS coordinates.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="bg-orange-100 w-14 h-14 rounded-xl flex items-center justify-center mb-6">
              <Camera className="w-7 h-7 text-orange-600" />
            </div>
            <h3 className="text-gray-900 mb-3 text-xl font-[ADLaM_Display]">Media Evidence</h3>
            <p className="text-gray-600 leading-relaxed">
              Upload photos and videos to provide compelling visual evidence and strengthen your reports.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="bg-[rgb(255,226,226)] w-14 h-14 rounded-xl flex items-center justify-center mb-6">
              <TrendingUp className="w-7 h-7 text-blue-600" />
            </div>
            <h3 className="text-gray-900 mb-3 text-xl font-[ADLaM_Display]">Real-time Updates</h3>
            <p className="text-gray-600 leading-relaxed">
              Monitor the status of your reports and track resolution progress with instant notifications.
            </p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      {/* <section className="bg-gradient-to-br from-red-600 to-orange-600 py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto text-center">
            <div>
              <div className="text-4xl md:text-5xl text-white mb-2">35,890+</div>
              <div className="text-white/90">Reports Filed</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl text-white mb-2">120k+</div>
              <div className="text-white/90">Active Users</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl text-white mb-2">85%</div>
              <div className="text-white/90">Resolution Rate</div>
            </div>
          </div>
        </div>
      </section> */}

      {/* CTA Section */}
      {/* <section className="w-[90%] max-w-[1200px] mx-auto px-4 py-20">
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-12 md:p-16 text-center">
          <h2 className="text-white mb-4 text-3xl md:text-4xl">
            Ready to Make a Difference?
          </h2>
          <p className="text-white/80 text-lg mb-8 max-w-2xl mx-auto">
            Join thousands of citizens already using iReporter to create positive change in their communities.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              size="lg"
              onClick={() => navigate('/signup')}
              className="px-8 py-6 text-lg w-full sm:w-auto"
            >
              Create Free Account
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => navigate('/signin')}
              className="bg-white/10 backdrop-blur-sm text-white border-white/30 hover:bg-white/20 px-8 py-6 text-lg w-full sm:w-auto"
            >
              Sign In
            </Button>
          </div>
        </div>
      </section> */}

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-200 py-12">
        <div className="w-[90%] max-w-[1200px] mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="bg-red-600 rounded-lg p-2">
                <AlertCircle className="w-7 h-7 text-white" />
              </div>
              <div>
                <span className="text-gray-900 block">iReporter</span>
                <span className="text-sm text-gray-500">Empowering Communities</span>
              </div>
            </div>
            <div className="text-gray-600 text-center md:text-right">
              <p>© 2025 iReporter. All rights reserved.</p>
              <p className="text-sm text-gray-500 mt-1">Building transparency through technology</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};